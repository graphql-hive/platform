import { z } from 'zod';
import { AuditLogManager } from '../../../audit-logs/providers/audit-logs-manager';
import { AuthManager } from '../../../auth/providers/auth-manager';
import { IdTranslator } from '../../../shared/providers/id-translator';
import { TargetManager } from '../../providers/target-manager';
import { TargetSlugModel } from '../../validation';
import type { MutationResolvers } from './../../../../__generated__/types.next';

const UpdateTargetSlugModel = z.object({
  slug: TargetSlugModel,
});

export const updateTargetSlug: NonNullable<MutationResolvers['updateTargetSlug']> = async (
  _parent,
  { input },
  { injector },
) => {
  const inputParseResult = UpdateTargetSlugModel.safeParse(input);
  if (!inputParseResult.success) {
    return {
      error: {
        message:
          inputParseResult.error.formErrors.fieldErrors.slug?.[0] ?? 'Please check your input.',
      },
    };
  }

  const translator = injector.get(IdTranslator);
  const [organizationId, projectId, targetId] = await Promise.all([
    translator.translateOrganizationId({
      organizationSlug: input.organizationSlug,
    }),
    translator.translateProjectId({
      organizationSlug: input.organizationSlug,
      projectSlug: input.projectSlug,
    }),
    translator.translateTargetId({
      organizationSlug: input.organizationSlug,
      projectSlug: input.projectSlug,
      targetSlug: input.targetSlug,
    }),
  ]);

  const result = await injector.get(TargetManager).updateSlug({
    slug: input.slug,
    organizationId: organizationId,
    projectId: projectId,
    targetId: targetId,
  });

  if (result.ok) {
    const currentUser = await injector.get(AuthManager).getCurrentUser();
    injector.get(AuditLogManager).createLogAuditEvent(
      {
        eventType: 'TARGET_SETTINGS_UPDATED',
        targetSettingsUpdatedAuditLogSchema: {
          projectId: projectId,
          targetId: targetId,
          updatedFields: JSON.stringify({
            newName: input.slug,
          }),
        },
      },
      {
        organizationId: organizationId,
        userEmail: currentUser.email,
        userId: currentUser.id,
        user: currentUser,
      },
    );

    return {
      ok: {
        selector: {
          organizationSlug: input.organizationSlug,
          projectSlug: input.projectSlug,
          targetSlug: result.target.slug,
        },
        target: result.target,
      },
    };
  }

  return {
    ok: null,
    error: {
      message: result.message,
    },
  };
};
