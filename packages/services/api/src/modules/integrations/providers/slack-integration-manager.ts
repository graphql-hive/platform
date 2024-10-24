import { Injectable, Scope } from 'graphql-modules';
import { AccessError } from '../../../shared/errors';
import { Session } from '../../auth/lib/authz';
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
    private session: Session,
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
    this.logger.debug('Registering Slack integration (organization=%s)', input.organization);
    await this.session.assertPerformAction({
      action: 'slackIntegration:modify',
      organizationId: input.organization,
      params: {
        organizationId: input.organization,
      },
    });
    this.logger.debug('Updating organization');
    await this.storage.addSlackIntegration({
      organization: input.organization,
      token: this.crypto.encrypt(input.token),
    });
  }

  async unregister(input: OrganizationSelector): Promise<void> {
    this.logger.debug('Removing Slack integration (organization=%s)', input.organization);
    await this.session.assertPerformAction({
      action: 'slackIntegration:modify',
      organizationId: input.organization,
      params: {
        organizationId: input.organization,
      },
    });
    this.logger.debug('Updating organization');
    await this.storage.deleteSlackIntegration({
      organization: input.organization,
    });
  }

  async isAvailable(selector: OrganizationSelector): Promise<boolean> {
    this.logger.debug('Checking Slack integration (organization=%s)', selector.organization);
    const token = await this.getToken({
      organization: selector.organization,
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
          selector.organization,
          selector.context,
        );
        await this.session.assertPerformAction({
          action: 'slackIntegration:modify',
          organizationId: selector.organization,
          params: {
            organizationId: selector.organization,
          },
        });
        break;
      }
      case IntegrationsAccessContext.ChannelConfirmation: {
        this.logger.debug(
          'Fetching Slack integration token (organization=%s, project=%s, context: %s)',
          selector.organization,
          selector.project,
          selector.context,
        );
        await this.session.assertPerformAction({
          action: 'alert:modify',
          organizationId: selector.organization,
          params: {
            organizationId: selector.organization,
            projectId: selector.project,
          },
        });
        break;
      }
      case IntegrationsAccessContext.SchemaPublishing: {
        this.logger.debug(
          'Fetching Slack integration token (organization=%s, project=%s, target=%s context: %s)',
          selector.organization,
          selector.project,
          selector.target,
          selector.context,
        );
        await this.session.assertPerformAction({
          action: 'schema:publish',
          organizationId: selector.organization,
          params: {
            organizationId: selector.organization,
            projectId: selector.project,
            targetId: selector.target,
            serviceName: null,
          },
        });
        break;
      }
      default: {
        throw new AccessError('wrong context');
      }
    }

    let token = await this.storage.getSlackIntegrationToken({
      organization: selector.organization,
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
