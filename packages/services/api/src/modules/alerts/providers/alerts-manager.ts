import { Injectable, Scope } from 'graphql-modules';
import type { AlertsModule } from '../__generated__/types';
import type { Alert, AlertChannel } from '../../../shared/entities';
import { cache } from '../../../shared/helpers';
import { Session } from '../../auth/lib/authz';
import { IntegrationsAccessContext } from '../../integrations/providers/integrations-access-context';
import { SlackIntegrationManager } from '../../integrations/providers/slack-integration-manager';
import { OrganizationManager } from '../../organization/providers/organization-manager';
import { ProjectManager } from '../../project/providers/project-manager';
import { Logger } from '../../shared/providers/logger';
import type { ProjectSelector } from '../../shared/providers/storage';
import { Storage } from '../../shared/providers/storage';
import { ChannelConfirmationInput, SchemaChangeNotificationInput } from './adapters/common';
import { TeamsCommunicationAdapter } from './adapters/msteams';
import { SlackCommunicationAdapter } from './adapters/slack';
import { WebhookCommunicationAdapter } from './adapters/webhook';

@Injectable({
  scope: Scope.Operation,
  global: true,
})
export class AlertsManager {
  private logger: Logger;

  constructor(
    logger: Logger,
    private session: Session,
    private slackIntegrationManager: SlackIntegrationManager,
    private slack: SlackCommunicationAdapter,
    private webhook: WebhookCommunicationAdapter,
    private teamsWebhook: TeamsCommunicationAdapter,
    private organizationManager: OrganizationManager,
    private projectManager: ProjectManager,
    private storage: Storage,
  ) {
    this.logger = logger.child({ source: 'AlertsManager' });
  }

  async addChannel(input: AlertsModule.AddAlertChannelInput): Promise<AlertChannel> {
    this.logger.debug(
      'Adding Alert Channel (organization=%s, project=%s, type=%s)',
      input.organization,
      input.project,
      input.type,
    );
    await this.session.assertPerformAction({
      action: 'alert:modify',
      organizationId: input.organization,
      params: {
        organizationId: input.organization,
        projectId: input.project,
      },
    });

    const channel = await this.storage.addAlertChannel(input);

    await this.triggerChannelConfirmation({
      kind: 'created',
      channel,
      organization: input.organization,
      project: input.project,
    });

    return channel;
  }

  async deleteChannels(
    input: ProjectSelector & {
      channels: readonly string[];
    },
  ): Promise<readonly AlertChannel[]> {
    this.logger.debug(
      'Deleting Alert Channels (organization=%s, project=%s, size=%s)',
      input.organization,
      input.project,
      input.channels.length,
    );
    await this.session.assertPerformAction({
      action: 'alert:modify',
      organizationId: input.organization,
      params: {
        organizationId: input.organization,
        projectId: input.project,
      },
    });
    const channels = await this.storage.deleteAlertChannels(input);

    await Promise.all(
      channels.map(channel =>
        this.triggerChannelConfirmation({
          kind: 'deleted',
          channel,
          organization: input.organization,
          project: input.project,
        }),
      ),
    );

    return channels;
  }

  @cache<ProjectSelector>(selector => selector.project + selector.organization)
  async getChannels(selector: ProjectSelector): Promise<readonly AlertChannel[]> {
    this.logger.debug(
      'Fetching Alert Channels (organization=%s, project=%s)',
      selector.organization,
      selector.project,
    );
    await this.session.assertPerformAction({
      action: 'alert:describe',
      organizationId: selector.organization,
      params: {
        organizationId: selector.organization,
        projectId: selector.project,
      },
    });
    return this.storage.getAlertChannels(selector);
  }

  async addAlert(input: AlertsModule.AddAlertInput): Promise<Alert> {
    this.logger.debug(
      'Adding Alert (organization=%s, project=%s, type=%s)',
      input.organization,
      input.project,
      input.type,
    );
    await this.session.assertPerformAction({
      action: 'alert:modify',
      organizationId: input.organization,
      params: {
        organizationId: input.organization,
        projectId: input.project,
      },
    });

    return this.storage.addAlert(input);
  }

  async deleteAlerts(
    input: ProjectSelector & {
      alerts: readonly string[];
    },
  ): Promise<readonly Alert[]> {
    this.logger.debug(
      'Deleting Alerts (organization=%s, project=%s, size=%s)',
      input.organization,
      input.project,
      input.alerts.length,
    );
    await this.session.assertPerformAction({
      action: 'alert:modify',
      organizationId: input.organization,
      params: {
        organizationId: input.organization,
        projectId: input.project,
      },
    });
    return this.storage.deleteAlerts(input);
  }

  async getAlerts(selector: ProjectSelector): Promise<readonly Alert[]> {
    this.logger.debug(
      'Fetching Alerts (organization=%s, project=%s)',
      selector.organization,
      selector.project,
    );
    await this.session.assertPerformAction({
      action: 'alert:describe',
      organizationId: selector.organization,
      params: {
        organizationId: selector.organization,
        projectId: selector.project,
      },
    });
    return this.storage.getAlerts(selector);
  }

  async triggerSchemaChangeNotifications(event: SchemaChangeNotificationInput['event']) {
    const organization = event.organization.id;
    const project = event.project.id;
    const target = event.target.id;

    this.logger.debug(
      'Triggering Schema Change Notifications (organization=%s, project=%s, target=%s, version=%s)',
      organization,
      project,
      target,
      event.schema.id,
    );

    const [channels, alerts] = await Promise.all([
      this.getChannels({ organization, project }),
      this.getAlerts({ organization, project }),
    ]);

    const matchingAlerts = alerts.filter(
      alert => alert.type === 'SCHEMA_CHANGE_NOTIFICATIONS' && alert.targetId === target,
    );
    const pairs = matchingAlerts.map(alert => {
      return {
        alert,
        channel: channels.find(channel => channel.id === alert.channelId)!,
      };
    });

    const slackToken = await this.slackIntegrationManager.getToken({
      organization: event.organization.id,
      project: event.project.id,
      target: event.target.id,
      context: IntegrationsAccessContext.SchemaPublishing,
    });

    const integrations: SchemaChangeNotificationInput['integrations'] = {
      slack: {
        token: slackToken,
      },
      // ms Teams is integrated via webhook. Webhook contains the token in itself, so we don't have any other token for it
    };

    // Let's not leak any data :)
    const safeEvent: SchemaChangeNotificationInput['event'] = {
      organization: {
        id: event.organization.id,
        cleanId: event.organization.cleanId,
        name: event.organization.name,
      },
      project: {
        id: event.project.id,
        cleanId: event.project.cleanId,
        name: event.project.name,
      },
      target: {
        id: event.target.id,
        cleanId: event.target.cleanId,
        name: event.target.name,
      },
      schema: {
        id: event.schema.id,
        commit: event.schema.commit,
        valid: event.schema.valid,
      },
      changes: event.changes,
      messages: event.messages,
      errors: event.errors,
      initial: event.initial,
    };

    await Promise.all(
      pairs.map(({ channel, alert }) => {
        if (channel.type === 'SLACK') {
          return this.slack.sendSchemaChangeNotification({
            event: safeEvent,
            alert,
            channel,
            integrations,
          });
        }
        if (channel.type === 'MSTEAMS_WEBHOOK') {
          return this.teamsWebhook.sendSchemaChangeNotification({
            event: safeEvent,
            alert,
            channel,
            integrations,
          });
        }

        return this.webhook.sendSchemaChangeNotification({
          event: safeEvent,
          alert,
          channel,
          integrations,
        });
      }),
    );
  }

  async triggerChannelConfirmation(input: {
    kind: 'created' | 'deleted';
    channel: AlertChannel;
    organization: string;
    project: string;
  }): Promise<void> {
    const { channel } = input;
    const [organization, project] = await Promise.all([
      this.organizationManager.getOrganization({
        organization: input.organization,
      }),
      this.projectManager.getProject({
        organization: input.organization,
        project: input.project,
      }),
    ]);

    const channelConfirmationContext: ChannelConfirmationInput = {
      event: {
        kind: input.kind,
        organization: {
          id: organization.id,
          cleanId: organization.cleanId,
          name: organization.name,
        },
        project: {
          id: project.id,
          cleanId: project.cleanId,
          name: project.name,
        },
      },
      channel,
      integrations: {
        slack: {
          token: null,
        },
      },
    };

    if (channel.type === 'SLACK') {
      const slackToken = await this.slackIntegrationManager.getToken({
        organization: organization.id,
        project: project.id,
        context: IntegrationsAccessContext.ChannelConfirmation,
      });
      if (!slackToken) {
        throw new Error(`Slack token was not found for channel "${channel.id}"`);
      }

      channelConfirmationContext.integrations.slack.token = slackToken;
      await this.slack.sendChannelConfirmation(channelConfirmationContext);
    } else if (channel.type === 'MSTEAMS_WEBHOOK') {
      await this.teamsWebhook.sendChannelConfirmation(channelConfirmationContext);
    } else {
      await this.webhook.sendChannelConfirmation();
    }
  }
}
