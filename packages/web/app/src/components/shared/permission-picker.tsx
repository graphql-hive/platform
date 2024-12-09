import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckIcon, InfoIcon, XIcon } from 'lucide-react';
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
  createGrantedPermissionsObject,
  GrantedPermissions,
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
              <span className="ml-auto mr-0">
                {group.selectedPermissionCount > 0 && (
                  <span className="mr-1 inline-block text-sm">
                    {group.selectedPermissionCount} selected
                  </span>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pl-2 pt-1" forceMount>
              {group.permissions.map(permission => {
                const needsDependency =
                  !!permission.dependsOn &&
                  props.grantedPermissions[permission.dependsOn] !== 'allow';

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

type PermissionPickerProps = {
  resources: Array<Resource>;
};

type NavigationState = {
  type: 'confirmation';
};

export function PermissionPicker(_props: PermissionPickerProps) {
  // TODO: should be passed via props
  const [navigationState, setNavigationState] = useState<null | NavigationState>(() => {
    try {
      return JSON.parse(localStorage.getItem('hive:prototype:permissions')!).navigationState;
    } catch (err) {
      return null;
    }
  });

  const [grantedPermissions, setGrantedPermissions] = useState<GrantedPermissions>(() => {
    // TODO: should be passed via props
    try {
      return JSON.parse(localStorage.getItem('hive:prototype:permissions')!).grantedPermissions;
    } catch (err) {
      return createGrantedPermissionsObject();
    }
  });

  useEffect(() => {
    localStorage.setItem(
      'hive:prototype:permissions',
      JSON.stringify({
        navigationState,
        grantedPermissions,
      }),
    );
  }, [navigationState, grantedPermissions]);

  if (navigationState?.type === 'confirmation') {
    return (
      <ConfirmationScreen
        grantedPermissions={grantedPermissions}
        resources={[
          { id: 'Organization', level: ResourceLevel.organization },
          { id: 'Project', level: ResourceLevel.project },
          { id: 'Target', level: ResourceLevel.target },
          { id: 'Service', level: ResourceLevel.service },
        ]}
        goBack={() => setNavigationState(null)}
      />
    );
  }

  return (
    <PermissionOverview
      navigateToConfirmation={() => setNavigationState({ type: 'confirmation' })}
      grantedPermissions={grantedPermissions}
      updateGrantedPermissions={permissions =>
        setGrantedPermissions(grantedPermissions => ({ ...grantedPermissions, ...permissions }))
      }
    />
  );
}

function PermissionOverview(props: {
  navigateToConfirmation: () => void;
  grantedPermissions: GrantedPermissions;
  updateGrantedPermissions: (grantedPermissions: GrantedPermissions) => void;
}) {
  const form = useForm({
    defaultValues: {},
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Member Role Editor</CardTitle>
        <CardDescription>Select permissions for the member role.</CardDescription>
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
          <div className={cn('max-h-[500px] w-full overflow-scroll pr-5')}>
            <PermissionSelector
              resourceLevel={ResourceLevel.organization}
              grantedPermissions={props.grantedPermissions}
              updateGrantedPermissions={props.updateGrantedPermissions}
            />
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

function ConfirmationScreen(props: {
  grantedPermissions: GrantedPermissions;
  resources: Array<Resource>;
  goBack: () => void;
}) {
  const [showAllowOnly, setShowAllowOnly] = useState(true);

  return (
    <>
      <CardHeader>
        <CardTitle>Member Role Editor</CardTitle>
        <CardDescription>
          These are the permissions that will be granted on the specified resources when attaching
          the role to a user within the organization.
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
        {props.resources.map(resource => (
          <MemberRoleConfirmationGroup
            key={resource.id}
            title={resource.id}
            level={resource.level}
            permissions={props.grantedPermissions}
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
