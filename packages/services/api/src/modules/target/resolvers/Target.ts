import { OrganizationManager } from '../../organization/providers/organization-manager';
import { ProjectManager } from '../../project/providers/project-manager';
import { TargetManager } from '../providers/target-manager';
import type { TargetResolvers } from './../../../__generated__/types.next';

export const Target: Pick<
  TargetResolvers,
  | 'cleanId'
  | 'experimental_forcedLegacySchemaComposition'
  | 'graphqlEndpointUrl'
  | 'id'
  | 'name'
  | 'project'
  | 'slug'
  | 'validationSettings'
  | '__isTypeOf'
> = {
  project: (target, _args, { injector }) =>
    injector.get(ProjectManager).getProject({
      projectId: target.projectId,
      organizationId: target.orgId,
    }),
  validationSettings: async (target, _args, { injector }) => {
    const targetManager = injector.get(TargetManager);

    const settings = await targetManager.getTargetSettings({
      organizationId: target.orgId,
      projectId: target.projectId,
      targetId: target.id,
    });

    return {
      ...settings.validation,
      targets: await Promise.all(
        settings.validation.targets.map(tid =>
          targetManager.getTarget({
            organizationId: target.orgId,
            projectId: target.projectId,
            targetId: tid,
          }),
        ),
      ),
    };
  },
  experimental_forcedLegacySchemaComposition: (target, _, { injector }) => {
    return injector
      .get(OrganizationManager)
      .getFeatureFlags({
        organizationId: target.orgId,
      })
      .then(flags => flags.forceLegacyCompositionInTargets.includes(target.id));
  },
  cleanId: target => target.slug,
};
