import { Injectable, Scope } from 'graphql-modules';
import type { Project, ProjectType } from '../../../shared/entities';
import { share } from '../../../shared/helpers';
import { AuthManager } from '../../auth/providers/auth-manager';
import { OrganizationAccessScope } from '../../auth/providers/organization-access';
import { ProjectAccessScope } from '../../auth/providers/project-access';
import { ActivityManager } from '../../shared/providers/activity-manager';
import { Logger } from '../../shared/providers/logger';
import { OrganizationSelector, ProjectSelector, Storage } from '../../shared/providers/storage';
import { TokenStorage } from '../../token/providers/token-storage';

const reservedSlugs = ['view', 'new'];

/**
 * Responsible for auth checks.
 * Talks to Storage.
 */
@Injectable({
  scope: Scope.Operation,
  global: true,
})
export class ProjectManager {
  private logger: Logger;

  constructor(
    logger: Logger,
    private storage: Storage,
    private authManager: AuthManager,
    private tokenStorage: TokenStorage,
    private activityManager: ActivityManager,
  ) {
    this.logger = logger.child({ source: 'ProjectManager' });
  }

  async createProject(
    input: {
      slug: string;
      type: ProjectType;
    } & OrganizationSelector,
  ) {
    const { slug, type, organizationId: organization } = input;
    this.logger.info('Creating a project (input=%o)', input);

    await this.authManager.ensureOrganizationAccess({
      organizationId: input.organizationId,
      scope: OrganizationAccessScope.READ,
    });

    if (reservedSlugs.includes(slug)) {
      return {
        ok: false,
        message: 'Slug is reserved',
      };
    }

    // create project
    const result = await this.storage.createProject({
      slug,
      type,
      organizationId: organization,
    });

    if (result.ok) {
      await Promise.all([
        this.storage.completeGetStartedStep({
          organizationId: organization,
          step: 'creatingProject',
        }),
        this.activityManager.create({
          type: 'PROJECT_CREATED',
          selector: {
            organizationId: organization,
            projectId: result.project.id,
          },
          meta: {
            projectType: type,
          },
        }),
      ]);
    }

    return result;
  }

  async deleteProject({
    organizationId: organization,
    projectId: project,
  }: ProjectSelector): Promise<Project> {
    this.logger.info('Deleting a project (project=%s, organization=%s)', project, organization);
    await this.authManager.ensureProjectAccess({
      projectId: project,
      organizationId: organization,
      scope: ProjectAccessScope.DELETE,
    });

    const deletedProject = await this.storage.deleteProject({
      projectId: project,
      organizationId: organization,
    });

    await this.tokenStorage.invalidateTokens(deletedProject.tokens);

    await this.activityManager.create({
      type: 'PROJECT_DELETED',
      selector: {
        organizationId: organization,
      },
      meta: {
        name: deletedProject.name,
        cleanId: deletedProject.slug,
      },
    });

    return deletedProject;
  }

  getProjectIdByToken: () => Promise<string | never> = share(async () => {
    const token = this.authManager.ensureApiToken();
    const { project } = await this.tokenStorage.getToken({ token });

    return project;
  });

  async getProject(selector: ProjectSelector): Promise<Project> {
    this.logger.debug('Fetching project (selector=%o)', selector);
    await this.authManager.ensureProjectAccess({
      ...selector,
      scope: ProjectAccessScope.READ,
    });
    return this.storage.getProject(selector);
  }

  async getProjects(selector: OrganizationSelector): Promise<Project[]> {
    this.logger.debug('Fetching projects (selector=%o)', selector);
    await this.authManager.ensureOrganizationAccess({
      ...selector,
      scope: OrganizationAccessScope.READ,
    });
    return this.storage.getProjects(selector);
  }

  async updateSlug(
    input: {
      slug: string;
    } & ProjectSelector,
  ): Promise<
    | {
        ok: true;
        project: Project;
      }
    | {
        ok: false;
        message: string;
      }
  > {
    const { slug, organizationId: organization, projectId: project } = input;
    this.logger.info('Updating a project slug (input=%o)', input);
    await this.authManager.ensureProjectAccess({
      ...input,
      scope: ProjectAccessScope.SETTINGS,
    });
    const user = await this.authManager.getCurrentUser();

    if (reservedSlugs.includes(slug)) {
      return {
        ok: false,
        message: 'Slug is reserved',
      };
    }

    const result = await this.storage.updateProjectSlug({
      organizationId: organization,
      projectId: project,
      userId: user.id,
      slug,
    });

    if (result.ok) {
      await this.activityManager.create({
        type: 'PROJECT_ID_UPDATED',
        selector: {
          organizationId: organization,
          projectId: project,
        },
        meta: {
          value: slug,
        },
      });
    }

    return result;
  }
}
