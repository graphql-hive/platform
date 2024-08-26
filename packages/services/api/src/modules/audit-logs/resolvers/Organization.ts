import {
  decodeCreatedAtAndUUIDIdBasedCursor,
  encodeCreatedAtAndUUIDIdBasedCursor,
} from '@hive/storage';
import { AuditLogManager } from '../providers/audit-logs-manager';
import type { OrganizationResolvers } from './../../../__generated__/types';

/*
 * Note: This object type is generated because "OrganizationMapper" is declared. This is to ensure runtime safety.
 *
 * When a mapper is used, it is possible to hit runtime errors in some scenarios:
 * - given a field name, the schema type's field type does not match mapper's field type
 * - or a schema type's field does not exist in the mapper's fields
 *
 * If you want to skip this file generation, remove the mapper or update the pattern in the `resolverGeneration.object` config.
 */
export const Organization: Pick<OrganizationResolvers, 'auditLogs' | '__isTypeOf'> = {
  /* Implement Organization resolver logic here */
  auditLogs: async (organization, arg, ctx) => {
    const result = await ctx.injector
      .get(AuditLogManager)
      .getPaginatedAuditLogs(organization.id, arg.first, arg.after);

    const limit = arg.first ? (arg.first > 0 ? Math.min(arg.first, 20) : 20) : 20;
    const cursor = arg.after ? decodeCreatedAtAndUUIDIdBasedCursor(arg.after) : null;

    let items = result.data.map(row => {
      return {
        cursor: encodeCreatedAtAndUUIDIdBasedCursor({
          createdAt: row.eventAction,
          id: row.id,
        }),
        node: row,
      };
    });

    const hasNextPage = items.length > limit;
    const hasPreviousPage = cursor !== null;

    return {
      edges: items,
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        startCursor: items[0]?.cursor,
        endCursor: items[items.length - 1]?.cursor,
      },
    };
  },
};
