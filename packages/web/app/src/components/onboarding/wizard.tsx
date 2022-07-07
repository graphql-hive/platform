import React from 'react';
import { VscIssues, VscError } from 'react-icons/vsc';
import clsx from 'clsx';
import {
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from '@chakra-ui/react';

interface OnboardingTasks {
  creatingProject: boolean;
  publishingSchema: boolean;
  checkingSchema: boolean;
  invitingMembers: boolean;
  reportingOperations: boolean;
  enablingUsageBasedBreakingChanges: boolean;
}

export function OnboardingProgress() {
  const tasks: OnboardingTasks = {
    creatingProject: true,
    publishingSchema: false,
    checkingSchema: false,
    invitingMembers: false,
    reportingOperations: false,
    enablingUsageBasedBreakingChanges: true,
  };

  const { isOpen, onOpen, onClose } = useDisclosure();
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const values = Object.values(tasks);
  const total = values.length;
  const completed = values.filter(t => t === true).length;
  const remaining = total - completed;

  if (remaining === 0) {
    return null;
  }

  return (
    <>
      <button onClick={onOpen} className="cursor-pointer rounded px-4 py-2 text-left hover:opacity-80" ref={triggerRef}>
        <div className="font-medium">Get Started</div>
        <div className="text-xs text-gray-500">
          {remaining} remaining task{remaining > 1 ? 's' : ''}
        </div>
        <div>
          <div
            className="relative mt-1 w-full overflow-hidden rounded bg-gray-800"
            style={{
              height: 5,
            }}
          >
            <div
              className="bg-orange-500 h-full"
              style={{
                width: `${(completed / total) * 100}%`,
              }}
            />
          </div>
        </div>
      </button>
      <OnboardingWizard isOpen={isOpen} onClose={onClose} triggerRef={triggerRef} tasks={tasks} />
    </>
  );
}

function OnboardingWizard({
  isOpen,
  onClose,
  triggerRef,
  tasks,
}: {
  isOpen: boolean;
  onClose(): void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  tasks: OnboardingTasks;
}) {
  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} finalFocusRef={triggerRef} size="md">
      <DrawerOverlay />
      <DrawerContent bgColor={'gray.800'}>
        <DrawerCloseButton />
        <DrawerHeader>Get Started</DrawerHeader>
        <DrawerBody>
          <p>Complete these steps to experience the full power of GraphQL Hive</p>
          <div className="mt-4 flex flex-col divide-y-2 divide-gray-900">
            <Task link={`${process.env.NEXT_PUBLIC_DOCS_LINK}/get-started/projects`} completed={tasks.creatingProject}>
              Create a project
            </Task>
            <Task
              link={`${process.env.NEXT_PUBLIC_DOCS_LINK}/features/publish-schema`}
              completed={tasks.publishingSchema}
            >
              Publish a schema
            </Task>
            <Task
              link={`${process.env.NEXT_PUBLIC_DOCS_LINK}/features/checking-schema`}
              completed={tasks.checkingSchema}
            >
              Check a schema
            </Task>
            <Task
              link={`${process.env.NEXT_PUBLIC_DOCS_LINK}/get-started/organizations#members`}
              completed={tasks.invitingMembers}
            >
              Invite members
            </Task>
            <Task
              link={`${process.env.NEXT_PUBLIC_DOCS_LINK}/features/monitoring`}
              completed={tasks.reportingOperations}
            >
              Report operations
            </Task>
            <Task
              link={`${process.env.NEXT_PUBLIC_DOCS_LINK}/features/checking-schema#with-usage-enabled`}
              completed={tasks.enablingUsageBasedBreakingChanges}
            >
              Enable usage-based breaking changes
            </Task>
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

function Task({
  completed,
  children,
  link,
}: React.PropsWithChildren<{
  completed: boolean;
  link: string;
}>) {
  return (
    <a
      href={link}
      target="_blank"
      className={clsx('flex flex-row items-center gap-4 p-3 text-left', completed ? 'opacity-50' : 'hover:opacity-80')}
    >
      {completed ? (
        <VscIssues className="h-[20px] w-[20px] text-green-400" />
      ) : (
        <VscError className="h-[20px] w-[20px] text-red-400" />
      )}
      {children}
    </a>
  );
}
