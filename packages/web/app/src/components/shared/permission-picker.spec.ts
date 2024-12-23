import {
  createPermissionSelectionGroup,
  PermissionsSelectionGroupAccessMode,
  ResolvedResourcePermissions,
  resolvePermissionsFromPermissionSelectionGroup,
  Resource,
} from './permission-picker/lib';
import { ResourceLevel } from './permission-picker/permissions';

describe('createPermissionSelectionGroup', () => {
  test('includes default permissions', () => {
    const group = createPermissionSelectionGroup({
      id: 'default',
      level: ResourceLevel.organization,
      title: 'Default group',
      resourceIds: ['the-guild'],
    });

    expect(group).toEqual({
      id: 'default',
      level: ResourceLevel.organization,
      mode: PermissionsSelectionGroupAccessMode.granular,
      resourceIds: ['the-guild'],
      selectedPermissions: {
        'organization:describe': 'allow',
      },
      title: 'Default group',
    });

    expect(group.selectedPermissions).toEqual({
      'organization:describe': 'allow',
    });
  });
});

describe('resolvePermissionsFromPermissionSelectionGroup', () => {
  test('resolve permissions for default permissions on single group', () => {
    const resource: Resource = {
      id: 'the-guild',
      level: ResourceLevel.organization,
    };
    const group = createPermissionSelectionGroup({
      id: 'default',
      level: ResourceLevel.organization,
      title: 'Default group',
      resourceIds: ['the-guild'],
    });

    const result = resolvePermissionsFromPermissionSelectionGroup([group], [resource]);

    expect(result).toEqual([
      {
        resourceId: 'the-guild',
        permissions: {
          'organization:describe': 'allow',
        },
      } satisfies ResolvedResourcePermissions,
    ]);
  });

  test('resolve permissions for default group on single permissions', () => {
    const resource: Resource = {
      id: 'the-guild',
      level: ResourceLevel.organization,
    };
    const group = createPermissionSelectionGroup({
      id: 'default',
      level: ResourceLevel.organization,
      title: 'Default group',
      resourceIds: ['the-guild'],
    });
    group.selectedPermissions['organization:support'] = 'allow';

    const result = resolvePermissionsFromPermissionSelectionGroup([group], [resource]);
    expect(result[0].permissions['organization:support']).toEqual('allow');
  });

  test('resolve permissions for default group on single group', () => {
    const resource: Resource = {
      id: 'the-guild',
      level: ResourceLevel.organization,
    };
    const group = createPermissionSelectionGroup({
      id: 'default',
      level: ResourceLevel.organization,
      title: 'Default group',
      resourceIds: ['the-guild'],
    });
    group.selectedPermissions['organization:support'] = 'deny';

    const result = resolvePermissionsFromPermissionSelectionGroup([group], [resource]);
    expect(result[0].permissions['organization:support']).toEqual('deny');
  });

  test('deny takes precedence over allow', () => {
    const resource: Resource = {
      id: 'the-guild',
      level: ResourceLevel.organization,
    };

    const defaultGroup = createPermissionSelectionGroup({
      id: 'default',
      level: ResourceLevel.organization,
      title: 'Default group',
      resourceIds: ['the-guild'],
    });

    defaultGroup.selectedPermissions['organization:support'] = 'deny';

    const group1 = createPermissionSelectionGroup({
      id: 'group-1',
      level: ResourceLevel.organization,
      title: 'Group 1',
      resourceIds: ['the-guild'],
    });

    group1.selectedPermissions['organization:support'] = 'allow';

    const result = resolvePermissionsFromPermissionSelectionGroup(
      [defaultGroup, group1],
      [resource],
    );
    expect(result[0].permissions['organization:support']).toEqual('deny');
  });

  test('permissions are applied on child resources depending on their level', () => {
    const resources: Array<Resource> = [
      {
        id: 'the-guild',
        level: ResourceLevel.organization,
        childResourceIds: ['the-guild/graphql-hive'],
      },
      {
        id: 'the-guild/graphql-hive',
        level: ResourceLevel.project,
      },
    ];

    const defaultGroup = createPermissionSelectionGroup({
      id: 'default',
      level: ResourceLevel.organization,
      title: 'Default group',
      resourceIds: ['the-guild'],
    });

    defaultGroup.selectedPermissions['project:describe'] = 'allow';

    const result = resolvePermissionsFromPermissionSelectionGroup([defaultGroup], resources);
    expect(result[0].permissions['project:describe']).toEqual(undefined);
    expect(result[1].permissions['project:describe']).toEqual('allow');
  });

  test('"deny" takes precedence on child resource level', () => {
    const resources: Array<Resource> = [
      {
        id: 'the-guild',
        level: ResourceLevel.organization,
        childResourceIds: ['the-guild/graphql-hive'],
      },
      {
        id: 'the-guild/graphql-hive',
        level: ResourceLevel.project,
      },
    ];

    const defaultGroup = createPermissionSelectionGroup({
      id: 'default',
      level: ResourceLevel.organization,
      title: 'Default group',
      resourceIds: ['the-guild'],
    });

    const group1 = createPermissionSelectionGroup({
      id: 'group1',
      level: ResourceLevel.project,
      title: 'Group 1',
      resourceIds: ['the-guild/graphql-hive'],
    });

    defaultGroup.selectedPermissions['project:describe'] = 'allow';
    group1.selectedPermissions['project:describe'] = 'deny';

    const result = resolvePermissionsFromPermissionSelectionGroup(
      [defaultGroup, group1],
      resources,
    );
    expect(result[0].permissions['project:describe']).toEqual(undefined);
    expect(result[1].permissions['project:describe']).toEqual('deny');
  });

  test('"PermissionsSelectionGroupAccessMode.allowAll" allow all actions on resource', () => {
    const resources: Array<Resource> = [
      {
        id: 'the-guild',
        level: ResourceLevel.organization,
      },
    ];

    const defaultGroup = createPermissionSelectionGroup({
      id: 'default',
      level: ResourceLevel.organization,
      title: 'Default group',
      resourceIds: ['the-guild'],
    });
    defaultGroup.mode = PermissionsSelectionGroupAccessMode.allowAll;

    const result = resolvePermissionsFromPermissionSelectionGroup([defaultGroup], resources);

    expect(result[0].permissions['members:describe']).toEqual('allow');
  });

  test('"PermissionsSelectionGroupAccessMode.denyAll" deny all actions on resource', () => {
    const resources: Array<Resource> = [
      {
        id: 'the-guild',
        level: ResourceLevel.organization,
      },
    ];

    const defaultGroup = createPermissionSelectionGroup({
      id: 'default',
      level: ResourceLevel.organization,
      title: 'Default group',
      resourceIds: ['the-guild'],
    });
    defaultGroup.mode = PermissionsSelectionGroupAccessMode.denyAll;

    const result = resolvePermissionsFromPermissionSelectionGroup([defaultGroup], resources);

    expect(result[0].permissions['members:describe']).toEqual('deny');
  });

  test('"PermissionsSelectionGroupAccessMode.allowAll" propagates allow all actions on child resource', () => {
    const resources: Array<Resource> = [
      {
        id: 'the-guild',
        level: ResourceLevel.organization,
        childResourceIds: ['the-guild/graphql-hive'],
      },
      {
        id: 'the-guild/graphql-hive',
        level: ResourceLevel.project,
      },
    ];

    const defaultGroup = createPermissionSelectionGroup({
      id: 'default',
      level: ResourceLevel.organization,
      title: 'Default group',
      resourceIds: ['the-guild'],
    });

    defaultGroup.mode = PermissionsSelectionGroupAccessMode.allowAll;

    const result = resolvePermissionsFromPermissionSelectionGroup([defaultGroup], resources);

    expect(result[0].permissions['project:describe']).toEqual(undefined);
    expect(result[1].permissions['project:describe']).toEqual('allow');
  });
  test('"PermissionsSelectionGroupAccessMode.denyAll" propagates deny all actions on child resource', () => {
    const resources: Array<Resource> = [
      {
        id: 'the-guild',
        level: ResourceLevel.organization,
        childResourceIds: ['the-guild/graphql-hive'],
      },
      {
        id: 'the-guild/graphql-hive',
        level: ResourceLevel.project,
      },
    ];

    const defaultGroup = createPermissionSelectionGroup({
      id: 'default',
      level: ResourceLevel.organization,
      title: 'Default group',
      resourceIds: ['the-guild'],
    });

    defaultGroup.mode = PermissionsSelectionGroupAccessMode.denyAll;

    const result = resolvePermissionsFromPermissionSelectionGroup([defaultGroup], resources);

    expect(result[0].permissions['project:describe']).toEqual(undefined);
    expect(result[1].permissions['project:describe']).toEqual('deny');
  });

  test('"PermissionsSelectionGroupAccessMode.denyAll" and "PermissionsSelectionGroupAccessMode.allowAll" in different groups on same resource result in deny', () => {
    const resources: Array<Resource> = [
      {
        id: 'the-guild',
        level: ResourceLevel.organization,
      },
    ];

    const defaultGroup = createPermissionSelectionGroup({
      id: 'default',
      level: ResourceLevel.organization,
      title: 'Default group',
      resourceIds: ['the-guild'],
    });

    defaultGroup.mode = PermissionsSelectionGroupAccessMode.allowAll;

    const group1 = createPermissionSelectionGroup({
      id: 'group1',
      level: ResourceLevel.organization,
      title: 'Default group',
      resourceIds: ['the-guild'],
    });

    group1.mode = PermissionsSelectionGroupAccessMode.denyAll;

    const groups = [defaultGroup, group1];

    const result = resolvePermissionsFromPermissionSelectionGroup(groups, resources);
    expect(result[0].permissions['members:describe']).toEqual('deny');
  });

  test('"PermissionsSelectionGroupAccessMode.denyAll" does not work on read only fields', () => {
    const resources: Array<Resource> = [
      {
        id: 'the-guild',
        level: ResourceLevel.organization,
      },
    ];

    const defaultGroup = createPermissionSelectionGroup({
      id: 'default',
      level: ResourceLevel.organization,
      title: 'Default group',
      resourceIds: ['the-guild'],
    });

    defaultGroup.mode = PermissionsSelectionGroupAccessMode.denyAll;

    const result = resolvePermissionsFromPermissionSelectionGroup([defaultGroup], resources);
    expect(result[0].permissions['organization:describe']).toEqual('allow');
  });
});
