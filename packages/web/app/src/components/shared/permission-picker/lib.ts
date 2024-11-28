import { allPermissionGroups, ResourceLevel, type PermissionRecord } from './permissions';

// some caches to avoid some iterations
const resourceLevelToPermissions = new Map<ResourceLevel, Array<string>>();
export const permissionsById = new Map<string, PermissionRecord>();

for (const permissionGroup of allPermissionGroups) {
  for (const permission of permissionGroup.permissions) {
    permissionsById.set(permission.id, permission);
    let permissions = resourceLevelToPermissions.get(permission.level);
    if (!permissions) {
      permissions = [];
      resourceLevelToPermissions.set(permission.level, permissions);
    }
    permissions.push(permission.id);
  }
}

export type GrantedPermissions = { [key: string]: 'allow' | undefined };

export const enum PermissionsSelectionGroupAccessMode {
  granular = 'granular',
  allowAll = 'allowAll',
}

export type PermissionSelectionGroup = {
  id: string;
  level: ResourceLevel;
  title: string;
  selectedPermissions: GrantedPermissions;
  mode: PermissionsSelectionGroupAccessMode;
  resourceIds: Array<string>;
};

export function createPermissionSelectionGroup(args: {
  id: string;
  level: ResourceLevel;
  title: string;
  resourceIds?: Array<string>;
}): PermissionSelectionGroup {
  const permissions: GrantedPermissions = {};

  // add default permissions
  for (const group of allPermissionGroups) {
    for (const permission of group.permissions) {
      if (permission.level === args.level && permission.readOnly === true) {
        permissions[permission.id] = 'allow';
      }
    }
  }

  return {
    ...args,
    selectedPermissions: permissions,
    mode: PermissionsSelectionGroupAccessMode.granular,
    resourceIds: args.resourceIds ?? [],
  };
}

export type Resource = {
  id: string;
  level: ResourceLevel;
  /** List of resource IDs that inherit permissions from this resource. */
  childResourceIds?: Array<string>;
};

export type ResolvedResourcePermissions = {
  resourceId: string;
  /** The permissions resolved for this Resource */
  permissions: GrantedPermissions;
};

export function resolvePermissionsFromPermissionSelectionGroup(
  groups: Array<PermissionSelectionGroup>,
  resources: Array<Resource>,
): Array<ResolvedResourcePermissions> {
  type ResourceByIdRecord = {
    resource: Resource;
    permissions: GrantedPermissions;
  };

  const resourceById = new Map<string, ResourceByIdRecord>(
    resources.map(resource => [
      resource.id,
      {
        resource,
        permissions: {},
      },
    ]),
  );

  function maybeAssignPermissionValue(
    record: ResourceByIdRecord,
    permissionId: string,
    value: GrantedPermissions[string],
  ) {
    if (record.permissions[permissionId] === undefined) {
      record.permissions[permissionId] = value;
    }
  }

  for (const group of groups) {
    const affectedResources = group.resourceIds.map(resourceId => {
      const resource = resourceById.get(resourceId);
      if (!resource) {
        throw new Error(`Could not find resource with id "${resourceId}".`);
      }
      return resource;
    });

    if (group.mode === PermissionsSelectionGroupAccessMode.allowAll) {
      let currentLevel: ResourceLevel | null = group.level;

      do {
        for (const permissionId of resourceLevelToPermissions.get(currentLevel) ?? []) {
          const permission = permissionsById.get(permissionId);
          if (!permission) {
            throw new Error(`Could not find permission with id "${permissionId}".`);
          }

          const permissionValue = 'allow';

          for (const resourceRecord of affectedResources) {
            if (Array.isArray(resourceRecord.resource.childResourceIds)) {
              for (const childResourceId of resourceRecord.resource.childResourceIds) {
                const childResource = resourceById.get(childResourceId);
                if (!childResource) {
                  throw new Error(`Could not find resource with id "${childResourceId}".`);
                }

                if (childResource.resource.level !== currentLevel) {
                  continue;
                }

                maybeAssignPermissionValue(childResource, permissionId, permissionValue);
              }
            }

            if (resourceRecord.resource.level !== currentLevel) {
              continue;
            }

            maybeAssignPermissionValue(resourceRecord, permissionId, permissionValue);
          }
        }

        if (currentLevel === ResourceLevel.organization) {
          currentLevel = ResourceLevel.project;
        } else if (currentLevel === ResourceLevel.project) {
          currentLevel = ResourceLevel.target;
        } else if (currentLevel === ResourceLevel.target) {
          currentLevel = ResourceLevel.service;
        } else {
          currentLevel = null;
        }
      } while (currentLevel !== null);

      continue;
    }

    for (const [permissionId, permissionValue] of Object.entries(group.selectedPermissions)) {
      if (permissionValue === undefined) {
        continue;
      }

      const permission = permissionsById.get(permissionId);
      if (permission === undefined) {
        throw new Error(`Could not find permission with id "${permissionId}".`);
      }

      for (const resourceRecord of affectedResources) {
        if (Array.isArray(resourceRecord.resource.childResourceIds)) {
          for (const childResourceId of resourceRecord.resource.childResourceIds) {
            const childResource = resourceById.get(childResourceId);
            if (!childResource) {
              throw new Error(`Could not find resource with id "${childResourceId}".`);
            }

            if (childResource.resource.level !== permission.level) {
              continue;
            }

            maybeAssignPermissionValue(childResource, permissionId, permissionValue);
          }
        }

        if (resourceRecord.resource.level !== permission.level) {
          continue;
        }

        maybeAssignPermissionValue(resourceRecord, permissionId, permissionValue);
      }
    }
  }

  return Array.from(resourceById.values()).map(record => ({
    resourceId: record.resource.id,
    permissions: record.permissions,
  }));
}

export function resourceLevelToScore(level: ResourceLevel) {
  switch (level) {
    case ResourceLevel.organization:
      return 4;
    case ResourceLevel.project:
      return 3;
    case ResourceLevel.target:
      return 2;
    case ResourceLevel.service:
      return 1;
  }
}

export function getInheritedPermissions(
  level: ResourceLevel,
  grantedPermissionsList: Array<GrantedPermissions>,
): GrantedPermissions {
  if (level === ResourceLevel.organization) {
    return {};
  }

  const inheritedPermissions: GrantedPermissions = {};

  for (const grantedPermission of grantedPermissionsList) {
    for (const [permissionId, value] of Object.entries(grantedPermission)) {
      const permission = permissionsById.get(permissionId);
      if (!permission) {
        throw new Error('Could not find permission ' + permissionId);
      }
      if (value === 'allow') {
        inheritedPermissions[permissionId] = value;
      }
    }
  }

  return inheritedPermissions;
}
