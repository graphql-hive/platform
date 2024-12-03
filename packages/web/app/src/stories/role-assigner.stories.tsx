import {
  createContext,
  memo,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';
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
  .map(project => [
    { id: project.id + '/users', level: ResourceLevel.service },
    { id: project.id + '/orders', level: ResourceLevel.service },
    { id: project.id + '/products', level: ResourceLevel.service },
  ])
  .flatMap(value => value);

function Implementation() {
  const [state, setState] = useState();

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
                  <Row title="graphql-hive (2 targets)" isActive />
                  <Row title="project-a" isActive={false} />
                  <Row title="project-xzy" isActive={false} />
                  <Row title="accounter" isActive={false} />
                  <Row title="graphql-hive" isActive={false} />

                  <div className="mb-1 mt-3 px-2 text-xs uppercase text-gray-500">Unselected</div>
                  <div className="px-2 text-xs">None</div>
                </div>
                <div className="flex flex-1 flex-col border-r pt-3">
                  <div className="mb-1 px-2 text-xs uppercase text-gray-500">access granted</div>
                  <Row title="development" isActive={false} />
                  <Row title="staging" isActive />
                  <div className="mb-1 mt-3 px-2 text-xs uppercase text-gray-500">Unselected</div>
                  <Row title="production" isActive={false} />
                  <div className="mb-0 mt-auto border-t p-1 text-right text-xs">
                    Mode <button className="mr-1 text-orange-500">Granular</button>
                    <button>All</button>
                  </div>
                </div>
                <div className="flex flex-1 flex-col pt-3">
                  <div className="mb-1 px-2 text-xs uppercase text-gray-500">access granted</div>
                  <div className="px-2 text-xs">None</div>
                  <div className="mb-1 mt-3 px-2 text-xs uppercase text-gray-500">Unselected</div>
                  <Row title="users" isActive={false} />
                  <Row title="sales" isActive={false} />
                  <Row title="products" isActive={false} />
                  <input
                    placeholder="Add service by name"
                    className="mx-2 mt-1 max-w-[70%] border-b text-sm"
                  />
                  <div className="mb-0 mt-auto border-t p-1 text-right text-xs">
                    Mode <button className="mr-1 text-orange-500">Granular</button>
                    <button>All</button>
                  </div>
                </div>
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

function Row(props: { title: string; isActive: boolean }) {
  return (
    <div
      className="flex cursor-pointer items-center space-x-1 px-2 py-1 data-[active=true]:cursor-default data-[active=true]:bg-white data-[active=true]:text-black"
      data-active={props.isActive}
    >
      <span className="text-sm">{props.title}</span>
      {props.isActive && <ChevronRightIcon size={12} />}
    </div>
  );
}
