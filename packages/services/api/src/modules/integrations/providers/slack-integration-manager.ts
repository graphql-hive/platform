import { Injectable, Scope } from 'graphql-modules';
import { AccessError } from '../../../shared/errors';
import { AuthManager } from '../../auth/providers/auth-manager';
import { OrganizationAccessScope } from '../../auth/providers/organization-access';
import { ProjectAccessScope } from '../../auth/providers/project-access';
import { TargetAccessScope } from '../../auth/providers/target-access';
import { CryptoProvider } from '../../shared/providers/crypto';
import { Logger } from '../../shared/providers/logger';
import {
  OrganizationSelector,
  ProjectSelector,
  Storage,
  TargetSelector,
} from '../../shared/providers/storage';
import { IntegrationsAccessContext } from './integrations-access-context';

@Injectable({
  scope: Scope.Operation,
  global: true,
})
export class SlackIntegrationManager {
  private logger: Logger;

  constructor(
    logger: Logger,
    private authManager: AuthManager,
    private storage: Storage,
    private crypto: CryptoProvider,
  ) {
    this.logger = logger.child({
      source: 'SlackIntegrationManager',
    });
  }

  async register(
    input: OrganizationSelector & {
      token: string;
    },
  ): Promise<void> {
    this.logger.debug('Registering Slack integration (organization=%s)', input.organizationId);
    await this.authManager.ensureOrganizationAccess({
      ...input,
      scope: OrganizationAccessScope.INTEGRATIONS,
    });
    this.logger.debug('Updating organization');
    await this.storage.addSlackIntegration({
      organizationId: input.organizationId,
      token: this.crypto.encrypt(input.token),
    });
  }

  async unregister(input: OrganizationSelector): Promise<void> {
    this.logger.debug('Removing Slack integration (organization=%s)', input.organizationId);
    await this.authManager.ensureOrganizationAccess({
      ...input,
      scope: OrganizationAccessScope.INTEGRATIONS,
    });
    this.logger.debug('Updating organization');
    await this.storage.deleteSlackIntegration({
      organizationId: input.organizationId,
    });
  }

  async isAvailable(selector: OrganizationSelector): Promise<boolean> {
    this.logger.debug('Checking Slack integration (organization=%s)', selector.organizationId);
    const token = await this.getToken({
      organizationId: selector.organizationId,
      context: IntegrationsAccessContext.Integrations,
    });

    return typeof token === 'string';
  }

  async getToken(
    selector: OrganizationSelector & {
      context: IntegrationsAccessContext.Integrations;
    },
  ): Promise<string | null | undefined>;
  async getToken(
    selector: ProjectSelector & {
      context: IntegrationsAccessContext.ChannelConfirmation;
    },
  ): Promise<string | null | undefined>;
  async getToken(
    selector: TargetSelector & {
      context: IntegrationsAccessContext.SchemaPublishing;
    },
  ): Promise<string | null | undefined>;
  async getToken(
    selector:
      | (OrganizationSelector & {
          context: IntegrationsAccessContext.Integrations;
        })
      | (ProjectSelector & {
          context: IntegrationsAccessContext.ChannelConfirmation;
        })
      | (TargetSelector & {
          context: IntegrationsAccessContext.SchemaPublishing;
        }),
  ): Promise<string | null | undefined> {
    switch (selector.context) {
      case IntegrationsAccessContext.Integrations: {
        this.logger.debug(
          'Fetching Slack integration token (organization=%s, context: %s)',
          selector.organizationId,
          selector.context,
        );
        await this.authManager.ensureOrganizationAccess({
          ...selector,
          scope: OrganizationAccessScope.INTEGRATIONS,
        });
        break;
      }
      case IntegrationsAccessContext.ChannelConfirmation: {
        this.logger.debug(
          'Fetching Slack integration token (organization=%s, project=%s, context: %s)',
          selector.organizationId,
          selector.projectId,
          selector.context,
        );
        await this.authManager.ensureProjectAccess({
          ...selector,
          scope: ProjectAccessScope.ALERTS,
        });
        break;
      }
      case IntegrationsAccessContext.SchemaPublishing: {
        this.logger.debug(
          'Fetching Slack integration token (organization=%s, project=%s, target=%s context: %s)',
          selector.organizationId,
          selector.projectId,
          selector.targetId,
          selector.context,
        );
        await this.authManager.ensureTargetAccess({
          ...selector,
          scope: TargetAccessScope.REGISTRY_WRITE,
        });
        break;
      }
      default: {
        throw new AccessError('wrong context');
      }
    }

    let token = await this.storage.getSlackIntegrationToken({
      organizationId: selector.organizationId,
    });

    if (token) {
      /**
       * Token is possibly not encrypted, that's why we pass `true` as second argument.
       */
      token = this.crypto.decrypt(token, true);
    }

    return token;
  }
}
