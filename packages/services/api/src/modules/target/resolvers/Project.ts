import { TargetManager } from '../providers/target-manager';
import type { ProjectResolvers } from './../../../__generated__/types';

export const Project: Pick<ProjectResolvers, 'targets' | '__isTypeOf'> = {
  targets: (project, _, { injector }) => {
    return injector.get(TargetManager).getTargets({
      projectId: project.id,
      organizationId: project.orgId,
    });
  },
};
