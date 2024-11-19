import { createModule } from 'graphql-modules';
import { resolvers } from './resolvers.generated';
import typeDefs from './module.graphql';
import { PreflightScriptProvider } from './providers/preflight-script.provider';

export const labModule = createModule({
  id: 'lab',
  dirname: __dirname,
  typeDefs,
  resolvers,
  providers: [],
});

export const preflightScriptModule = createModule({
  id: 'preflight-script',
  dirname: __dirname,
  typeDefs,
  resolvers,
  providers: [PreflightScriptProvider],
});
