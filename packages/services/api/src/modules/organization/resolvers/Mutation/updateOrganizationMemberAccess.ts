import { AuditLogManager } from '../../../audit-logs/providers/audit-logs-manager';
import { AuthManager } from '../../../auth/providers/auth-manager';
import { IdTranslator } from '../../../shared/providers/id-translator';
import { OrganizationManager } from '../../providers/organization-manager';
import type { MutationResolvers } from './../../../../__generated__/types.next';

export const updateOrganizationMemberAccess: NonNullable<
  MutationResolvers['updateOrganizationMemberAccess']
> = async (_, { input }, { injector }) => {
  const organizationId = await injector.get(IdTranslator).translateOrganizationId(input);

  const currentUser = await injector.get(AuthManager).getCurrentUser();
  injector.get(AuditLogManager).createLogAuditEvent(
    {
      eventType: 'ORGANIZATION_SETTINGS_UPDATED',
      organizationSettingsUpdatedAuditLogSchema: {
        updatedFields: JSON.stringify({
          members: {
            updated: input,
          },
        }),
      },
    },
    {
      organizationId: organization,
      userEmail: currentUser.email,
      userId: currentUser.id,
      user: currentUser,
    },
  );

  return {
    selector: {
      organizationSlug: input.organizationSlug,
    },
    organization: await injector.get(OrganizationManager).updateMemberAccess({
      organizationId: organizationId,
      user: input.userId,
      organizationScopes: input.organizationScopes,
      projectScopes: input.projectScopes,
      targetScopes: input.targetScopes,
    }),
  };
};
