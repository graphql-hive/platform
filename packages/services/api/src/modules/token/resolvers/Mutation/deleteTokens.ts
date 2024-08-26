import { AuditLogManager } from '../../../audit-logs/providers/audit-logs-manager';
import { AuthManager } from '../../../auth/providers/auth-manager';
import { IdTranslator } from '../../../shared/providers/id-translator';
import { TokenManager } from '../../providers/token-manager';
import type { MutationResolvers } from './../../../../__generated__/types.next';

export const deleteTokens: NonNullable<MutationResolvers['deleteTokens']> = async (
  _parent,
  { input },
  { injector },
) => {
  const translator = injector.get(IdTranslator);
  const [organizationId, projectId, targetId] = await Promise.all([
    translator.translateOrganizationId(input),
    translator.translateProjectId(input),
    translator.translateTargetId(input),
  ]);
  const result = {
    selector: {
      organizationSlug: input.organizationSlug,
      projectSlug: input.projectSlug,
      targetSlug: input.targetSlug,
    },
    deletedTokens: await injector.get(TokenManager).deleteTokens({
      targetId,
      projectId,
      organizationId,
      tokenIds: input.tokenIds,
    }),
  };

  const currentUser = await injector.get(AuthManager).getCurrentUser();
  injector.get(AuditLogManager).createLogAuditEvent(
    {
      eventType: 'TARGET_SETTINGS_UPDATED',
      targetSettingsUpdatedAuditLogSchema: {
        targetId: target,
        projectId: project,
        updatedFields: JSON.stringify({
          deleteTokens: true,
          tokens: input.tokens,
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

  return result;
};
