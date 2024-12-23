import { createConnection } from '../../../shared/schema';
import type {
  ResolversTypes,
  SchemaWarningConnectionResolvers,
} from './../../../__generated__/types';

const connection = createConnection<ResolversTypes['SchemaCheckWarning']>();

export const SchemaWarningConnection: SchemaWarningConnectionResolvers = {
  nodes: connection.nodes,
  total: connection.total,
};
