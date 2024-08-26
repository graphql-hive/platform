import { graphql } from 'testkit/gql';
import { execute } from '../../../testkit/graphql';
import { initSeed } from '../../../testkit/seed';

describe('Audit Logs Creation', () => {
  describe('Organization', () => {
    const query = graphql(`
      query MyQuery($selector: OrganizationSelectorInput!) {
        auditLogs(selector: $selector) {
          nodes {
            eventTime
            id
            __typename
          }
        }
      }
    `);
    test.concurrent(
      'Should be only one audit log for organization creation',
      async ({ expect }) => {
        const { ownerToken, createOrg } = await initSeed().createOwner();
        const { organization } = await createOrg();

        const result = await execute({
          document: query,
          variables: {
            selector: {
              organization: organization.id,
            },
          },
          authToken: ownerToken,
        });
        expect(result.rawBody.data?.auditLogs.nodes).not.toBeNull();
        expect(result.rawBody.data?.auditLogs.nodes.length).toBeGreaterThan(0);
        expect(result.rawBody.data?.auditLogs.nodes[0].__typename).toBe(
          'OrganizationCreatedAuditLog',
        );
      },
    );
  });
});
