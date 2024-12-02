import { createModule } from 'graphql-modules';
import { AuditLogManager } from '../audit-logs/providers/audit-logs-manager';
import { TargetManager } from './providers/target-manager';
import { resolvers } from './resolvers.generated';
import typeDefs from './module.graphql';

export const targetModule = createModule({
  id: 'target',
  dirname: __dirname,
  typeDefs,
  resolvers,
  providers: [TargetManager, AuditLogManager],
});
