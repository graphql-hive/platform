import { z } from 'zod';
import { AuditLogManager } from '../../../audit-logs/providers/audit-logs-manager';
import { AuthManager } from '../../../auth/providers/auth-manager';
import { IdTranslator } from '../../../shared/providers/id-translator';
import { ProjectManager } from '../../providers/project-manager';
import { ProjectSlugModel } from '../../validation';
import type { MutationResolvers } from './../../../../__generated__/types.next';

const UpdateProjectSlugModel = z.object({
  slug: ProjectSlugModel,
});

export const updateProjectSlug: NonNullable<MutationResolvers['updateProjectSlug']> = async (
  _parent,
  { input },
  { injector },
) => {
  const inputParseResult = UpdateProjectSlugModel.safeParse(input);

  if (!inputParseResult.success) {
    return {
      error: {
        message:
          inputParseResult.error.formErrors.fieldErrors.slug?.[0] ?? 'Please check your input.',
      },
    };
  }

  const translator = injector.get(IdTranslator);
  const [organizationId, projectId] = await Promise.all([
    translator.translateOrganizationId(input),
    translator.translateProjectId(input),
  ]);

  const result = await injector.get(ProjectManager).updateSlug({
    slug: input.slug,
    organization: organizationId,
    project: projectId,
  });

  if (result.ok) {
    const currentUser = await injector.get(AuthManager).getCurrentUser();
    injector.get(AuditLogManager).createLogAuditEvent(
      {
        eventType: 'PROJECT_SETTINGS_UPDATED',
        projectSettingsUpdatedAuditLogSchema: {
          projectId: projectId,
          updatedFields: JSON.stringify({
            newSlug: input.slug,
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
          organization: input.organization,
          project: result.project.cleanId,
        },
        project: result.project,
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
