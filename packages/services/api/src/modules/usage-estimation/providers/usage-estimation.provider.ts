import { Inject, Injectable, Scope } from 'graphql-modules';
import type { UsageEstimatorApi, UsageEstimatorApiInput } from '@hive/usage-estimator';
import { createTRPCProxyClient, httpLink } from '@trpc/client';
import { sentry } from '../../../shared/sentry';
import { Logger } from '../../shared/providers/logger';
import type { UsageEstimationServiceConfig } from './tokens';
import { USAGE_ESTIMATION_SERVICE_CONFIG } from './tokens';

@Injectable({
  scope: Scope.Singleton,
})
export class UsageEstimationProvider {
  private logger: Logger;
  private usageEstimator;

  constructor(
    logger: Logger,
    @Inject(USAGE_ESTIMATION_SERVICE_CONFIG)
    usageEstimationConfig: UsageEstimationServiceConfig,
  ) {
    this.logger = logger.child({ service: 'UsageEstimationProvider' });
    this.usageEstimator = usageEstimationConfig.endpoint
      ? createTRPCProxyClient<UsageEstimatorApi>({
          links: [
            httpLink({
              url: `${usageEstimationConfig.endpoint}/trpc`,
              fetch,
            }),
          ],
        })
      : null;
  }

  @sentry('UsageEstimation.estimateOperationsForOrganization')
  async estimateOperationsForOrganization(
    input: UsageEstimatorApiInput['estimateOperationsForOrganization'],
  ): Promise<number | null> {
    this.logger.debug('Estimation operations, input: %o', input);

    if (!this.usageEstimator) {
      this.logger.warn('Usage estimator is not available due to missing configuration');

      return null;
    }

    const result = await this.usageEstimator.estimateOperationsForOrganization.query(input);

    return result.totalOperations;
  }

  @sentry('UsageEstimation.estimateOperationsForTargets')
  async estimateOperationsForTargets(
    input: UsageEstimatorApiInput['estimateOperationsForTargets'],
  ): Promise<number | null> {
    // TODO: once 006 migration is done, delete this method
    this.logger.debug('Estimation operations, input: %o', input);

    if (!this.usageEstimator) {
      this.logger.warn('Usage estimator is not available due to missing configuration');

      return null;
    }

    const result = await this.usageEstimator.estimateOperationsForTargets.query(input);

    return result.totalOperations;
  }
}
