import {
  createContext,
  memo,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';
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

export const Default: Story = {
  render: () => (
    <div className="p-5">
      <Tabs defaultValue="full" className="w-[400px]">
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
            {/* <CardContent className="space-y-2">
              The permissions are applied for all resources within the organization.
            </CardContent> */}
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
            <CardContent className="space-y-2">
              <FileTree>
                <FileTree.Folder name="graphql-hive" defaultOpen>
                  <FileTree.Folder
                    name="production"
                    defaultOpen
                    label={
                      <>
                        <span className="mr-1">production</span>
                        <Badge className="ml-auto mr-0">Project</Badge>
                      </>
                    }
                  ></FileTree.Folder>
                  <FileTree.Folder
                    name="staging"
                    label={
                      <>
                        <span className="mr-1">staging</span>
                        <Badge className="ml-auto mr-0">Project</Badge>
                      </>
                    }
                    defaultOpen
                  ></FileTree.Folder>
                  <FileTree.Folder
                    name="development"
                    label={
                      <>
                        <span className="mr-1">development</span>
                        <Badge className="ml-auto mr-0">Project</Badge>
                      </>
                    }
                    defaultOpen
                  ></FileTree.Folder>
                </FileTree.Folder>
              </FileTree>
            </CardContent>
            <CardFooter>
              <Button>Assign Role</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  ),
};

const ctx = createContext(0);

function useIndent() {
  return useContext(ctx);
}

interface FolderProps {
  name: string;
  label?: ReactElement;
  open?: boolean;
  defaultOpen?: boolean;
  onToggle?: (open: boolean) => void;
  children: ReactNode;
}

interface FileProps {
  name: string;
  label?: ReactElement;
  active?: boolean;
}

function Tree({ children }: { children: ReactNode }): ReactElement {
  return (
    <div
      className={cn(
        'nextra-filetree mt-6 select-none text-sm text-gray-800 dark:text-gray-300',
        '_not-prose', // for nextra-theme-blog
      )}
    >
      <ul className="dark:border-primary-100/10 inline-block rounded-lg border border-neutral-200/70 px-4 py-2 contrast-more:border-neutral-400 contrast-more:dark:border-neutral-400">
        {children}
      </ul>
    </div>
  );
}

function Ident(): ReactElement {
  const length = useIndent();
  return (
    <>
      {Array.from({ length }, (_, i) => (
        // Text can shrink indent
        <span className="w-5 shrink-0" key={i} />
      ))}
    </>
  );
}

const Folder = memo<FolderProps>(
  ({ label, name, open, children, defaultOpen = false, onToggle }) => {
    const indent = useIndent();
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const toggle = useCallback(() => {
      onToggle?.(!isOpen);
      setIsOpen(!isOpen);
    }, [isOpen, onToggle]);

    const isFolderOpen = open === undefined ? isOpen : open;

    return (
      <li className="flex w-full list-none flex-col">
        <button
          onClick={toggle}
          title={name}
          className={cn('inline-flex w-full items-center py-1 hover:opacity-60')}
        >
          <Ident />
          <svg
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            // Text can shrink icon
            className="shrink-0"
          >
            <path
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={
                isFolderOpen
                  ? 'M5 19a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2 2h4a2 2 0 0 1 2 2v1M5 19h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2Z'
                  : 'M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2Z'
              }
            />
          </svg>
          <span className="ml-1 inline-flex grow text-left">{label ?? name}</span>
        </button>
        {isFolderOpen && (
          <ul>
            <ctx.Provider value={indent + 1}>{children}</ctx.Provider>
          </ul>
        )}
      </li>
    );
  },
);
Folder.displayName = 'Folder';

const File = memo<FileProps>(({ label, name, active }) => (
  <li className={cn('flex list-none', active && 'text-primary-600 contrast-more:underline')}>
    <span className="inline-flex cursor-default items-center py-1">
      <Ident />
      <svg
        width="1em"
        height="1em"
        viewBox="0 0 24 24"
        // Text can shrink icon
        className="shrink-0"
      >
        <path
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z"
        />
      </svg>
      <span className="ml-1">{label ?? name}</span>
    </span>
  </li>
));
File.displayName = 'File';

export const FileTree = Object.assign(Tree, { Folder, File });

function mask(token: string) {
  if (token.length < 6) {
  }
}
