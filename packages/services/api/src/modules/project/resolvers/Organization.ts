import { Session } from '../../auth/lib/authz';
import { ProjectManager } from '../providers/project-manager';
import type { OrganizationResolvers } from './../../../__generated__/types';

export const Organization: Pick<
  OrganizationResolvers,
  'projects' | 'viewerCanCreateProject' | '__isTypeOf'
> = {
  projects: (organization, _, { injector }) => {
    return injector.get(ProjectManager).getProjects({ organizationId: organization.id });
  },
  viewerCanCreateProject: async (organization, _arg, { injector }) => {
    return injector.get(Session).canPerformAction({
      action: 'project:create',
      organizationId: organization.id,
      params: {
        organizationId: organization.id,
      },
    });
  },
};
