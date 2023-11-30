import { useMemo, useState } from 'react';
import NextLink from 'next/link';
import clsx from 'clsx';
import { useMutation, useQuery } from 'urql';
import { authenticated } from '@/components/authenticated-container';
import { Page, TargetLayout } from '@/components/layouts/target';
import { SchemaEditor } from '@/components/schema-editor';
import { ChangesBlock, labelize } from '@/components/target/history/errors-and-changes';
import { Label } from '@/components/ui/label';
import { Subtitle, Title } from '@/components/ui/page';
import { QueryError } from '@/components/ui/query-error';
import {
  Badge,
  Button,
  DiffEditor,
  DocsLink,
  EmptyList,
  Heading,
  MetaTitle,
  Modal,
  Switch,
  TimeAgo,
  Tooltip,
} from '@/components/v2';
import { AlertTriangleIcon, DiffIcon } from '@/components/v2/icon';
import { FragmentType, graphql, useFragment } from '@/gql';
import { CriticalityLevel } from '@/gql/graphql';
import { useRouteSelector } from '@/lib/hooks';
import { withSessionProtection } from '@/lib/supertokens/guard';
import { cn } from '@/lib/utils';
import { ExternalLinkIcon, ListBulletIcon } from '@radix-ui/react-icons';
import * as ToggleGroup from '@radix-ui/react-toggle-group';

const SchemaChecks_NavigationQuery = graphql(`
  query SchemaChecks_NavigationQuery(
    $organizationId: ID!
    $projectId: ID!
    $targetId: ID!
    $after: String
    $filters: SchemaChecksFilter
  ) {
    target(selector: { organization: $organizationId, project: $projectId, target: $targetId }) {
      id
      schemaChecks(first: 20, after: $after, filters: $filters) {
        edges {
          node {
            __typename
            id
            createdAt
            serviceName
            meta {
              commit
              author
            }
            breakingSchemaChanges {
              total
            }
            safeSchemaChanges {
              total
            }
            githubRepository
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          endCursor
        }
      }
    }
  }
`);

interface SchemaCheckFilters {
  showOnlyFailed?: boolean;
  showOnlyChanged?: boolean;
}

const Navigation = (props: {
  after: string | null;
  isLastPage: boolean;
  onLoadMore: (cursor: string) => void;
  filters?: SchemaCheckFilters;
}) => {
  const router = useRouteSelector();
  const [query] = useQuery({
    query: SchemaChecks_NavigationQuery,
    variables: {
      organizationId: router.organizationId,
      projectId: router.projectId,
      targetId: router.targetId,
      after: props.after,
      filters: {
        changed: props.filters?.showOnlyChanged ?? false,
        failed: props.filters?.showOnlyFailed ?? false,
      },
    },
  });

  return (
    <>
      {query.fetching || !query.data?.target?.schemaChecks ? null : (
        <>
          {query.data.target.schemaChecks.edges.map(edge => (
            <div
              className={cn(
                'flex flex-col rounded-md p-2.5 hover:bg-gray-800/40',
                edge.node.id === router.schemaCheckId ? 'bg-gray-800/40' : null,
              )}
            >
              <NextLink
                key={edge.node.id}
                href={{
                  pathname: '/[organizationId]/[projectId]/[targetId]/checks/[schemaCheckId]',
                  query: {
                    organizationId: router.organizationId,
                    projectId: router.projectId,
                    targetId: router.targetId,
                    schemaCheckId: edge.node.id,
                    filter_changed: props.filters?.showOnlyChanged,
                    filter_failed: props.filters?.showOnlyFailed,
                  },
                }}
                scroll={false} // disable the scroll to top on page
              >
                <h3 className="truncate text-sm font-semibold">
                  {edge.node.meta?.commit ?? edge.node.id}
                </h3>
                {edge.node.meta?.author ? (
                  <div className="truncate text-xs font-medium text-gray-500">
                    <span className="overflow-hidden truncate">{edge.node.meta.author}</span>
                  </div>
                ) : null}
                <div className="mb-1.5 mt-2.5 flex align-middle text-xs font-medium text-[#c4c4c4]">
                  <div
                    className={cn(
                      edge.node.__typename === 'FailedSchemaCheck' ? 'text-red-500' : null,
                    )}
                  >
                    <Badge color={edge.node.__typename === 'FailedSchemaCheck' ? 'red' : 'green'} />{' '}
                    <TimeAgo date={edge.node.createdAt} />
                  </div>

                  {edge.node.serviceName ? (
                    <div className="ml-auto mr-0 w-1/2 truncate text-right font-bold">
                      {edge.node.serviceName}
                    </div>
                  ) : null}
                </div>
              </NextLink>
              {edge.node.githubRepository && edge.node.meta ? (
                <a
                  className="ml-[-1px] text-xs font-medium text-gray-500 hover:text-gray-400"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://github.com/${edge.node.githubRepository}/commit/${edge.node.meta.commit}`}
                >
                  <ExternalLinkIcon className="inline" /> associated with Git commit
                </a>
              ) : null}
            </div>
          ))}
          {props.isLastPage && query.data.target.schemaChecks.pageInfo.hasNextPage && (
            <Button
              variant="link"
              onClick={() => {
                props.onLoadMore(query.data?.target?.schemaChecks.pageInfo.endCursor ?? '');
              }}
            >
              Load more
            </Button>
          )}
        </>
      )}
    </>
  );
};

const ActiveSchemaCheck_SchemaCheckFragment = graphql(`
  fragment ActiveSchemaCheck_SchemaCheckFragment on SchemaCheck {
    __typename
    id
    schemaSDL
    schemaVersion {
      id
      supergraph
      sdl
    }
    serviceName
    createdAt
    meta {
      commit
      author
    }
    breakingSchemaChanges {
      nodes {
        message(withSafeBasedOnUsageNote: false)
        criticality
        criticalityReason
        path
        approval {
          approvedBy {
            id
            displayName
          }
          approvedAt
          schemaCheckId
        }
        isSafeBasedOnUsage
        affectedOperations {
          name
          hash
          count
        }
      }
    }
    safeSchemaChanges {
      nodes {
        message(withSafeBasedOnUsageNote: false)
        criticality
        criticalityReason
        path
        approval {
          approvedBy {
            id
            displayName
          }
          approvedAt
          schemaCheckId
        }
        isSafeBasedOnUsage
      }
    }
    schemaPolicyWarnings {
      ...SchemaPolicyEditor_PolicyWarningsFragment
      edges {
        node {
          message
        }
      }
    }
    schemaPolicyErrors {
      ...SchemaPolicyEditor_PolicyWarningsFragment
      edges {
        node {
          message
        }
      }
    }
    ... on FailedSchemaCheck {
      compositeSchemaSDL
      supergraphSDL
      compositionErrors {
        nodes {
          message
        }
      }
      canBeApproved
      canBeApprovedByViewer
    }
    ... on SuccessfulSchemaCheck {
      compositeSchemaSDL
      supergraphSDL
      isApproved
      approvedBy {
        id
        displayName
      }
    }
  }
`);

const ActiveSchemaCheckQuery = graphql(`
  query ActiveSchemaCheck_ActiveSchemaCheckQuery(
    $organizationId: ID!
    $projectId: ID!
    $targetId: ID!
    $schemaCheckId: ID!
  ) {
    target(selector: { organization: $organizationId, project: $projectId, target: $targetId }) {
      id
      schemaCheck(id: $schemaCheckId) {
        ...ActiveSchemaCheck_SchemaCheckFragment
      }
    }
  }
`);

const PolicyBlock = (props: {
  title: string;
  policies: FragmentType<typeof SchemaPolicyEditor_PolicyWarningsFragment>;
  type: 'warning' | 'error';
}) => {
  const policies = useFragment(SchemaPolicyEditor_PolicyWarningsFragment, props.policies);
  return (
    <div>
      <h2 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">{props.title}</h2>
      <ul className="list-inside list-disc pl-3 text-sm leading-relaxed">
        {policies.edges.map((edge, key) => (
          <li
            key={key}
            className={cn(props.type === 'warning' ? 'text-yellow-400' : 'text-red-400', ' my-1')}
          >
            <span className="text-gray-600 dark:text-white">{labelize(edge.node.message)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const ApproveFailedSchemaCheckMutation = graphql(`
  mutation ApproveFailedSchemaCheckModal_ApproveFailedSchemaCheckMutation(
    $input: ApproveFailedSchemaCheckInput!
  ) {
    approveFailedSchemaCheck(input: $input) {
      ok {
        schemaCheck {
          ...ActiveSchemaCheck_SchemaCheckFragment
        }
      }
      error {
        message
      }
    }
  }
`);

const ApproveFailedSchemaCheckModal = (props: {
  organizationId: string;
  projectId: string;
  targetId: string;
  schemaCheckId: string;
  isOpen: boolean;
  close: () => void;
}) => {
  const [state, mutate] = useMutation(ApproveFailedSchemaCheckMutation);

  return (
    <Modal open={props.isOpen} onOpenChange={props.close} className={clsx('w-[550px]')}>
      <div className={clsx('flex flex-col items-stretch gap-5')}>
        <Heading>Approve Failed Schema Check</Heading>
        {!state.data && !state.error ? (
          <>
            <p>Are you sure you want to approve this failed schema check?</p>
            <div className="flex w-full gap-2">
              <Button type="button" size="large" block onClick={props.close}>
                Close
              </Button>
              <Button
                type="submit"
                size="large"
                block
                variant="primary"
                disabled={state.fetching}
                onClick={() =>
                  mutate({
                    input: {
                      organization: props.organizationId,
                      project: props.projectId,
                      target: props.targetId,
                      schemaCheckId: props.schemaCheckId,
                    },
                  })
                }
              >
                Approve failed schema check
              </Button>
            </div>
          </>
        ) : state.error ? (
          <>
            <p>Oops. Something unexpected went wrong. Please try again later</p>
            <code>{state.error.message}</code>
            <div className="flex w-full gap-2">
              <Button type="button" size="large" block onClick={props.close}>
                Close
              </Button>
            </div>
          </>
        ) : state.data?.approveFailedSchemaCheck.error ? (
          <>
            <p>{state.data.approveFailedSchemaCheck.error.message}</p>
            <div className="flex w-full gap-2">
              <Button type="button" size="large" block onClick={props.close}>
                Close
              </Button>
            </div>
          </>
        ) : state.data?.approveFailedSchemaCheck.ok ? (
          <>
            <p>The schema check has been approved successfully!</p>
            <div className="flex w-full gap-2">
              <Button type="button" size="large" block onClick={props.close}>
                Close
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
};

const ActiveSchemaCheck = ({
  schemaCheckId,
}: {
  schemaCheckId: string | null;
}): React.ReactElement | null => {
  const router = useRouteSelector();
  const [query] = useQuery({
    query: ActiveSchemaCheckQuery,
    variables: {
      organizationId: router.organizationId,
      projectId: router.projectId,
      targetId: router.targetId,
      schemaCheckId: schemaCheckId ?? '',
    },
    pause: !schemaCheckId,
  });
  const [view, setView] = useState<string>('details');
  const [isApproveFailedSchemaCheckModalOpen, setIsApproveFailedSchemaCheckModalOpen] =
    useState(false);

  const schemaCheck = useFragment(
    ActiveSchemaCheck_SchemaCheckFragment,
    query.data?.target?.schemaCheck,
  );

  const [toggleItems] = useMemo(() => {
    const items: Array<{
      value: string;
      icon: JSX.Element;
      label: string;
      tooltip: string;
    }> = [];

    if (!schemaCheck) {
      return [[]] as const;
    }

    items.push({
      value: 'details',
      icon: <ListBulletIcon className="h-5 w-auto flex-none" />,
      label: 'Details',
      tooltip: 'Details',
    });

    if (schemaCheck.compositeSchemaSDL && schemaCheck.compositeSchemaSDL) {
      items.push({
        value: 'schemaDiff',
        icon: <DiffIcon className="h-5 w-auto flex-none" />,
        label: 'Diff',
        tooltip: 'Schema Diff',
      });
    }

    if (
      schemaCheck.schemaPolicyWarnings ||
      (schemaCheck.__typename === 'FailedSchemaCheck' &&
        schemaCheck.schemaPolicyErrors?.edges?.length)
    ) {
      items.push({
        value: 'policy',
        icon: <AlertTriangleIcon className="h-5 w-auto flex-none" />,
        label: 'Policy',
        tooltip: 'Schema Policy',
      });
    }

    if (schemaCheck.compositeSchemaSDL) {
      items.push({
        value: 'schema',
        icon: <DiffIcon className="h-5 w-auto flex-none" />,
        label: schemaCheck.serviceName ? 'Composite Schema' : 'Schema',
        tooltip: 'Schema',
      });
    }

    if (schemaCheck.supergraphSDL) {
      items.push({
        value: 'supergraph',
        icon: <DiffIcon className="h-5 w-auto flex-none" />,
        label: 'Supergraph',
        tooltip: 'Supergraph',
      });
    }

    return [items] as const;
  }, [schemaCheck]);

  if (!schemaCheck) {
    return (
      <EmptyList
        className="border-0"
        title="Check not found"
        description="Learn how to check your schema with Hive CLI"
        docsUrl="/features/schema-registry#check-a-schema"
      />
    );
  }

  return (
    <div className="flex h-full grow flex-col">
      <div className="py-6">
        <Title>Check {schemaCheck.id}</Title>
        <Subtitle>Detailed view of the schema check</Subtitle>
      </div>
      <div>
        <div className="flex flex-row items-center justify-between gap-x-4 rounded-md border border-gray-800 p-4 font-medium text-gray-400">
          <div>
            <div className="text-xs">Status</div>
            <div className="text-sm font-semibold text-white">
              {schemaCheck.__typename === 'FailedSchemaCheck' ? <>Failed</> : <>Success</>}
            </div>
          </div>
          {schemaCheck.serviceName ? (
            <div className="ml-4">
              <div className="text-xs">Service</div>
              <div>
                <div className="text-sm font-semibold text-white">{schemaCheck.serviceName}</div>
              </div>
            </div>
          ) : null}
          <div>
            <div className="text-xs">
              Triggered <TimeAgo date={schemaCheck.createdAt} />
            </div>
            <div className="truncate text-sm text-white">
              by {schemaCheck.meta ? <>{schemaCheck.meta.author}</> : 'unknown'}
            </div>
          </div>
          <div>
            <div className="text-xs">Commit</div>
            <div>
              <div className="truncate text-sm font-semibold text-white">
                {schemaCheck.meta?.commit ?? 'unknown'}
              </div>
            </div>
          </div>
          {schemaCheck.__typename === 'FailedSchemaCheck' && schemaCheck.canBeApproved ? (
            <div className="ml-auto mr-0 pl-4">
              {schemaCheck.canBeApprovedByViewer ? (
                <Button danger onClick={() => setIsApproveFailedSchemaCheckModalOpen(true)}>
                  Approve
                </Button>
              ) : (
                <Tooltip content={<>Missing permissions. Please contact the organization owner.</>}>
                  <Button disabled>Approve</Button>
                </Tooltip>
              )}
            </div>
          ) : null}
          {schemaCheck.__typename === 'SuccessfulSchemaCheck' && schemaCheck.isApproved ? (
            <div className="ml-4">
              <div className="text-xs">Approved by</div>
              <div>
                <div className="text-sm font-bold text-white">
                  {schemaCheck.approvedBy?.displayName ?? 'unknown'}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="pb-1 pt-6">
        <ToggleGroup.Root
          className="flex space-x-1 rounded-md bg-gray-900/50 text-gray-500"
          type="single"
          defaultValue={view}
          onValueChange={value => value && setView(value)}
          orientation="vertical"
        >
          {toggleItems.map(item => (
            <ToggleGroup.Item
              key={item.value}
              value={item.value}
              className={cn(
                'flex items-center rounded-md px-2 py-[0.4375rem] text-xs font-semibold hover:text-white',
                view === item.value && 'bg-gray-800 text-white',
              )}
              title={item.tooltip}
            >
              {item.icon}
              <span className="ml-2">{item.label}</span>
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
      </div>
      {view === 'details' ? (
        <>
          <div className="my-2">
            {schemaCheck.__typename === 'SuccessfulSchemaCheck' &&
            !schemaCheck.schemaPolicyWarnings?.edges?.length &&
            !schemaCheck.safeSchemaChanges?.nodes?.length &&
            !schemaCheck.breakingSchemaChanges?.nodes?.length &&
            !schemaCheck.schemaPolicyErrors?.edges?.length ? (
              <div className="my-2">
                <Heading>Details</Heading>
                <div className="mt-1">No changes or policy warnings detected.</div>
              </div>
            ) : null}
            {schemaCheck.__typename === 'FailedSchemaCheck' &&
            schemaCheck.compositionErrors?.nodes.length ? (
              <div className="mb-4 space-y-2">
                <Heading className="flex items-center gap-x-2">
                  <Badge color="red" /> Composition Errors
                </Heading>
                <ul>
                  {schemaCheck.compositionErrors.nodes.map((change, index) => (
                    <li key={index}>{change.message}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {schemaCheck.breakingSchemaChanges?.nodes.length ? (
              <div className="mb-2">
                <ChangesBlock
                  criticality={CriticalityLevel.Breaking}
                  changes={schemaCheck.breakingSchemaChanges.nodes}
                />
              </div>
            ) : null}
            {schemaCheck.safeSchemaChanges ? (
              <div className="mb-2">
                <ChangesBlock
                  criticality={CriticalityLevel.Safe}
                  changes={schemaCheck.safeSchemaChanges.nodes}
                />
              </div>
            ) : null}
            {schemaCheck.schemaPolicyErrors?.edges.length ? (
              <div className="mb-2">
                <PolicyBlock
                  title="Schema Policy Errors"
                  policies={schemaCheck.schemaPolicyErrors}
                  type="error"
                />
              </div>
            ) : null}
            {schemaCheck.schemaPolicyWarnings ? (
              <div className="mb-2">
                <PolicyBlock
                  title="Schema Policy Warnings"
                  policies={schemaCheck.schemaPolicyWarnings}
                  type="warning"
                />
              </div>
            ) : null}
          </div>
        </>
      ) : null}
      {view === 'schema' ? (
        <SchemaEditor
          theme="vs-dark"
          options={{
            renderLineHighlightOnlyWhenFocus: true,
            readOnly: true,
            lineNumbers: 'off',
            renderValidationDecorations: 'on',
          }}
          schema={schemaCheck.compositeSchemaSDL ?? ''}
        />
      ) : null}
      {view === 'supergraph' ? (
        <SchemaEditor
          theme="vs-dark"
          options={{
            renderLineHighlightOnlyWhenFocus: true,
            readOnly: true,
            lineNumbers: 'off',
            renderValidationDecorations: 'on',
          }}
          schema={schemaCheck.supergraphSDL ?? ''}
        />
      ) : null}
      {view === 'schemaDiff' ? (
        <DiffEditor
          before={schemaCheck.schemaVersion?.sdl ?? ''}
          after={schemaCheck.compositeSchemaSDL ?? ''}
          title="Schema Diff"
        />
      ) : null}
      {view === 'policy' && schemaCheck.compositeSchemaSDL ? (
        <SchemaPolicyEditor
          compositeSchemaSDL={schemaCheck.schemaSDL ?? ''}
          warnings={schemaCheck.schemaPolicyWarnings ?? null}
          errors={('schemaPolicyErrors' in schemaCheck && schemaCheck.schemaPolicyErrors) || null}
        />
      ) : null}
      <ApproveFailedSchemaCheckModal
        organizationId={router.organizationId}
        projectId={router.projectId}
        targetId={router.targetId}
        schemaCheckId={schemaCheck.id}
        isOpen={isApproveFailedSchemaCheckModalOpen}
        close={() => setIsApproveFailedSchemaCheckModalOpen(false)}
      />
    </div>
  );
};

const SchemaPolicyEditor_PolicyWarningsFragment = graphql(`
  fragment SchemaPolicyEditor_PolicyWarningsFragment on SchemaPolicyWarningConnection {
    edges {
      node {
        message
        start {
          line
          column
        }
        end {
          line
          column
        }
      }
    }
  }
`);

const SchemaPolicyEditor = (props: {
  compositeSchemaSDL: string;
  warnings: FragmentType<typeof SchemaPolicyEditor_PolicyWarningsFragment> | null;
  errors: FragmentType<typeof SchemaPolicyEditor_PolicyWarningsFragment> | null;
}) => {
  const warnings = useFragment(SchemaPolicyEditor_PolicyWarningsFragment, props.warnings);
  const errors = useFragment(SchemaPolicyEditor_PolicyWarningsFragment, props.errors);
  return (
    <SchemaEditor
      theme="vs-dark"
      options={{
        renderLineHighlightOnlyWhenFocus: true,
        readOnly: true,
        lineNumbers: 'off',
        renderValidationDecorations: 'on',
      }}
      onMount={(_, monaco) => {
        monaco.editor.setModelMarkers(monaco.editor.getModels()[0], 'owner', [
          ...(warnings?.edges.map(edge => ({
            message: edge.node.message,
            startLineNumber: edge.node.start.line,
            startColumn: edge.node.start.column,
            endLineNumber: edge.node.end?.line ?? edge.node.start.line,
            endColumn: edge.node.end?.column ?? edge.node.start.column,
            severity: monaco.MarkerSeverity.Warning,
          })) ?? []),
          ...(errors?.edges.map(edge => ({
            message: edge.node.message,
            startLineNumber: edge.node.start.line,
            startColumn: edge.node.start.column,
            endLineNumber: edge.node.end?.line ?? edge.node.start.line,
            endColumn: edge.node.end?.column ?? edge.node.start.column,
            severity: monaco.MarkerSeverity.Error,
          })) ?? []),
        ]);
      }}
      schema={props.compositeSchemaSDL}
    />
  );
};

const ChecksPageQuery = graphql(`
  query ChecksPageQuery(
    $organizationId: ID!
    $projectId: ID!
    $targetId: ID!
    $filters: SchemaChecksFilter
  ) {
    organizations {
      ...TargetLayout_OrganizationConnectionFragment
    }
    organization(selector: { organization: $organizationId }) {
      organization {
        ...TargetLayout_CurrentOrganizationFragment
      }
    }
    project(selector: { organization: $organizationId, project: $projectId }) {
      ...TargetLayout_CurrentProjectFragment
    }
    target(selector: { organization: $organizationId, project: $projectId, target: $targetId }) {
      id
      schemaChecks(first: 1) {
        edges {
          node {
            id
          }
        }
      }
      filteredSchemaChecks: schemaChecks(first: 1, filters: $filters) {
        edges {
          node {
            id
          }
        }
      }
    }
    me {
      ...TargetLayout_MeFragment
    }
    ...TargetLayout_IsCDNEnabledFragment
  }
`);

function ChecksPageContent() {
  const [paginationVariables, setPaginationVariables] = useState<Array<string | null>>(() => [
    null,
  ]);

  const router = useRouteSelector();

  const showOnlyChanged = router.query.filter_changed === 'true';
  const showOnlyFailed = router.query.filter_failed === 'true';

  const [filters, setFilters] = useState<SchemaCheckFilters>({
    showOnlyChanged: showOnlyChanged ?? false,
    showOnlyFailed: showOnlyFailed ?? false,
  });

  const [query] = useQuery({
    query: ChecksPageQuery,
    variables: {
      organizationId: router.organizationId,
      projectId: router.projectId,
      targetId: router.targetId,
      filters: {
        changed: filters.showOnlyChanged ?? false,
        failed: filters.showOnlyFailed ?? false,
      },
    },
  });

  if (query.error) {
    return <QueryError error={query.error} />;
  }

  const me = query.data?.me;
  const currentOrganization = query.data?.organization?.organization;
  const currentProject = query.data?.project;
  const organizationConnection = query.data?.organizations;
  const isCDNEnabled = query.data;
  const { schemaCheckId } = router;
  const hasSchemaChecks = !!query.data?.target?.schemaChecks?.edges?.length;
  const hasFilteredSchemaChecks = !!query.data?.target?.filteredSchemaChecks?.edges?.length;
  const hasActiveSchemaCheck = !!schemaCheckId;

  const handleShowOnlyFilterChange = () => {
    const updatedFilters = !filters.showOnlyChanged;

    void router.push({
      query: {
        ...router.query,
        filter_changed: updatedFilters,
      },
    });
    setFilters(filters => ({
      ...filters,
      showOnlyChanged: !filters.showOnlyChanged,
    }));
  };

  const handleShowOnlyFilterFailed = () => {
    const updatedFilters = !filters.showOnlyFailed;

    void router.push({
      query: {
        ...router.query,
        filter_failed: updatedFilters,
      },
    });

    setFilters(filters => ({
      ...filters,
      showOnlyFailed: !filters.showOnlyFailed,
    }));
  };

  return (
    <>
      <TargetLayout
        page={Page.Checks}
        className="h-full"
        currentOrganization={currentOrganization ?? null}
        currentProject={currentProject ?? null}
        me={me ?? null}
        organizations={organizationConnection ?? null}
        isCDNEnabled={isCDNEnabled ?? null}
      >
        <div
          className={cn(
            'flex h-full w-full',
            hasSchemaChecks || hasActiveSchemaCheck ? 'flex-row gap-x-6' : '',
          )}
        >
          <div>
            <div className="py-6">
              <Title>Schema Checks</Title>
              <Subtitle>Recently checked schemas.</Subtitle>
            </div>
            {query.fetching || query.stale ? null : hasSchemaChecks ? (
              <div className="flex flex-col gap-5">
                <div>
                  <div className="flex h-9 flex-row items-center justify-between">
                    <Label
                      htmlFor="filter-toggle-has-changes"
                      className="text-sm font-normal text-gray-100"
                    >
                      Show only changed schemas
                    </Label>
                    <Switch
                      checked={filters.showOnlyChanged ?? false}
                      onCheckedChange={handleShowOnlyFilterChange}
                      id="filter-toggle-has-changes"
                    />
                  </div>
                  <div className="flex h-9 flex-row items-center justify-between">
                    <Label
                      htmlFor="filter-toggle-status-failed"
                      className="text-sm font-normal text-gray-100"
                    >
                      Show only failed checks
                    </Label>
                    <Switch
                      checked={filters.showOnlyFailed ?? false}
                      onCheckedChange={handleShowOnlyFilterFailed}
                      id="filter-toggle-status-failed"
                    />
                  </div>
                </div>
                {hasFilteredSchemaChecks ? (
                  <div className="flex w-[300px] grow flex-col gap-2.5 overflow-y-auto rounded-md border border-gray-800/50 p-2.5">
                    {paginationVariables.map((cursor, index) => (
                      <Navigation
                        after={cursor}
                        isLastPage={index + 1 === paginationVariables.length}
                        onLoadMore={cursor =>
                          setPaginationVariables(cursors => [...cursors, cursor])
                        }
                        key={cursor ?? 'first'}
                        filters={filters}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="cursor-default text-sm">
                    No schema checks found with the current filters
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="cursor-default text-sm">
                  {hasActiveSchemaCheck ? 'List is empty' : 'Your schema check list is empty'}
                </div>
                <DocsLink href="/features/schema-registry#check-a-schema">
                  {hasActiveSchemaCheck
                    ? 'Check you first schema'
                    : 'Learn how to check your first schema with Hive CLI'}
                </DocsLink>
              </div>
            )}
          </div>
          {hasActiveSchemaCheck ? (
            <div className="grow">
              {schemaCheckId ? (
                <ActiveSchemaCheck schemaCheckId={schemaCheckId} key={schemaCheckId} />
              ) : null}
            </div>
          ) : hasSchemaChecks ? (
            <EmptyList
              className="border-0 pt-6"
              title="Select a schema check"
              description="A list of your schema checks is available on the left."
            />
          ) : null}
        </div>
      </TargetLayout>
    </>
  );
}

function ChecksPage() {
  return (
    <>
      <MetaTitle title="Schema Checks" />
      <ChecksPageContent />
    </>
  );
}

export const getServerSideProps = withSessionProtection();

export default authenticated(ChecksPage);
