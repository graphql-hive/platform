import { createModule } from 'graphql-modules';
import { AuditLogManager } from '../audit-logs/providers/audit-logs-manager';
import { GitHubIntegrationManager } from './providers/github-integration-manager';
import { SlackIntegrationManager } from './providers/slack-integration-manager';
import { resolvers } from './resolvers.generated';
import typeDefs from './module.graphql';

export const integrationsModule = createModule({
  id: 'integrations',
  dirname: __dirname,
  typeDefs,
  resolvers,
  providers: [SlackIntegrationManager, GitHubIntegrationManager, AuditLogManager],
});
