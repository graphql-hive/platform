import { Dispatch, useEffect, useMemo, useRef, useState } from 'react';
import { Check, CheckIcon, ChevronRight, InfoIcon, XIcon } from 'lucide-react';
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
  getInheritedPermissions,
  GrantedPermissions,
  permissionsById,
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
  inheritedPermissions: GrantedPermissions;
  resourceLevel: ResourceLevel;
  grantedPermissions: GrantedPermissions;
  updateGrantedPermissions: (group: GrantedPermissions) => void;
}) {
  const [filteredGroups, permissionGroupMapping] = useMemo(() => {
    const filteredGroups: Array<
      PermissionGroup & {
        selectedPermissionCount: number;
        inheritedPermissionCount: number;
      }
    > = [];
    const permissionGroupMapping = new Map<string, string>();

    for (const group of allPermissionGroups) {
      let selectedPermissionCount = 0;
      let inheritedPermissionCount = 0;

      const filteredGroupPermissions = group.permissions.filter(permission => {
        const shouldInclude =
          resourceLevelToScore(props.resourceLevel) >= resourceLevelToScore(permission.level);

        if (shouldInclude === false) {
          return false;
        }

        if (props.inheritedPermissions[permission.id] !== undefined) {
          inheritedPermissionCount++;
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
        inheritedPermissionCount,
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
              <span className="ml-auto mr-0">
                {group.selectedPermissionCount > 0 && (
                  <span className="mr-1 inline-block text-sm">
                    {group.selectedPermissionCount} selected
                  </span>
                )}
                {group.inheritedPermissionCount > 0 && (
                  <span className="ml-1 mr-1 text-sm">
                    {group.inheritedPermissionCount} inherited
                  </span>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pl-2 pt-1" forceMount={true}>
              {group.permissions.map(permission => {
                const needsDependency =
                  !!permission.dependsOn &&
                  props.grantedPermissions[permission.dependsOn] !== 'allow' &&
                  props.inheritedPermissions[permission.dependsOn] !== 'allow';

                if (props.resourceLevel === 'service') {
                  console.log(props.inheritedPermissions);
                }

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
                    {props.inheritedPermissions[permission.id] === 'allow' && <>INHERITED</>}
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
                      disabled={
                        permission.readOnly ||
                        needsDependency ||
                        props.inheritedPermissions[permission.id] === 'allow'
                      }
                      value={
                        permission.readOnly || props.inheritedPermissions[permission.id] === 'allow'
                          ? 'allow'
                          : props.grantedPermissions[permission.id] || 'not-selected'
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
  inheritedPermissions: GrantedPermissions;
  onClick: () => void;
  mode: PermissionsSelectionGroupAccessMode;
  resourceLevel: ResourceLevel;
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

  const inheritedPermissionsCount = Array.from(Object.entries(props.inheritedPermissions)).reduce(
    (current, [permissionId, value]) => {
      if (!value || permissionsById.get(permissionId)?.level !== props.resourceLevel) {
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
      {props.mode === PermissionsSelectionGroupAccessMode.granular && (
        <>
          {assignedPermissionsCount > 0 && (
            <span className="ml-1">{assignedPermissionsCount} selected</span>
          )}
          {inheritedPermissionsCount > 0 && (
            <span className="ml-1">{inheritedPermissionsCount} inherited</span>
          )}
        </>
      )}
      <ChevronRight size={16} className="ml-2" />
    </Button>
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
          id: 'organization',
          level: ResourceLevel.organization,
          title: 'Organization Level Permissions',
        }),
        createPermissionSelectionGroup({
          id: 'project',
          level: ResourceLevel.project,
          title: 'Project Level Permissions',
        }),
        createPermissionSelectionGroup({
          id: 'target',
          level: ResourceLevel.target,
          title: 'Target Level Permissions',
        }),
        createPermissionSelectionGroup({
          id: 'service',
          level: ResourceLevel.service,
          title: 'Service Level Permissions',
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

  const inheritedPermissions = useMemo(() => {
    return {
      organization: {},
      project: getInheritedPermissions(ResourceLevel.project, [
        dynamicGroups[0].selectedPermissions,
      ]),
      target: getInheritedPermissions(ResourceLevel.target, [
        dynamicGroups[0].selectedPermissions,
        dynamicGroups[1].selectedPermissions,
      ]),
      service: getInheritedPermissions(ResourceLevel.service, [
        dynamicGroups[0].selectedPermissions,
        dynamicGroups[1].selectedPermissions,
        dynamicGroups[2].selectedPermissions,
      ]),
    };
  }, [dynamicGroups]);

  if (navigationState?.type === 'group') {
    const selectedGroup = dynamicGroups.find(group => group.id === navigationState.groupId);

    if (selectedGroup) {
      return (
        <PermissionSelectionGroupEditor
          close={() => setNavigationState(null)}
          group={selectedGroup}
          inheritedPermissions={inheritedPermissions[selectedGroup.level]}
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
      inheritedPermissions={inheritedPermissions}
      groups={dynamicGroups}
    />
  );
}

function PermissionOverview(props: {
  navigateToGroup: (groupId: string) => void;
  navigateToConfirmation: () => void;
  inheritedPermissions: {
    organization: GrantedPermissions;
    project: GrantedPermissions;
    target: GrantedPermissions;
    service: GrantedPermissions;
  };
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
                    inheritedPermissions={props.inheritedPermissions[group.level]}
                    grantedPermissions={group.selectedPermissions}
                    onClick={() => props.navigateToGroup(group.id)}
                    mode={group.mode}
                    resourceLevel={group.level}
                  />
                );
              })}
            </div>
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
  inheritedPermissions: GrantedPermissions;
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
          </div>
          <div
            className={cn(
              'max-h-[500px] w-full overflow-scroll pr-5',
              !!(props.group.mode === PermissionsSelectionGroupAccessMode.allowAll) &&
                'pointer-events-none opacity-25',
            )}
          >
            <PermissionSelector
              resourceLevel={props.group.level}
              inheritedPermissions={props.inheritedPermissions}
              grantedPermissions={
                props.group.mode === PermissionsSelectionGroupAccessMode.allowAll
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
        <Button onClick={props.close}>
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
                        <td className="ml-2 text-right">
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
