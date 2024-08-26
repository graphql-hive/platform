import { AuditLogManager } from '../../../audit-logs/providers/audit-logs-manager';
import type { MutationResolvers } from './../../../../__generated__/types';

export const exportOrganizationAuditLog: NonNullable<
  MutationResolvers['exportOrganizationAuditLog']
> = async (_parent, arg, ctx) => {
  const organizationId = arg.selector.organizationSlug;
  const auditLogManager = ctx.injector.get(AuditLogManager);

  const result = await auditLogManager.exportAndSendEmail(organizationId, {
    endDate: arg.filter.endDate,
    startDate: arg.filter.startDate,
  });

  if (result.error || !result.ok) {
    return {
      error: {
        message: result?.error?.message || 'Failed to export audit logs',
      },
      ok: null,
    };
  }
  return {
    error: null,
    ok: {
      url: result.ok.url,
    },
  };
};
