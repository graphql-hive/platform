import { endOfDay, startOfDay } from 'date-fns';
import { graphql } from 'testkit/gql';
import { ProjectType } from 'testkit/gql/graphql';
import { execute } from 'testkit/graphql';
import { initSeed } from 'testkit/seed';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  endpoint: 'http://127.0.0.1:9000',
  region: 'auto',
  credentials: {
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin',
  },
  forcePathStyle: true,
});

const auditLogArray = graphql(`
  query GetAllAuditLogsArray($selector: OrganizationSelectorInput!) {
    organization(selector: $selector) {
      organization {
        id
        slug
        auditLogs {
          edges {
            node {
              __typename
            }
          }
        }
      }
    }
  }
`);

test.concurrent('Create multiple Audit Log Records for Organization', async ({ expect }) => {
  const { ownerToken, createOrg } = await initSeed().createOwner();
  const { organization, createProject } = await createOrg();
  await createProject(ProjectType.Single);

  const result = await execute({
    document: auditLogArray,
    variables: {
      selector: {
        organizationSlug: organization.slug,
      },
    },
    authToken: ownerToken,
  });

  const auditLogs = result.rawBody.data?.organization?.organization.auditLogs.edges;

  expect(auditLogs?.length).toBe(5);
  expect(auditLogs?.length).not.toBe(0);
  expect(
    auditLogs?.find((log: any) => log.node.__typename === 'OrganizationCreatedAuditLog'),
  ).toBeDefined();
  expect(
    auditLogs?.find((log: any) => log.node.__typename === 'ProjectCreatedAuditLog'),
  ).toBeDefined();
  expect(
    auditLogs?.find((log: any) => log.node.__typename === 'TargetCreatedAuditLog'),
  ).toBeDefined();
});

const GetAuditLogs = graphql(`
  query GetAllAuditLogs($selector: OrganizationSelectorInput!) {
    organization(selector: $selector) {
      organization {
        id
        slug
        auditLogs {
          edges {
            node {
              id
              __typename
              eventTime
            }
          }
        }
      }
    }
  }
`);
test.concurrent('Create Audit Log Record for Organization', async ({ expect }) => {
  const { createOrg, ownerToken } = await initSeed().createOwner();
  const firstOrg = await createOrg();
  const result = await execute({
    document: GetAuditLogs,
    variables: {
      selector: {
        organizationSlug: firstOrg.organization.slug,
      },
    },
    authToken: ownerToken,
  });
  const auditLogs = result.rawBody.data?.organization?.organization.auditLogs.edges;
  expect(auditLogs?.[0].node.__typename === 'OrganizationCreatedAuditLog');
  expect(auditLogs?.[0].node.eventTime).toBeDefined();
});

const ExportAllAuditLogs = graphql(`
  mutation exportAllAuditLogs($selector: OrganizationSelectorInput!, $filter: AuditLogFilter!) {
    exportOrganizationAuditLog(selector: $selector, filter: $filter) {
      ok {
        url
      }
      error {
        message
      }
      __typename
    }
  }
`);

const today = endOfDay(new Date());
const lastYear = startOfDay(new Date(new Date().setFullYear(new Date().getFullYear() - 1)));

test.concurrent(
  'Try to export Audit Logs from an Organization with unauthorized user - should throw error',
  async () => {
    const { createOrg } = await initSeed().createOwner();
    const { createProject, organization } = await createOrg();
    await createProject(ProjectType.Single);
    const secondOrg = await initSeed().createOwner();
    const secondToken = secondOrg.ownerToken;

    await execute({
      document: ExportAllAuditLogs,
      variables: {
        selector: {
          organizationSlug: organization.id,
        },
        filter: {
          startDate: lastYear.toISOString(),
          endDate: today.toISOString(),
        },
      },
      token: secondToken,
    }).then(r => r.expectGraphQLErrors());
  },
);

test.concurrent('Try to export Audit Logs from an Organization with authorized user', async () => {
  const { createOrg, ownerToken } = await initSeed().createOwner();
  const { createProject, organization } = await createOrg();
  await createProject(ProjectType.Single);

  const exportAuditLogs = await execute({
    document: ExportAllAuditLogs,
    variables: {
      selector: {
        organizationSlug: organization.id,
      },
      filter: {
        startDate: lastYear.toISOString(),
        endDate: today.toISOString(),
      },
    },
    token: ownerToken,
  });

  const url = exportAuditLogs.rawBody.data?.exportOrganizationAuditLog.ok?.url;
  const parsedUrl = new URL(String(url));
  const pathParts = parsedUrl.pathname.split('/');
  const bucketName = pathParts[1];
  const key = pathParts.slice(2).join('/');
  const getObjectCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  const result = await s3Client.send(getObjectCommand);
  const bodyStream = await result.Body?.transformToString();
  expect(bodyStream).toBeDefined();

  const rows = bodyStream?.split('\n');
  expect(rows?.length).toBeGreaterThan(1); // At least header and one row
  const header = rows?.[0].split(',');
  const expectedHeader = ['id', 'created_at', 'event_type', 'user_id', 'user_email', 'metadata'];
  expect(header).toEqual(expectedHeader);
  // Sometimes the order of the rows is not guaranteed, so we need to check if the expected rows are present
  expect(rows?.find(row => row.includes('ORGANIZATION_CREATED'))).toBeDefined();
  expect(rows?.find(row => row.includes('PROJECT_CREATED'))).toBeDefined();
  expect(rows?.find(row => row.includes('TARGET_CREATED'))).toBeDefined();
});
