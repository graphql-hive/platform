import { createModule } from 'graphql-modules';
import { AuditLogManager } from '../audit-logs/providers/audit-logs-manager';
import { ClickHouse } from '../operations/providers/clickhouse-client';
import { TokenManager } from './providers/token-manager';
import { TokenStorage } from './providers/token-storage';
import { resolvers } from './resolvers.generated';
import typeDefs from './module.graphql';

export const tokenModule = createModule({
  id: 'token',
  dirname: __dirname,
  typeDefs,
  resolvers,
  providers: [TokenManager, TokenStorage, AuditLogManager, ClickHouse],
});
