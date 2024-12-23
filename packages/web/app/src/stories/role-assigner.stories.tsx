import {
  createContext,
  memo,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { cx } from 'class-variance-authority';
import { produce } from 'immer';
import { ChevronRightIcon } from 'lucide-react';
import { Resource } from '@/components/shared/permission-picker/lib';
import { ResourceLevel } from '@/components/shared/permission-picker/permissions';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { Meta, StoryObj } from '@storybook/react';

const P = () => null;

const meta: Meta<typeof P> = {
  title: 'Role Assigner',
  component: () => null,
};
export default meta;

// export default meta;
type Story = StoryObj<typeof P>;

const projects: Array<Resource> = [
  {
    id: 'graphql-hive',
    level: ResourceLevel.project,
  },
  {
    id: 'project-a',
    level: ResourceLevel.project,
  },
  {
    id: 'project-xyz',
    level: ResourceLevel.project,
  },
  {
    id: 'accounter',
    level: ResourceLevel.project,
  },
];

const targets: Array<Resource> = projects
  .map(project => [
    { id: project.id + '/development', level: ResourceLevel.target },
    { id: project.id + '/staging', level: ResourceLevel.target },
    { id: project.id + '/production', level: ResourceLevel.target },
  ])
  .flatMap(value => value);

const services: Array<Resource> = targets
  .map(target => [
    { id: target.id + '/users', level: ResourceLevel.service },
    { id: target.id + '/orders', level: ResourceLevel.service },
    { id: target.id + '/products', level: ResourceLevel.service },
  ])
  .flatMap(value => value);

type Selection = {
  breadcrumb: null | {
    projectId: string;
    target: null | {
      targetId: string;
      service: null | {
        serviceId: string;
      };
    };
  };
  selectedProjects: Array<{
    projectId: string;
    targets: '*' | Array<{ targetId: string; services: '*' | Array<{ serviceId: string }> }>;
  }>;
};

function Implementation() {
  const [state, setState] = useState<Selection>({ breadcrumb: null, selectedProjects: [] });

  const [selectedProject, unselectedProjects] = useMemo(() => {
    const unselectedProjects: Array<Resource> = [];
    const selectedProjects: Array<Resource> = [];
    for (const project of projects) {
      if (
        state.selectedProjects.find(selectedProject => project.id === selectedProject.projectId)
      ) {
        selectedProjects.push(project);
        continue;
      }
      unselectedProjects.push(project);
    }

    return [selectedProjects, unselectedProjects] as const;
  }, [state]);

  const targetState = useMemo(() => {
    if (!state.breadcrumb?.projectId) {
      return null;
    }

    const selectedProjectId = state.breadcrumb.projectId;

    const project = state.selectedProjects.find(
      selectedProject => selectedProject.projectId === selectedProjectId,
    );

    if (!project) {
      return null;
    }

    function setAll() {
      setState(state =>
        produce(state, state => {
          const selectedProject = state.selectedProjects.find(
            project => project.projectId === selectedProjectId,
          );

          if (!selectedProject) {
            return;
          }
          selectedProject.targets = '*';
        }),
      );
    }

    function setGranular() {
      setState(state =>
        produce(state, state => {
          const selectedProject = state.selectedProjects.find(
            project => project.projectId === selectedProjectId,
          );

          if (!selectedProject || Array.isArray(selectedProject.targets)) {
            return;
          }

          selectedProject.targets = [];
        }),
      );
    }

    if (project.targets === '*') {
      return {
        selection: '*',
        setAll,
        setGranular,
      } as const;
    }

    const selected: Array<Resource> = [];
    const unselected: Array<Resource> = [];

    for (const target of targets) {
      if (target.id.startsWith(selectedProjectId + '/') === false) {
        continue;
      }

      if (project.targets.find(selectedTarget => target.id === selectedTarget.targetId)) {
        selected.push(target);
        continue;
      }
      unselected.push(target);
    }

    return {
      selection: {
        selected,
        unselected,
      },
      setAll,
      setGranular,
      setActiveTarget(targetId: string) {
        setState(state =>
          produce(state, state => {
            if (!state.breadcrumb) {
              return;
            }

            state.breadcrumb.target = {
              targetId,
              service: null,
            };
          }),
        );
      },
      selectTarget(targetId: string) {
        setState(state =>
          produce(state, state => {
            const selectedProject = state.selectedProjects.find(
              project => project.projectId === selectedProjectId,
            );
            if (!selectedProject || !Array.isArray(selectedProject.targets) || !state.breadcrumb) {
              return;
            }

            selectedProject.targets.push({ targetId, services: [] });
            state.breadcrumb.target = {
              targetId,
              service: null,
            };
          }),
        );
      },
    } as const;
  }, [state.breadcrumb?.projectId, state.selectedProjects]);

  const serviceState = useMemo(() => {
    if (!state.breadcrumb?.target?.targetId) {
      return null;
    }

    const selectedProjectId = state.breadcrumb.projectId;
    const selectedTargetId = state.breadcrumb.target.targetId;

    const selectedProject = state.selectedProjects.find(
      selectedProject => selectedProject.projectId === selectedProjectId,
    );

    if (!selectedProject || !Array.isArray(selectedProject.targets)) {
      return null;
    }
    const selectedTarget = selectedProject.targets.find(
      selectedTarget => selectedTarget.targetId === selectedTargetId,
    );
    if (!selectedTarget) {
      return null;
    }

    function setAll() {
      setState(state =>
        produce(state, state => {
          const selectedProject = state.selectedProjects.find(
            selectedProject => selectedProject.projectId === selectedProjectId,
          );
          console.log('durrr', selectedProject);

          if (!selectedProject || !Array.isArray(selectedProject.targets)) {
            return;
          }

          const selectedTarget = selectedProject.targets.find(
            selectedTarget => selectedTarget.targetId === selectedTargetId,
          );

          if (!selectedTarget) {
            return;
          }

          selectedTarget.services = '*';
        }),
      );
    }

    function setGranular() {
      setState(state =>
        produce(state, state => {
          const selectedProject = state.selectedProjects.find(
            selectedProject => selectedProject.projectId === selectedProjectId,
          );

          if (!selectedProject || !Array.isArray(selectedProject.targets)) {
            return;
          }

          const selectedTarget = selectedProject?.targets.find(
            selectedTarget => selectedTarget.targetId === selectedTargetId,
          );

          if (!selectedTarget || Array.isArray(selectedTarget.services)) {
            return;
          }

          selectedTarget.services = [];
        }),
      );
    }

    if (selectedTarget.services === '*') {
      return {
        selection: '*',
        setAll,
        setGranular,
      } as const;
    }

    const selected: Array<Resource> = [];
    const unselected: Array<Resource> = [];

    for (const service of services) {
      if (service.id.startsWith(selectedTargetId + '/') === false) {
        continue;
      }

      if (
        selectedTarget.services.find(selectedService => service.id === selectedService.serviceId)
      ) {
        selected.push(service);
        continue;
      }
      unselected.push(service);
    }

    return {
      selection: { selected, unselected },
      setAll,
      setGranular,
      selectService(serviceId: string) {
        setState(state =>
          produce(state, state => {
            const selectedProject = state.selectedProjects.find(
              project => project.projectId === selectedProjectId,
            );
            if (!selectedProject || !Array.isArray(selectedProject.targets)) {
              return;
            }

            const selectedTarget = selectedProject.targets.find(
              selectedTarget => selectedTarget.targetId === selectedTargetId,
            );

            if (!selectedTarget || !Array.isArray(selectedTarget.services)) {
              return;
            }
            selectedTarget.services.push({ serviceId });
          }),
        );
      },
    } as const;
  }, [state.breadcrumb?.target?.targetId, state?.selectedProjects]);

  return (
    <div className="p-5">
      <Tabs defaultValue="granular" className="max-w-[700px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="full">Organization Wide</TabsTrigger>
          <TabsTrigger value="granular">Granular Resource Based</TabsTrigger>
        </TabsList>
        <TabsContent value="full">
          <Card>
            <CardHeader>
              <CardTitle>Organization Wide Access</CardTitle>
              <CardDescription>
                The permissions are applied for all resources within the organization.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button>Save changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="granular">
          <Card>
            <CardHeader>
              <CardTitle>Granular Resource Based</CardTitle>
              <CardDescription>
                Permissions are only assigned to specified resources.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex text-sm">
                <div className="flex-1 border-x border-transparent px-2 pb-1">Projects</div>
                <div className="flex-1 border-transparent px-2 pb-1">Targets</div>
                <div className="flex-1 border-x border-transparent px-2 pb-1">Service</div>
              </div>
              <div className="flex min-h-[250px] flex-wrap rounded-sm rounded-t-none border">
                <div className="flex flex-1 flex-col border-r pt-3">
                  <div className="mb-1 px-2 text-xs uppercase text-gray-500">access granted</div>
                  {selectedProject.length ? (
                    selectedProject.map(project => (
                      <Row
                        key={project.id}
                        title={project.id}
                        isActive={state.breadcrumb?.projectId === project.id}
                        onClick={() =>
                          setState(state =>
                            produce(state, state => {
                              state.breadcrumb = {
                                projectId: project.id,
                                target: null,
                              };
                            }),
                          )
                        }
                      />
                    ))
                  ) : (
                    <div className="px-2 text-xs">None</div>
                  )}
                  <div className="mb-1 mt-3 px-2 text-xs uppercase text-gray-500">Unselected</div>
                  {unselectedProjects.length ? (
                    unselectedProjects.map(project => (
                      <Row
                        key={project.id}
                        title={project.id}
                        isActive={state.breadcrumb?.projectId === project.id}
                        onClick={() =>
                          setState(state =>
                            produce(state, state => {
                              state.breadcrumb = {
                                projectId: project.id,
                                target: null,
                              };
                              state.selectedProjects.push({
                                projectId: project.id,
                                targets: [],
                              });
                            }),
                          )
                        }
                      />
                    ))
                  ) : (
                    <div className="px-2 text-xs">None</div>
                  )}
                </div>
                {targetState ? (
                  <div className="flex flex-1 flex-col border-r pt-3">
                    {targetState.selection === '*' ? (
                      <div className="px-2 text-sm text-gray-500">
                        Access to all targets of project granted.
                      </div>
                    ) : (
                      <>
                        <div className="mb-1 px-2 text-xs uppercase text-gray-500">
                          access granted
                        </div>
                        {targetState.selection.selected?.length ? (
                          targetState.selection.selected.map(target => (
                            <Row
                              title={target.id.split('/')[1]}
                              isActive={state.breadcrumb?.target?.targetId === target.id}
                              onClick={() => targetState.selectTarget(target.id)}
                            />
                          ))
                        ) : (
                          <div className="px-2 text-xs">None</div>
                        )}
                        <div className="mb-1 mt-3 px-2 text-xs uppercase text-gray-500">
                          Unselected
                        </div>
                        {targetState.selection.unselected?.length ? (
                          targetState.selection.unselected.map(target => (
                            <Row
                              title={target.id.split('/')[1]}
                              isActive={state.breadcrumb?.target?.targetId === target.id}
                              onClick={() => targetState.selectTarget(target.id)}
                            />
                          ))
                        ) : (
                          <div className="px-2 text-xs">None</div>
                        )}
                      </>
                    )}

                    <div className="mb-0 mt-auto border-t p-1 text-right text-xs">
                      Mode{' '}
                      <button
                        className={cx('mr-1', targetState.selection !== '*' && 'text-orange-500')}
                        onClick={targetState.setGranular}
                      >
                        Granular
                      </button>
                      <button
                        className={cx(targetState.selection === '*' && 'text-orange-500')}
                        onClick={targetState.setAll}
                      >
                        All
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col border-r pt-3" />
                )}
                {serviceState ? (
                  <div className="flex flex-1 flex-col pt-3">
                    {serviceState.selection === '*' ? (
                      <div className="px-2 text-sm text-gray-500">
                        Access to all services of project granted.
                      </div>
                    ) : (
                      <>
                        <div className="mb-1 px-2 text-xs uppercase text-gray-500">
                          access granted
                        </div>
                        {serviceState.selection.selected?.length ? (
                          serviceState.selection.selected.map(service => (
                            <Row
                              title={service.id.split('/')[2]}
                              isActive={false}
                              onClick={() => {}}
                            />
                          ))
                        ) : (
                          <div className="px-2 text-xs">None</div>
                        )}
                        <div className="mb-1 mt-3 px-2 text-xs uppercase text-gray-500">
                          Unselected
                        </div>
                        {serviceState.selection.unselected.map(service => (
                          <Row
                            title={service.id.split('/')[2]}
                            isActive={false}
                            onClick={() => serviceState.selectService(service.id)}
                          />
                        ))}
                        <input
                          placeholder="Add service by name"
                          className="mx-2 mt-1 max-w-[70%] border-b text-sm"
                        />
                      </>
                    )}
                    <div className="mb-0 mt-auto border-t p-1 text-right text-xs">
                      Mode{' '}
                      <button
                        className={cx('mr-1', serviceState.selection !== '*' && 'text-orange-500')}
                        onClick={serviceState.setGranular}
                      >
                        Granular
                      </button>
                      <button
                        className={cx('mr-1', serviceState.selection === '*' && 'text-orange-500')}
                        onClick={serviceState.setAll}
                      >
                        All
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col pt-3" />
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button>Assign Role</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const Default: Story = {
  render() {
    return <Implementation />;
  },
};

function Row(props: { title: string; isActive?: boolean; onClick: () => void }) {
  return (
    <button
      className="flex cursor-pointer items-center space-x-1 px-2 py-1 data-[active=true]:cursor-default data-[active=true]:bg-white data-[active=true]:text-black"
      data-active={props.isActive}
      onClick={props.onClick}
    >
      <span className="text-sm">{props.title}</span>
      {props.isActive && <ChevronRightIcon size={12} />}
    </button>
  );
}
