import { Dispatch, useEffect, useMemo, useRef, useState } from 'react';
import { Check, CheckIcon, ChevronDown, ChevronRight, InfoIcon, XIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  createPermissionSelectionGroup,
  GrantedPermissions,
  PermissionSelectionGroup,
  PermissionsSelectionGroupAccessMode,
  resolvePermissionsFromPermissionSelectionGroup,
  Resource,
  resourceLevelToScore,
} from './permission-picker/lib';
import {
  allPermissionGroups,
  PermissionGroup,
  ResourceLevel,
} from './permission-picker/permissions';

function PermissionSelector(props: {
  resourceLevel: ResourceLevel;
  grantedPermissions: GrantedPermissions;
  updateGrantedPermissions: (group: GrantedPermissions) => void;
}) {
  const grantedPermissions = useMemo<GrantedPermissions>(() => {
    return {
      ...props.grantedPermissions,
      // A lot of the rules depends on 'project:describe'
      // However, if we are on resource level target or service, project:describe needs to be specified so it can be selected.
      ...(props.resourceLevel === ResourceLevel.target ||
      props.resourceLevel === ResourceLevel.service
        ? {
            'project:describe': 'allow',
          }
        : {}),
    };
  }, [props.resourceLevel, props.grantedPermissions]);

  const [filteredGroups, permissionGroupMapping] = useMemo(() => {
    const filteredGroups: Array<
      PermissionGroup & {
        selectedPermissionCount: number;
      }
    > = [];
    const permissionGroupMapping = new Map<string, string>();

    for (const group of allPermissionGroups) {
      let selectedPermissionCount = 0;

      const filteredGroupPermissions = group.permissions.filter(permission => {
        const shouldInclude =
          resourceLevelToScore(props.resourceLevel) >= resourceLevelToScore(permission.level);

        if (shouldInclude === false) {
          return false;
        }

        if (props.grantedPermissions[permission.id] !== undefined) {
          selectedPermissionCount++;
        }

        permissionGroupMapping.set(permission.id, group.title);

        return true;
      });

      if (filteredGroupPermissions.length === 0) {
        continue;
      }

      filteredGroups.push({
        ...group,
        selectedPermissionCount,
        permissions: filteredGroupPermissions,
      });
    }

    return [filteredGroups, permissionGroupMapping] as const;
  }, [props.resourceLevel, props.grantedPermissions]);

  const permissionRefs = useRef(new Map<string, HTMLElement>());
  const [focusedPermission, setFocusedPermission] = useState(null as string | null);
  const [openAccordions, setOpenAccordions] = useState([] as Array<string>);

  return (
    <Accordion
      type="multiple"
      className="w-full"
      value={openAccordions}
      onValueChange={values => setOpenAccordions(values)}
    >
      {filteredGroups.map(group => {
        const dependencyGraph = new Map<string, Array<string>>();
        for (const permission of group.permissions) {
          if (!permission.dependsOn) {
            continue;
          }
          let arr = dependencyGraph.get(permission.dependsOn);
          if (!arr) {
            arr = [];
            dependencyGraph.set(permission.dependsOn, arr);
          }
          arr.push(permission.id);
        }

        return (
          <AccordionItem value={group.title} key={group.title}>
            <AccordionTrigger className="w-full" key={group.title}>
              {group.title}{' '}
              {group.selectedPermissionCount > 0 && (
                <span className="ml-auto mr-1 inline-block text-sm">
                  {group.selectedPermissionCount} selected
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent className="pl-2 pt-1" forceMount={true}>
              {group.permissions.map(permission => {
                const needsDependency =
                  !!permission.dependsOn && grantedPermissions[permission.dependsOn] !== 'allow';

                return (
                  <div
                    className={cn(
                      'border-ring flex flex-row items-center justify-between space-x-4 border-orange-500 pb-2 text-sm',
                      focusedPermission === permission.id && 'margin-[-1px] border',
                    )}
                    key={permission.id}
                    data-permission-id={permission.id}
                    ref={ref => {
                      if (ref) {
                        permissionRefs.current.set(permission.id, ref);
                      }
                    }}
                  >
                    <div className={cn(needsDependency && 'opacity-30')}>
                      <div className="font-semibold text-white">{permission.title}</div>
                      <div className="text-xs text-gray-400">{permission.description}</div>
                    </div>
                    {!!permission.dependsOn && permissionGroupMapping.has(permission.dependsOn) && (
                      <div className="text-gray flex grow justify-end">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <InfoIcon />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                This permission depends on another permission.{' '}
                                <Button
                                  variant="orangeLink"
                                  onClick={() => {
                                    const dependencyPermission = permission.dependsOn;
                                    if (!dependencyPermission) {
                                      return;
                                    }
                                    const element =
                                      permissionRefs.current.get(dependencyPermission);

                                    if (!element) {
                                      return;
                                    }
                                    setOpenAccordions(values => {
                                      const groupName =
                                        permissionGroupMapping.get(dependencyPermission);
                                      if (!groupName) {
                                      }
                                      if (groupName && values.includes(groupName) === false) {
                                        return [...values, groupName];
                                      }
                                      return values;
                                    });
                                    setFocusedPermission(dependencyPermission);
                                    element.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                >
                                  View permission.
                                </Button>
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                    <Select
                      disabled={permission.readOnly || needsDependency}
                      value={
                        permission.readOnly
                          ? 'allow'
                          : grantedPermissions[permission.id] || 'not-selected'
                      }
                      onValueChange={value => {
                        const dependents = dependencyGraph.get(permission.id) ?? [];
                        if (value === 'allow') {
                          props.updateGrantedPermissions({
                            [permission.id]: 'allow',
                            ...Object.fromEntries(
                              dependents.map(value => [value, undefined] as const),
                            ),
                          });
                        } else if (value === 'deny') {
                          props.updateGrantedPermissions({
                            [permission.id]: 'deny',
                            ...Object.fromEntries(
                              dependents.map(value => [value, 'deny'] as const),
                            ),
                          });
                        } else if (value === 'not-selected') {
                          props.updateGrantedPermissions({
                            [permission.id]: undefined,
                            ...Object.fromEntries(
                              dependents.map(value => [value, undefined] as const),
                            ),
                          });
                        }
                        setFocusedPermission(null);
                      }}
                    >
                      <SelectTrigger className="w-[150px] shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not-selected">Not Selected</SelectItem>
                        <SelectItem value="allow">Allow</SelectItem>
                        <SelectItem value="deny">Deny</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

function GroupTeaser(props: {
  title: string;
  grantedPermissions: GrantedPermissions;
  onClick: () => void;
  mode: PermissionsSelectionGroupAccessMode;
  resourceLevel: ResourceLevel.target | ResourceLevel.project | ResourceLevel.service | null;
  selectedResourceIds: Array<string>;
}) {
  const assignedPermissionsCount = Array.from(Object.values(props.grantedPermissions)).reduce(
    (current, next) => {
      if (!next) {
        return current;
      }
      return current + 1;
    },
    0,
  );

  return (
    <Button variant="outline" className="w-full" onClick={props.onClick}>
      {props.resourceLevel && <Badge className="mr-2 capitalize">{props.resourceLevel}</Badge>}
      <span className="ml-0 mr-auto">{props.title}</span>
      {props.resourceLevel && props.selectedResourceIds.length === 0 ? (
        <>
          <span className="text-red-400">No {props.resourceLevel}s selected</span>
        </>
      ) : (
        <>
          {props.mode === PermissionsSelectionGroupAccessMode.granular &&
            (assignedPermissionsCount > 0 ? (
              <>{assignedPermissionsCount} selected</>
            ) : (
              <span className={cn(props.resourceLevel && 'text-red-400')}>
                No permissions selected
              </span>
            ))}
          {props.mode === PermissionsSelectionGroupAccessMode.allowAll && <>All allowed</>}
          {props.mode === PermissionsSelectionGroupAccessMode.denyAll && <>All denied</>}
        </>
      )}
      <ChevronRight size={16} className="ml-2" />
    </Button>
  );
}

function ResourceBadge(props: { name: string; onDelete: () => void }) {
  return (
    <Badge className="mr-1 pr-1">
      {props.name}
      <button className="ml-1" onClick={props.onDelete}>
        <XIcon size="10" />
      </button>
    </Badge>
  );
}

function ResourceSelector(props: {
  onSelect: (value: string) => void;
  level: ResourceLevel;
  // availableValues: Array<string>;
  // selectedResourceIds: Array<string>;
}) {
  // const filteredResourceIds = props.availableValues.filter(
  //   value => !props.selectedResourceIds.includes(value),
  // );

  const filteredResourceIds: Array<string> = [];

  return (
    <Select
      value=""
      onValueChange={value => {
        if (value === '__noop__') {
          return;
        }
        props.onSelect(value);
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={'Select a ' + props.level} />
      </SelectTrigger>
      <SelectContent>
        {filteredResourceIds.map(value => (
          <SelectItem value={value}>{value}</SelectItem>
        ))}
        {filteredResourceIds.length === 0 && (
          <SelectItem value="__noop__" disabled>
            All {props.level}s assigned.
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}

type PermissionPickerProps = {
  resources: Array<Resource>;
};

type NavigationState =
  | {
      type: 'confirmation';
    }
  | {
      type: 'group';
      groupId: string;
    };

export function PermissionPicker(props: PermissionPickerProps) {
  // TODO: should be passed via props
  const [navigationState, setNavigationState] = useState<null | NavigationState>(() => {
    try {
      return JSON.parse(localStorage.getItem('hive:prototype:permissions')!).navigationState;
    } catch (err) {
      return null;
    }
  });

  const [dynamicGroups, setDynamicGroups] = useState<Array<PermissionSelectionGroup>>(() => {
    // TODO: should be passed via props
    try {
      return JSON.parse(localStorage.getItem('hive:prototype:permissions')!).dynamicGroups;
    } catch (err) {
      return [
        createPermissionSelectionGroup({
          id: 'default',
          level: ResourceLevel.organization,
          title: 'Global Organization Permissions',
          resourceIds: props.resources
            .filter(resource => resource.level === ResourceLevel.organization)
            .map(resource => resource.id),
        }),
      ];
    }
  });

  useEffect(() => {
    localStorage.setItem(
      'hive:prototype:permissions',
      JSON.stringify({
        navigationState,
        dynamicGroups,
      }),
    );
  }, [navigationState, dynamicGroups]);

  if (navigationState?.type === 'confirmation') {
    return (
      <ConfirmationScreen
        goBack={() => setNavigationState(null)}
        groups={dynamicGroups}
        resources={props.resources}
      />
    );
  }

  if (navigationState?.type === 'group') {
    const selectedGroup = dynamicGroups.find(group => group.id === navigationState.groupId);

    if (selectedGroup) {
      return (
        <PermissionSelectionGroupEditor
          close={() => setNavigationState(null)}
          group={selectedGroup}
          updateGroup={fn => {
            setDynamicGroups(groups =>
              groups.map(group => {
                if (group.id === selectedGroup.id) {
                  return fn(group);
                }

                return group;
              }),
            );
          }}
          onDelete={() => {
            setDynamicGroups(groups => groups.filter(group => group.id !== selectedGroup.id));
          }}
        />
      );
    }
  }

  return (
    <PermissionOverview
      navigateToGroup={groupId => setNavigationState({ type: 'group', groupId })}
      navigateToConfirmation={() => setNavigationState({ type: 'confirmation' })}
      addGroup={level => {
        const id = window.crypto.randomUUID();
        setDynamicGroups(groups => [
          ...groups,
          createPermissionSelectionGroup({
            id,
            level,
            title: 'Group ' + id,
          }),
        ]);
        setNavigationState({ type: 'group', groupId: id });
      }}
      groups={dynamicGroups}
    />
  );
}

function PermissionOverview(props: {
  navigateToGroup: (groupId: string) => void;
  navigateToConfirmation: () => void;
  addGroup: (level: ResourceLevel) => void;
  groups: Array<PermissionSelectionGroup>;
}) {
  const form = useForm({
    defaultValues: {},
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Member Role Editor</CardTitle>
        <CardDescription>
          Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor
          invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-row space-x-6">
          <div className="w-72 shrink-0 space-y-4">
            <Form {...form}>
              <FormField
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a name" type="text" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter a description" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Form>
          </div>

          <div className="grow">
            <div className="space-y-2">
              {props.groups.map(group => {
                return (
                  <GroupTeaser
                    key={group.id}
                    title={group.title}
                    grantedPermissions={group.selectedPermissions}
                    onClick={() => props.navigateToGroup(group.id)}
                    mode={group.mode}
                    resourceLevel={
                      group.id === 'default'
                        ? null
                        : (group.level as
                            | ResourceLevel.project
                            | ResourceLevel.target
                            | ResourceLevel.service)
                    }
                    selectedResourceIds={group.resourceIds}
                  />
                );
              })}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="ml-auto mr-0 mt-3 block">
                  Add More <ChevronDown className="inline" size="16" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => props.addGroup(ResourceLevel.project)}>
                  Project-level
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => props.addGroup(ResourceLevel.target)}>
                  Target-level
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => props.addGroup(ResourceLevel.service)}>
                  Service-level
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button className="ml-auto mr-0" onClick={() => props.navigateToConfirmation()}>
          Continue checking permissions
        </Button>
      </CardFooter>
    </Card>
  );
}

function PermissionSelectionGroupEditor(props: {
  close: () => void;
  group: PermissionSelectionGroup;
  updateGroup: Dispatch<(group: PermissionSelectionGroup) => PermissionSelectionGroup>;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="cursor-pointer" onClick={() => props.close()}>
            Member Role Editor
          </span>{' '}
          <span>{'>'}</span> {props.group.title}
        </CardTitle>
        {props.group.id === 'default' && (
          <CardDescription>
            These permissions apply to all resources within the organization.
            <br /> E.g. if you grant access to projects permissions, these apply to all projects.
          </CardDescription>
        )}
        {props.group.level === ResourceLevel.project && (
          <CardDescription>
            These permissions apply to all the selected projects.
            <br /> E.g. if you grant access to access the laboratory, the member is able to access
            the laboratory on all targets within all the selected projects.
          </CardDescription>
        )}
        {props.group.level === ResourceLevel.target && (
          <CardDescription>
            These permissions apply to all the selected targets.
            <br /> E.g. if you grant access to approve schema checks, the member is able to approve
            schema checks on all services within the target.
          </CardDescription>
        )}
        {props.group.level === ResourceLevel.service && (
          <CardDescription>These permission apply to all the selected services.</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-row space-x-6">
          <div className="w-72 shrink-0 space-y-4">
            {props.group.level !== ResourceLevel.organization && (
              <>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label>Group Title</Label>
                  <Input
                    value={props.group.title}
                    onChange={ev => {
                      props.updateGroup(group => ({
                        ...group,
                        title: ev.target.value,
                      }));
                    }}
                  />
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label>Selected {props.group.level}s</Label>
                  <div className="flex w-full max-w-sm items-center space-x-2">
                    <ResourceSelector
                      onSelect={value => {
                        props.updateGroup(group => ({
                          ...group,
                          resources: [...group.resourceIds, value],
                        }));
                      }}
                      level={props.group.level}
                    />
                  </div>
                </div>
                <div className="mt-2">
                  {props.group.resourceIds.map(resourceId => (
                    <ResourceBadge
                      key={resourceId}
                      name={resourceId}
                      onDelete={() => {
                        props.updateGroup(group => ({
                          ...group,
                          resources: group.resourceIds.filter(name => name !== resourceId),
                        }));
                      }}
                    />
                  ))}
                </div>
              </>
            )}
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label>Mode</Label>
              <Select
                value={props.group.mode}
                onValueChange={value => {
                  props.updateGroup(group => ({
                    ...group,
                    mode: value as PermissionsSelectionGroupAccessMode,
                  }));
                }}
              >
                <SelectTrigger className="w-[150px] shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PermissionsSelectionGroupAccessMode.granular}>
                    Granular
                  </SelectItem>
                  <SelectItem value={PermissionsSelectionGroupAccessMode.allowAll}>
                    Allow All
                  </SelectItem>
                  <SelectItem value={PermissionsSelectionGroupAccessMode.denyAll}>
                    Deny all
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {props.group.mode === PermissionsSelectionGroupAccessMode.granular && (
              <>
                <p className="text-muted-foreground text-sm">
                  Grant specific permissions for the specified resources based on your selection.
                </p>
              </>
            )}
            {props.group.mode === PermissionsSelectionGroupAccessMode.allowAll && (
              <p className="text-muted-foreground text-sm">
                All permissions are granted for the specified resources.
              </p>
            )}
            {props.group.mode === PermissionsSelectionGroupAccessMode.denyAll && (
              <p className="text-muted-foreground text-sm">
                All permissions are denied for the specified resources.
              </p>
            )}
          </div>
          <div
            className={cn(
              'max-h-[500px] w-full overflow-scroll pr-5',
              !!(
                props.group.mode === PermissionsSelectionGroupAccessMode.allowAll ||
                props.group.mode === PermissionsSelectionGroupAccessMode.denyAll
              ) && 'pointer-events-none opacity-25',
            )}
          >
            <PermissionSelector
              resourceLevel={props.group.level}
              grantedPermissions={
                props.group.mode === PermissionsSelectionGroupAccessMode.allowAll ||
                props.group.mode === PermissionsSelectionGroupAccessMode.denyAll
                  ? {}
                  : props.group.selectedPermissions
              }
              updateGrantedPermissions={updates => {
                props.updateGroup(group => ({
                  ...group,
                  selectedPermissions: { ...group.selectedPermissions, ...updates },
                }));
              }}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        {props.group.resourceIds.length === 0 &&
          props.group.level !== ResourceLevel.organization && (
            <span className="pr-5 text-red-400">Please add at least one {props.group.level}.</span>
          )}
        {props.group.id !== 'default' && <Button onClick={props.onDelete}>Delete</Button>}
        <Button
          onClick={props.close}
          disabled={
            props.group.resourceIds.length === 0 && props.group.level !== ResourceLevel.organization
          }
        >
          <Check size={12} /> Apply
        </Button>
      </CardFooter>
    </Card>
  );
}

function ConfirmationScreen(props: {
  groups: Array<PermissionSelectionGroup>;
  resources: Array<Resource>;
  goBack: () => void;
}) {
  const resolvedPermissionsPerResource = useMemo(() => {
    const resources = resolvePermissionsFromPermissionSelectionGroup(props.groups, props.resources);
    return resources.map(row => ({
      resource: props.resources.find(resource => resource.id === row.resourceId)!,
      permissions: row.permissions,
    }));
  }, [props.groups]);

  const [showAllowOnly, setShowAllowOnly] = useState(true);

  return (
    <>
      <CardHeader>
        <CardTitle>Member Role Editor</CardTitle>
        <CardDescription>
          Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor
          invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="items-top flex space-x-2">
          <Checkbox
            id="terms1"
            checked={showAllowOnly}
            onCheckedChange={value => setShowAllowOnly(!!value)}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="terms1"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show only allowed permissions
            </label>
          </div>
        </div>
        {resolvedPermissionsPerResource.map(resource => (
          <MemberRoleConfirmationGroup
            key={resource.resource.id}
            title={resource.resource.id}
            level={resource.resource.level}
            permissions={resource.permissions}
            showAllowOnly={showAllowOnly}
          />
        ))}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button onClick={() => props.goBack()}>Go back</Button>
        <Button>Create Member Role</Button>
      </CardFooter>
    </>
  );
}

function MemberRoleConfirmationGroup(props: {
  level: ResourceLevel;
  title: string;
  permissions: GrantedPermissions;
  showAllowOnly: boolean;
}) {
  const [filteredGroups, totalAllowedCount] = useMemo(() => {
    let totalAllowedCount = 0;
    const filteredGroups: Array<
      PermissionGroup & {
        totalAllowedCount: number;
      }
    > = [];
    for (const group of allPermissionGroups) {
      let groupTotalAllowedCount = 0;
      const filteredPermissions = group.permissions.filter(permission => {
        if (permission.level !== props.level) {
          return false;
        }

        if (props.permissions[permission.id] === 'allow') {
          totalAllowedCount++;
          groupTotalAllowedCount++;
        }

        return true;
      });

      if (filteredPermissions.length === 0) {
        continue;
      }

      filteredGroups.push({
        ...group,
        permissions: filteredPermissions,
        totalAllowedCount: groupTotalAllowedCount,
      });
    }

    return [filteredGroups, totalAllowedCount];
  }, [props.level]);

  if (totalAllowedCount === 0 && props.showAllowOnly) {
    return null;
  }

  return (
    <Accordion
      type="single"
      defaultValue={totalAllowedCount > 0 ? props.title : undefined}
      collapsible
    >
      <AccordionItem value={props.title}>
        <AccordionTrigger className="w-full">
          {props.title}
          <Badge className="ml-2">{props.level}</Badge>
          <span className="ml-auto mr-2">{totalAllowedCount} allowed</span>
        </AccordionTrigger>
        <AccordionContent className="ml-1 flex max-w-[800px] flex-wrap items-start overflow-x-scroll">
          {filteredGroups.map(group =>
            props.showAllowOnly && group.totalAllowedCount === 0 ? null : (
              <div className="w-[50%] min-w-[400px] pb-4 pr-12">
                <table key={group.title} className="w-full">
                  <tr>
                    <th className="pb-2 text-left">{group.title}</th>
                  </tr>
                  {group.permissions.map(permission =>
                    props.showAllowOnly && props.permissions[permission.id] !== 'allow' ? null : (
                      <tr key={permission.id}>
                        <td>{permission.title}</td>
                        <td className="bold ml-2 text-right">
                          {props.permissions[permission.id] === 'allow' ? (
                            <span className="text-green-500">
                              <CheckIcon className="inline size-4" /> Allowed
                            </span>
                          ) : (
                            <span>
                              <XIcon className="inline size-4" /> Deny
                            </span>
                          )}
                        </td>
                      </tr>
                    ),
                  )}
                </table>
              </div>
            ),
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
