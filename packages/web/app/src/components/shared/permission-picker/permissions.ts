export const enum ResourceLevel {
  organization = 'organization',
  project = 'project',
  target = 'target',
  service = 'service',
}

export type PermissionRecord = {
  id: string;
  title: string;
  description: string;
  dependsOn?: string;
  readOnly?: true;
  level: ResourceLevel;
};

export type PermissionGroup = {
  id: string;
  title: string;
  permissions: Array<PermissionRecord>;
};

export const allPermissionGroups: Array<PermissionGroup> = [
  {
    id: 'organization',
    title: 'Organization',
    permissions: [
      {
        id: 'organization:describe',
        title: 'View organization',
        description: 'Member can see the organization. Permission can not be modified.',
        readOnly: true,
        level: ResourceLevel.organization,
      },
      {
        id: 'organization:support',
        title: 'Access support tickets',
        description: 'Member can access, create and reply to support tickets.',
        level: ResourceLevel.organization,
      },
      {
        id: 'organization:updateSlug',
        title: 'Update organization slug',
        description: 'Member can modify the organization slug.',
        level: ResourceLevel.organization,
      },
      {
        id: 'organization:delete',
        title: 'Delete organization',
        description: 'Member can delete the Organization.',
        level: ResourceLevel.organization,
      },
    ],
  },
  {
    id: 'members',
    title: 'Members',
    permissions: [
      {
        id: 'members:describe',
        title: 'View members',
        description: 'Member can access the organization member overview.',
        level: ResourceLevel.organization,
      },
      {
        id: 'members:assignRole',
        title: 'Assign member role',
        description: 'Member can assign roles to users.',
        dependsOn: 'members:describe',
        level: ResourceLevel.organization,
      },
      {
        id: 'members:modifyRole',
        title: 'Modify member role',
        description: 'Member can modify, create and delete roles.',
        dependsOn: 'members:describe',
        level: ResourceLevel.organization,
      },
      {
        id: 'members:remove',
        title: 'Remove member',
        description: 'Member can remove users from the organization.',
        dependsOn: 'members:describe',
        level: ResourceLevel.organization,
      },
      {
        id: 'members:manageInvites',
        title: 'Manage invites',
        description: 'Member can invite users via email and modify or delete pending invites.',
        dependsOn: 'members:describe',
        level: ResourceLevel.organization,
      },
    ],
  },
  {
    id: 'billing',
    title: 'Billing',
    permissions: [
      {
        id: 'billing:describe',
        title: 'View billing',
        description: 'Member can view the billing information.',
        level: ResourceLevel.organization,
      },
      {
        id: 'billing:update',
        title: 'Update billing',
        description: 'Member can change the organization plan.',
        dependsOn: 'billing:describe',
        level: ResourceLevel.organization,
      },
    ],
  },
  {
    id: 'oidc',
    title: 'OpenID Connect',
    permissions: [
      {
        id: 'oidc:manage',
        title: 'Manage OpenID Connect integration',
        description: 'Member can connect, modify, and remove an OIDC provider to the connection.',
        level: ResourceLevel.organization,
      },
    ],
  },
  {
    id: 'github',
    title: 'GitHub Integration',
    permissions: [
      {
        id: 'github:manage',
        title: 'Manage GitHub integration',
        description:
          'Member can connect, modify, and remove access for the GitHub integration and repository access.',
        level: ResourceLevel.organization,
      },
    ],
  },
  {
    id: 'slack',
    title: 'Slack Integration',
    permissions: [
      {
        id: 'slack:manage',
        title: 'Manage Slack integration',
        description:
          'Member can connect, modify, and remove access for the Slack integration and repository access.',
        level: ResourceLevel.organization,
      },
    ],
  },
  {
    id: 'project',
    title: 'Project',
    permissions: [
      {
        id: 'project:create',
        title: 'Create project',
        description: 'Member can create new projects.',
        level: ResourceLevel.organization,
      },
      {
        id: 'project:describe',
        title: 'View project',
        description: 'Member can access the specified projects.',
        level: ResourceLevel.project,
      },
      {
        id: 'project:delete',
        title: 'Delete project',
        description: 'Member can access the specified projects.',
        level: ResourceLevel.project,
        dependsOn: 'project:describe',
      },
      {
        id: 'project:modifySettings',
        title: 'Modify Settings',
        description: 'Member can access the specified projects.',
        level: ResourceLevel.project,
        dependsOn: 'project:describe',
      },
    ],
  },
  {
    id: 'schema-linting',
    title: 'Schema Linting',
    permissions: [
      {
        id: 'schemaLinting:modifyOrganizationSettings',
        title: 'Manage organization level schema linting',
        description: 'Member can view and modify the organization schema linting rules.',
        level: ResourceLevel.organization,
      },
      {
        id: 'schemaLinting:modifyProjectSettings',
        title: 'Manage project level schema linting',
        description: 'Member can view and modify the projects schema linting rules.',
        level: ResourceLevel.project,
        dependsOn: 'project:describe',
      },
    ],
  },
  {
    id: 'target',
    title: 'Target',
    permissions: [
      {
        id: 'target:create',
        title: 'Create target',
        description: 'Member can create new projects.',
        dependsOn: 'project:describe',
        level: ResourceLevel.project,
      },
      {
        id: 'target:delete',
        title: 'Delete target',
        description: 'Member can access the specified projects.',
        dependsOn: 'project:describe',
        level: ResourceLevel.target,
      },
      {
        id: 'target:modifySettings',
        title: 'Modify settings',
        description: 'Member can access the specified projects.',
        dependsOn: 'project:describe',
        level: ResourceLevel.target,
      },
    ],
  },
  {
    id: 'laboratory',
    title: 'Laboratory',
    permissions: [
      {
        id: 'laboratory:describe',
        title: 'View laboratory',
        description: 'Member can access the laboratory, view and execute GraphQL documents.',
        dependsOn: 'project:describe',
        level: ResourceLevel.target,
      },
      {
        id: 'laboratory:modify',
        title: 'Modify laboratory',
        description:
          'Member can create, delete and update collections and documents in the laboratory.',
        dependsOn: 'laboratory:describe',
        level: ResourceLevel.target,
      },
    ],
  },
  {
    id: 'app-deployments',
    title: 'App Deployments',
    permissions: [
      {
        id: 'appDeployments:describe',
        title: 'View app deployments',
        description: 'Member can view app deployments.',
        dependsOn: 'project:describe',
        level: ResourceLevel.target,
      },
    ],
  },
  {
    id: 'schema-checks',
    title: 'Schema Checks',
    permissions: [
      {
        id: 'schemaChecks:approveFailedSchemaCheck',
        title: 'Approve schema check',
        description: 'Member can approve failed schema checks.',
        dependsOn: 'project:describe',
        level: ResourceLevel.service,
      },
    ],
  },
] as const;
