import { Inject, Injectable, Scope } from 'graphql-modules';
import { sql, type DatabasePool } from 'slonik';
import zod from 'zod';
import {
  Organization,
  OrganizationAccessScope,
  ProjectAccessScope,
  TargetAccessScope,
} from '@hive/api';
import { batch, batchBy } from '../../../shared/helpers';
import { isUUID } from '../../../shared/is-uuid';
import { Logger } from '../../shared/providers/logger';
import { PG_POOL_CONFIG } from '../../shared/providers/pg-pool';

const RawOrganizationMembershipModel = zod.object({
  userId: zod.string(),
  /** Legacy scopes on membership, way of assigning permissions before the introduction of roles */
  legacyScopes: zod
    .array(zod.string())
    .transform(
      value => value as Array<OrganizationAccessScope | ProjectAccessScope | TargetAccessScope>,
    )
    .nullable(),
  /** Legacy role id, way of assigning permissions via a role before the introduction of assigning multiple roles */
  legacyRoleId: zod.string().nullable(),
});

type RawOrganizationMembershipType = zod.TypeOf<typeof RawOrganizationMembershipModel>;

const ResourceTypeModel = zod.enum(['organization', 'project', 'target', 'service']);
const EffectModel = zod.enum(['allow', 'deny']);

/** Group of permissions that will be applied on the specified resource type level. */
const PermissionGroupModel = zod.object({
  resourceType: ResourceTypeModel,
  permissions: zod.array(zod.string()),
  effect: EffectModel,
});

type PermissionGroupType = zod.TypeOf<typeof PermissionGroupModel>;

const RawMemberRoleModel = zod.intersection(
  zod.object({
    id: zod.string(),
    description: zod.string(),
    isLocked: zod.boolean(),
  }),
  zod.union([
    zod.object({
      legacyScopes: zod
        .array(zod.string())
        .transform(
          value => value as Array<OrganizationAccessScope | ProjectAccessScope | TargetAccessScope>,
        ),
      permissionGroups: zod.null(),
    }),
    zod.object({
      legacyScopes: zod.null(),
      permissionGroups: zod.array(PermissionGroupModel),
    }),
  ]),
);

const UUIDResourceAssignmentModel = zod
  .union([zod.literal('*'), zod.array(zod.string().uuid())])
  .optional()
  .nullable()
  .transform(value => value ?? null);

/**
 * String in the form `targetId/serviceName`
 * Example: `f81ce726-2abf-4653-bf4c-d8436cde255a/users`
 */
const ServiceResourceAssignmentStringModel = zod.string().refine(value => {
  const [targetId, serviceName = ''] = value.split('/');
  if (isUUID(targetId) === false || serviceName === '') {
    return false;
  }
  return true;
}, 'Invalid service resource assignment');

const ServiceResourceAssignmentModel = zod
  .union([zod.literal('*'), zod.array(ServiceResourceAssignmentStringModel)])
  .optional()
  .nullable()
  .transform(value => value ?? null);

const ResourceAssignmentGroupModel = zod.object({
  /** Resources assigned to a 'organization' permission group */
  organization: UUIDResourceAssignmentModel,
  /** Resources assigned to a 'projects' permission group */
  project: UUIDResourceAssignmentModel,
  /** Resources assigned to a 'targets' permission group */
  target: UUIDResourceAssignmentModel,
  /** Resources assigned to a 'service' permission group */
  service: ServiceResourceAssignmentModel,
});

type ResourceAssignmentGroup = zod.TypeOf<typeof ResourceAssignmentGroupModel>;

const RawRoleAssignmentModel = zod.object({
  userId: zod.string(),
  organizationMemberRoleId: zod.string(),
  /**
   * The resources that will be assigned to each permission group based on their resource typ.
   */
  resources: ResourceAssignmentGroupModel,
});

type MemberRoleType = {
  id: string;
  description: string;
  isLocked: boolean;
  permissionGroups: Array<PermissionGroupType>;
};

export type OrganizationMembershipRoleAssignment = {
  role: MemberRoleType;
  resources: ResourceAssignmentGroup;
};

type OrganizationMembership = {
  organizationId: string;
  isAdmin: boolean;
  userId: string;
  assignedRoles: Array<OrganizationMembershipRoleAssignment>;
  /**
   * legacy role assigned to this membership.
   * Note: The role is already resolved to a "OrganizationMembershipRoleAssignment" within the assignedRoles property.
   **/
  legacyRoleId: string | null;
  /**
   * Legacy scope assigned to this membership.
   * Note: They are already resolved to a "OrganizationMembershipRoleAssignment" within the assignedRoles property.
   **/
  legacyScopes: Array<OrganizationAccessScope | ProjectAccessScope | TargetAccessScope> | null;
};

function transformOrganizationMemberLegacyScopesIntoPermissionGroup(
  scopes: Array<OrganizationAccessScope | ProjectAccessScope | TargetAccessScope>,
): PermissionGroupType {
  const permissionGroup: PermissionGroupType = {
    effect: 'allow',
    resourceType: 'organization',
    permissions: [],
  };
  for (const scope of scopes) {
    switch (scope) {
      case OrganizationAccessScope.READ: {
        permissionGroup.permissions.push(
          'support:manageTickets',
          'project:create',
          'project:describe',
          'organization:describe',
        );
        break;
      }
      case OrganizationAccessScope.SETTINGS: {
        permissionGroup.permissions.push(
          'organization:modifySlug',
          'schemaLinting:modifyOrganizationRules',
          'billing:describe',
          'billing:update',
        );
        break;
      }
      case OrganizationAccessScope.DELETE: {
        permissionGroup.permissions.push('organization:delete');
        break;
      }
      case OrganizationAccessScope.INTEGRATIONS: {
        permissionGroup.permissions.push(
          'oidc:modify',
          'gitHubIntegration:modify',
          'slackIntegration:modify',
        );
        break;
      }
      case OrganizationAccessScope.MEMBERS: {
        permissionGroup.permissions.push(
          'member:manageInvites',
          'member:removeMember',
          'member:assignRole',
          'member:modifyRole',
          'member:describe',
        );
        break;
      }
      case ProjectAccessScope.ALERTS: {
        permissionGroup.permissions.push('alert:modify');
        break;
      }
      case ProjectAccessScope.READ: {
        permissionGroup.permissions.push('project:describe');
        break;
      }
      case ProjectAccessScope.DELETE: {
        permissionGroup.permissions.push('project:delete');
        break;
      }
      case ProjectAccessScope.SETTINGS: {
        permissionGroup.permissions.push(
          'project:delete',
          'project:modifySettings',
          'schemaLinting:modifyProjectRules',
        );
        break;
      }
      case TargetAccessScope.READ: {
        permissionGroup.permissions.push(
          'appDeployment:describe',
          'laboratory:describe',
          'target:create',
        );
        break;
      }
      case TargetAccessScope.REGISTRY_WRITE: {
        permissionGroup.permissions.push(
          'schemaCheck:approve',
          'schemaVersion:approve',
          'laboratory:modify',
        );
        break;
      }
      case TargetAccessScope.TOKENS_WRITE: {
        permissionGroup.permissions.push('targetAccessToken:modify', 'cdnAccessToken:modify');
        break;
      }
      case TargetAccessScope.SETTINGS: {
        permissionGroup.permissions.push('target:modifySettings');
        break;
      }
      case TargetAccessScope.DELETE: {
        permissionGroup.permissions.push('target:delete');
        break;
      }
    }
  }

  return permissionGroup;
}

@Injectable({
  scope: Scope.Operation,
})
export class OrganizationMembers {
  private logger: Logger;
  constructor(
    @Inject(PG_POOL_CONFIG) private pool: DatabasePool,
    logger: Logger,
  ) {
    this.logger = logger.child({
      source: 'OrganizationMembers',
    });
  }

  /** Find member roles by their ID */
  private findMemberRolesByIds = async (roleIds: Array<string>) => {
    this.logger.debug('Find organization membership roles. (roleIds=%o)', roleIds);

    const query = sql`
      SELECT
        "id"
        , "name"
        , "description"
        , "locked" AS "isLocked"
        , "scopes" AS "legacyScopes"
        , "permissions_groups" AS "permissionGroups"
      FROM
        "organization_member_roles"
      WHERE
        "id" = ANY(${sql.array(roleIds, 'uuid')})
    `;

    const result = await this.pool.any<unknown>(query);

    const rowsById = new Map<string, MemberRoleType>();

    for (const row of result) {
      const record = RawMemberRoleModel.parse(row);

      rowsById.set(record.id, {
        id: record.id,
        isLocked: record.isLocked,
        description: record.description,
        permissionGroups:
          record.permissionGroups !== null
            ? record.permissionGroups
            : // In case the role has legacy scopes attached, we automatically translate them to permission groups
              [transformOrganizationMemberLegacyScopesIntoPermissionGroup(record.legacyScopes)],
      });
    }
    return rowsById;
  };

  private findMemberRoleById = batch(async (roleIds: Array<string>) => {
    const rolesById = await this.findMemberRolesByIds(roleIds);

    return roleIds.map(async roleId => rolesById.get(roleId) ?? null);
  });

  /** Find all the role assignments for specific users within an organization as a convenient lookup map.  */
  private async findRoleAssignmentsForUsersInOrganization(
    organizationId: string,
    userIds: Array<string>,
  ): Promise<Map<string, Array<OrganizationMembershipRoleAssignment>>> {
    this.logger.debug(
      'Find organization role assignments for users within organization. (organizationId=%s, userIds=%o)',
      organizationId,
      userIds,
    );

    const query = sql`
      SELECT
        "user_id" AS "userId"
        , "organization_member_role_id" AS "organizationMemberRoleId"
        , "resources"
      FROM
        "organization_member_role_assignments" AS "role_assignments"
      WHERE
        "organization_id" = ${organizationId}
        AND "user_id" = ANY${sql.array(userIds, 'uuid')}
    `;

    const result = await this.pool.any<unknown>(query);

    const roleAssignmentsByUserId = new Map<
      string,
      Array<{
        organizationMemberRoleId: string;
        resources: ResourceAssignmentGroup;
      }>
    >();

    const pendingMemberRoleIdLookups = new Set<string>();

    for (const row of result) {
      const record = RawRoleAssignmentModel.parse(row);
      let roleAssignmentsForUser = roleAssignmentsByUserId.get(record.userId);
      if (!roleAssignmentsForUser) {
        roleAssignmentsForUser = [];
        roleAssignmentsByUserId.set(record.userId, roleAssignmentsForUser);
      }

      roleAssignmentsForUser.push({
        resources: record.resources,
        organizationMemberRoleId: record.organizationMemberRoleId,
      });
      pendingMemberRoleIdLookups.add(record.organizationMemberRoleId);
    }

    const memberRoleById = await this.findMemberRolesByIds(Array.from(pendingMemberRoleIdLookups));

    return new Map(
      roleAssignmentsByUserId.entries().map(
        ([userId, assignedRoles]) =>
          [
            userId,
            assignedRoles.map(assignedRole => {
              const memberRole = memberRoleById.get(assignedRole.organizationMemberRoleId);
              if (!memberRole) {
                throw new Error(`Could not find role '${assignedRole.organizationMemberRoleId}'.`);
              }

              return {
                resources: assignedRole.resources,
                role: memberRole,
              } satisfies OrganizationMembershipRoleAssignment;
            }),
          ] as const,
      ),
    );
  }

  findRoleAssignmentsForUserInOrganization = batchBy(
    (args: { organizationId: string; userId: string }) => args.organizationId,
    async args => {
      const organizationId = args[0].organizationId;
      const userIds = args.map(arg => arg.userId);
      const result = await this.findRoleAssignmentsForUsersInOrganization(organizationId, userIds);

      return userIds.map(async userId => {
        return result.get(userId) ?? [];
      });
    },
  );

  private async findOrganizationMembersById(organizationId: string, userIds: Array<string>) {
    const query = sql`
    SELECT
      "om"."user_id" AS "userId"
      , "om"."role_id" AS "legacyRoleId"
      , "om"."scopes" AS "legacyScopes"
    FROM
      "organization_member" AS "om"
    WHERE
      "om"."organization_id" = ${organizationId}
      AND "om"."user_id" = ANY(${sql.array(userIds, 'uuid')})
  `;

    const result = await this.pool.any<unknown>(query);
    return result.map(row => RawOrganizationMembershipModel.parse(row));
  }

  private findOrganizationMemberById = batchBy(
    (args: { organizationId: string; userId: string }) => args.organizationId,
    async args => {
      const organizationId = args[0].organizationId;
      const userIds = args.map(arg => arg.userId);
      const organizationMembers = await this.findOrganizationMembersById(organizationId, userIds);
      const lookupMap = new Map<string, RawOrganizationMembershipType>();
      for (const member of organizationMembers) {
        lookupMap.set(member.userId, member);
      }

      return userIds.map(async userId => lookupMap.get(userId) ?? null);
    },
  );

  /**
   * Batched loader function for a organization membership.
   *
   * Handles legacy scopes and role assignments and automatically transforms
   * them into resource based role assignments.
   */
  findOrganizationMembership = batchBy(
    (args: { organization: Organization; userId: string }) => args.organization.id,
    async args => {
      const organization = args[0].organization;
      const userIds = args.map(arg => arg.userId);

      this.logger.debug(
        'Find organization membership for users. (organizationId=%s, userIds=%o)',
        organization.id,
        userIds,
      );

      const organizationMembers = await this.findOrganizationMembersById(organization.id, userIds);
      const mapping = new Map<string, OrganizationMembership>();

      // Roles that are assigned using the legacy "single role" way
      const pendingLegacyRoleLookups = new Set<string>();
      const pendingLegacyRoleMembershipAssignments: Array<{
        legacyRoleId: string;
        assignedRoles: OrganizationMembership['assignedRoles'];
      }> = [];

      // Users whose role assignments need to be loaded as they are not using any legacy roles
      const pendingRoleRoleAssignmentLookupUsersIds = new Set<OrganizationMembership>();

      for (const record of organizationMembers) {
        const organizationMembership: OrganizationMembership = {
          organizationId: organization.id,
          userId: record.userId,
          isAdmin: organization.ownerId === record.userId,
          assignedRoles: [],
          legacyRoleId: record.legacyRoleId,
          legacyScopes: record.legacyScopes,
        };
        mapping.set(record.userId, organizationMembership);

        if (record.legacyRoleId) {
          // legacy "single assigned role"
          pendingLegacyRoleLookups.add(record.legacyRoleId);
          pendingLegacyRoleMembershipAssignments.push({
            legacyRoleId: record.legacyRoleId,
            assignedRoles: organizationMembership.assignedRoles,
          });
        } else if (record.legacyScopes !== null) {
          // legacy "scopes" on organization member -> migration wizard has not been used

          // In this case we translate the legacy scopes to a single permission group on the "organization"
          // resource typ. Then assign the users organization to the group, so it has the same behavior as previously.
          organizationMembership.assignedRoles.push({
            role: {
              id: 'legacy-scope-role',
              description: 'This role has been automatically generated from the assigned scopes.',
              isLocked: true,
              permissionGroups: [
                /**  */
                transformOrganizationMemberLegacyScopesIntoPermissionGroup(record.legacyScopes),
              ],
            },
            resources: {
              organization: [organization.id],
              project: null,
              target: null,
              service: null,
            },
          });
        } else {
          // normal role assignment lookup
          pendingRoleRoleAssignmentLookupUsersIds.add(organizationMembership);
        }
      }

      if (pendingLegacyRoleLookups.size) {
        // This handles the legacy "single" role assignments
        // We load the roles and then attach them to the already loaded membership role
        const roleIds = Array.from(pendingLegacyRoleLookups);

        this.logger.debug('Lookup legacy role assignments. (roleIds=%o)', roleIds);

        const memberRolesById = await this.findMemberRolesByIds(roleIds);

        for (const record of pendingLegacyRoleMembershipAssignments) {
          const membershipRole = memberRolesById.get(record.legacyRoleId);
          if (!membershipRole) {
            continue;
          }
          record.assignedRoles.push({
            resources: {
              organization: [organization.id],
              project: null,
              target: null,
              service: null,
            },
            role: membershipRole,
          });
        }
      }

      if (pendingRoleRoleAssignmentLookupUsersIds.size) {
        const usersIds = Array.from(pendingRoleRoleAssignmentLookupUsersIds).map(
          membership => membership.userId,
        );
        this.logger.debug(
          'Lookup role assignments within organization for users. (organizationId=%s, userIds=%o)',
          organization.id,
          usersIds,
        );

        const roleAssignments = await this.findRoleAssignmentsForUsersInOrganization(
          organization.id,
          usersIds,
        );

        for (const membership of pendingRoleRoleAssignmentLookupUsersIds) {
          membership.assignedRoles.push(...(roleAssignments.get(membership.userId) ?? []));
        }
      }

      return userIds.map(async userId => mapping.get(userId) ?? null);
    },
  );

  async createOrganizationMemberRole(args: {
    name: string;
    description: string;
    permissionGroups: Array<PermissionGroupType>;
  }) {
    // TODO: implementation of the method
  }

  async updateOrganizationMemberRole(
    roleId: string,
    args: {
      name: string | null;
      description: string | null;
      permissionGroups: Array<PermissionGroupType>;
    },
  ) {
    const role = await this.findMemberRoleById(roleId);

    if (!role) {
      return null;
    }

    // TODO: assert if role is locked or not

    const query = sql`
      UPDATE
        "organization_member_roles"
      SET
        "name" = COALESCE(${args.name}, "name")
        , "description" = COALESCE(${args.description}, "name")
        ${/* Upon update we unset the legacy scopes */ sql``}
        , "scopes" = NULL
        , "permissions_groups" = ${JSON.stringify(PermissionGroupModel.parse(args.permissionGroups))}
      WHERE
       "id" = ${roleId}
    `;

    await this.pool.query(query);
  }

  async deleteOrganizationMemberRole(roleId: string) {
    const role = await this.findMemberRoleById(roleId);

    // TODO: check if any user has this role assigned

    // TODO: delete role
  }

  /**
   * Assigns or updates the assignment of a member role on a user.
   *
   * It also handles legacy cleanup of moving the legacy assigned role form the "organization_member" table
   * to the "organization_member_role_assignments" table.
   */
  async upsertOrganizationMemberRoleAssignment(
    organizationId: string,
    userId: string,
    // TODO: think about making this a upsert many role assignments method instead
    roleId: string,
    resourceAssignments: ResourceAssignmentGroup,
  ) {
    const membership = await this.findOrganizationMemberById({
      organizationId,
      userId,
    });

    if (!membership) {
      return null;
    }

    // TODO: verify resourceAssignments
    // TODO: verify role exists

    await this.pool.transaction(async transaction => {
      // TODO: potential race condition; the organization membership lookup should run in the same transaction

      if (membership.legacyRoleId) {
        // In case we have a legacy role attached to the membership we automatically move the assignment
        // to the "organization_member_role_assignments" table.
        await transaction.query(sql`
          UPDATE
            "organization_member"
          SET
            "role_id" = NULL
          WHERE
            "organization_id" = ${organizationId}
            AND "user_id" = ${userId}
        `);

        if (membership.legacyRoleId !== roleId) {
          await transaction.query(sql`
            INSERT INTO "organization_member_role_assignments" (
              "organization_id"
              , "user_id"
              , "organization_member_role_id"
              , "resources"
            ) VALUES (
              ${organizationId}
              , ${userId}
              , ${membership.legacyRoleId}
              , ${JSON.stringify({
                organization: [organizationId],
              })}
            )
          `);
        }
      }

      await transaction.query(sql`
        INSERT INTO "organization_member_role_assignments" (
          "organization_id"
          , "user_id"
          , "organization_member_role_id"
          , "resources"
        ) VALUES (
          ${organizationId}
          , ${userId}
          , ${roleId}
          , ${JSON.stringify(ResourceAssignmentGroupModel.parse(resourceAssignments))}
        )
        ON CONFLICT ("organization_id", "user_id", "organization_member_role_id")
        DO UPDATE
          SET "resources" = EXCLUDED."resources"
      `);
    });
  }

  /**
   * Unassign a organization member role from an user
   */
  async removeOrganizationMemberRoleAssignment(
    organizationId: string,
    userId: string,
    // TODO: think about making this a remove many role assignments method instead
    roleId: string,
  ) {
    const membership = await this.findOrganizationMemberById({
      organizationId,
      userId,
    });

    if (!membership) {
      return null;
    }

    const roleAssignments = await this.findRoleAssignmentsForUserInOrganization({
      organizationId,
      userId,
    });

    // A user can not have less than one role assigned.
    if (roleAssignments.length <= 1) {
      return null;
    }

    // TODO: race condition; the role assignment lookup and delete need to happen in a transaction
    // otherwise it is possible that a user without a role will exist.

    const query = sql`
      DELETE
      FROM
        "organization_member_role_assignments"
      WHERE
        "organization_id" = ${organizationId}
        AND "user_id" = ${userId}
        AND "organization_member_role_id" = ${roleId}
    `;

    await this.pool.query(query);
  }
}
