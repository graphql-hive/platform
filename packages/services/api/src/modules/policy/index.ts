import { createModule } from 'graphql-modules';
import { AuditLogManager } from '../audit-logs/providers/audit-logs-manager';
import { SchemaPolicyApiProvider } from './providers/schema-policy-api.provider';
import { SchemaPolicyProvider } from './providers/schema-policy.provider';
import { resolvers } from './resolvers.generated';
import typeDefs from './module.graphql';

export const schemaPolicyModule = createModule({
  id: 'policy',
  dirname: __dirname,
  typeDefs,
  resolvers,
  providers: [SchemaPolicyProvider, SchemaPolicyApiProvider, AuditLogManager],
});
