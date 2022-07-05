import { fetch } from 'cross-undici-fetch';
import type { FastifyLoggerInstance } from '@hive/service-common';
import { createStorage as createPostgreSQLStorage } from '@hive/storage';

import { startOfMonth, endOfMonth } from 'date-fns';
import * as Sentry from '@sentry/node';
import { createTRPCClient } from '@trpc/client';
import type { UsageEstimatorApi } from '@hive/usage-estimator';
import type { RateLimitInput } from './api';
import { rateLimitOperationsEventOrg, rateLimitSchemaEventOrg } from './metrics';

export type RateLimitCheckResponse = {
  limited: boolean;
  quota: number;
  current: number;
};

const UNKNOWN_RATE_LIMIT_OBJ: RateLimitCheckResponse = {
  current: -1,
  quota: -1,
  limited: false,
};

export type CachedRateLimitInfo = {
  orgName: string;
  schemaPushes: RateLimitCheckResponse;
  operations: RateLimitCheckResponse;
  retentionInDays: number;
};

const DEFAULT_RETENTION = 30; // days

export type Limiter = ReturnType<typeof createRateLimiter>;

type OrganizationId = string;
type TargetId = string;

export function createRateLimiter(config: {
  logger: FastifyLoggerInstance;
  rateLimitConfig: {
    interval: number;
  };
  rateEstimator: {
    endpoint: string;
  };
  storage: {
    connectionString: string;
  };
}) {
  const rateEstimator = createTRPCClient<UsageEstimatorApi>({
    url: `${config.rateEstimator.endpoint}/trpc`,
    fetch,
  });

  const { logger } = config;
  const postgres$ = createPostgreSQLStorage(config.storage.connectionString);
  let initialized = false;
  let intervalHandle: ReturnType<typeof setInterval> | null = null;

  let targetIdToOrgLookup = new Map<TargetId, OrganizationId>();
  let cachedResult = new Map<OrganizationId, CachedRateLimitInfo>();

  async function fetchAndCalculateUsageInformation() {
    const now = new Date();
    const window = {
      startTime: startOfMonth(now).toUTCString(),
      endTime: endOfMonth(now).toUTCString(),
    };
    config.logger.info(`Calculating rate-limit information based on window: ${window.startTime} -> ${window.endTime}`);
    const storage = await postgres$;

    const [records, operations, pushes] = await Promise.all([
      storage.getGetOrganizationsAndTargetPairsWithLimitInfo(),
      rateEstimator.query('estimateOperationsForAllTargets', window),
      rateEstimator.query('estiamteSchemaPushesForAllTargets', window),
    ]);

    logger.debug(`Fetched total of ${Object.keys(records).length} targets from the DB`);
    logger.debug(`Fetched total of ${Object.keys(operations).length} targets with usage information`);
    logger.debug(`Fetched total of ${Object.keys(pushes).length} targets with schema push information`);

    const newTargetIdToOrgLookup = new Map<TargetId, OrganizationId>();
    const newCachedResult = new Map<OrganizationId, CachedRateLimitInfo>();

    for (const pairRecord of records) {
      newTargetIdToOrgLookup.set(pairRecord.target, pairRecord.organization);

      if (!newCachedResult.has(pairRecord.organization)) {
        newCachedResult.set(pairRecord.organization, {
          orgName: pairRecord.org_name,
          operations: {
            current: 0,
            quota: pairRecord.limit_operations_monthly,
            limited: false,
          },
          schemaPushes: {
            current: 0,
            quota: pairRecord.limit_schema_push_monthly,
            limited: false,
          },
          retentionInDays: pairRecord.limit_retention_days,
        });
      }

      const orgRecord = newCachedResult.get(pairRecord.organization)!;
      orgRecord.operations.current = (orgRecord.operations.current || 0) + (operations[pairRecord.target] || 0);
      orgRecord.schemaPushes.current = (orgRecord.schemaPushes.current || 0) + (pushes[pairRecord.target] || 0);
    }

    newCachedResult.forEach((orgRecord, orgId) => {
      const orgName = orgRecord.orgName;
      orgRecord.operations.limited =
        orgRecord.operations.quota === 0 ? false : orgRecord.operations.current > orgRecord.operations.quota;
      orgRecord.schemaPushes.limited =
        orgRecord.schemaPushes.quota === 0 ? false : orgRecord.schemaPushes.current > orgRecord.schemaPushes.quota;

      if (orgRecord.operations.limited) {
        rateLimitOperationsEventOrg.labels({ orgId, orgName }).inc();
        logger.info(
          `Organization "${orgName}"/"${orgId}" is now being rate-limited for operations (${orgRecord.operations.current}/${orgRecord.operations.quota})`
        );
      }

      if (orgRecord.schemaPushes.limited) {
        rateLimitSchemaEventOrg.labels({ orgId, orgName }).inc();
        logger.info(
          `Organization "${orgName}"/"${orgId}" is now being rate-limited for schema pushes (${orgRecord.schemaPushes.current}/${orgRecord.schemaPushes.quota})`
        );
      }
    });

    cachedResult = newCachedResult;
    targetIdToOrgLookup = newTargetIdToOrgLookup;
    logger.info(`Built a new rate-limit map: %s`, JSON.stringify(Array.from(newCachedResult.entries())));
  }

  return {
    logger,
    readiness() {
      return initialized;
    },
    getRetention(targetId: string) {
      const orgId = targetIdToOrgLookup.get(targetId);

      if (!orgId) {
        return DEFAULT_RETENTION;
      }

      const orgData = cachedResult.get(orgId);

      if (!orgData) {
        return DEFAULT_RETENTION;
      }

      return orgData.retentionInDays;
    },
    checkLimit(input: RateLimitInput): RateLimitCheckResponse {
      const orgId = input.entityType === 'organization' ? input.id : targetIdToOrgLookup.get(input.id);

      if (!orgId) {
        logger.warn(
          `Failed to resolve/find rate limit information for entityId=${input.id} (type=${input.entityType})`
        );

        return UNKNOWN_RATE_LIMIT_OBJ;
      }

      const orgData = cachedResult.get(orgId);

      if (!orgData) {
        return UNKNOWN_RATE_LIMIT_OBJ;
      }

      if (input.type === 'operations-reporting') {
        return orgData.operations;
      } else if (input.type === 'schema-push') {
        return orgData.schemaPushes;
      } else {
        return UNKNOWN_RATE_LIMIT_OBJ;
      }
    },
    async start() {
      logger.info(
        `Rate Limiter starting, will update rate-limit information every ${config.rateLimitConfig.interval}ms`
      );
      await fetchAndCalculateUsageInformation().catch(e => {
        logger.error(e, `Failed to fetch rate-limit info from usage-estimator, error: `);
      });

      initialized = true;
      intervalHandle = setInterval(async () => {
        logger.info(`Interval triggered, updating internval rate-limit cache...`);

        try {
          await fetchAndCalculateUsageInformation();
        } catch (error) {
          logger.error(error, `Failed to update rate-limit cache`);
          Sentry.captureException(error, {
            level: 'error',
          });
        }
      }, config.rateLimitConfig.interval);
    },
    async stop() {
      initialized = false; // to make readiness check == false
      if (intervalHandle) {
        clearInterval(intervalHandle);
        intervalHandle = null;
      }
      logger.info('Rate Limiter stopped');
    },
  };
}
