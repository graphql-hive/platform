import colors from 'colors';
import { Flags } from '@oclif/core';
import Command from '../base-command';
import { graphql } from '../gql';
import { graphqlEndpoint } from '../helpers/config';
import { casesExhausted } from '../helpers/general';
import { Typebox } from '../helpers/typebox/__';
import { SchemaOutput } from '../schema-output/__';

const myTokenInfoQuery = graphql(/* GraphQL */ `
  query myTokenInfo {
    tokenInfo {
      __typename
      ... on TokenInfo {
        token {
          name
        }
        organization {
          slug
        }
        project {
          type
          slug
        }
        target {
          slug
        }
        canPublishSchema: hasTargetScope(scope: REGISTRY_WRITE)
        canCheckSchema: hasTargetScope(scope: REGISTRY_READ)
      }
      ... on TokenNotFoundError {
        message
      }
    }
  }
`);

export default class WhoAmI extends Command<typeof WhoAmI> {
  static description = 'shows information about the current token';
  static flags = {
    'registry.endpoint': Flags.string({
      description: 'registry endpoint',
    }),
    /** @deprecated */
    registry: Flags.string({
      description: 'registry address',
      deprecated: {
        message: 'use --registry.endpoint instead',
        version: '0.21.0',
      },
    }),
    'registry.accessToken': Flags.string({
      description: 'registry access token',
    }),
    /** @deprecated */
    token: Flags.string({
      description: 'api token',
      deprecated: {
        message: 'use --registry.accessToken instead',
        version: '0.21.0',
      },
    }),
  };
  static output = SchemaOutput.output(
    SchemaOutput.success({
      __typename: Typebox.Literal('TokenInfo'),
      token: Typebox.Object({
        name: Typebox.String(),
      }),
      organization: Typebox.Object({
        slug: Typebox.String(),
      }),
      project: Typebox.Object({
        type: Typebox.String(),
        slug: Typebox.String(),
      }),
      target: Typebox.Object({
        slug: Typebox.String(),
      }),
      authorization: Typebox.Object({
        schema: Typebox.Object({
          publish: Typebox.Boolean(),
          check: Typebox.Boolean(),
        }),
      }),
    }),
    SchemaOutput.failure({
      __typename: Typebox.Literal('TokenNotFoundError'),
      message: Typebox.String(),
    }),
  );

  async runResult() {
    const { flags } = await this.parse(WhoAmI);

    const registry = this.ensure({
      key: 'registry.endpoint',
      legacyFlagName: 'registry',
      args: flags,
      defaultValue: graphqlEndpoint,
      env: 'HIVE_REGISTRY',
    });
    const token = this.ensure({
      key: 'registry.accessToken',
      legacyFlagName: 'token',
      args: flags,
      env: 'HIVE_TOKEN',
    });

    const result = await this.registryApi(registry, token)
      .request({
        operation: myTokenInfoQuery,
      })
      .then(_ => _.tokenInfo);

    if (result.__typename === 'TokenInfo') {
      const { organization, project, target } = result;

      const organizationUrl = `https://app.graphql-hive.com/${organization.slug}`;
      const projectUrl = `${organizationUrl}/${project.slug}`;
      const targetUrl = `${projectUrl}/${target.slug}`;

      const access = {
        yes: colors.green('Yes'),
        not: colors.red('No access'),
      };

      const print = createPrinter({
        'Token name:': [colors.bold(result.token.name)],
        ' ': [''],
        'Organization:': [colors.bold(organization.slug), colors.dim(organizationUrl)],
        'Project:': [colors.bold(project.slug), colors.dim(projectUrl)],
        'Target:': [colors.bold(target.slug), colors.dim(targetUrl)],
        '  ': [''],
        'Access to schema:publish': [result.canPublishSchema ? access.yes : access.not],
        'Access to schema:check': [result.canCheckSchema ? access.yes : access.not],
      });

      this.log(print());

      return this.success({
        __typename: 'TokenInfo',
        token: {
          name: result.token.name,
        },
        organization: {
          slug: organization.slug,
        },
        project: {
          type: project.type,
          slug: project.slug,
        },
        target: {
          slug: target.slug,
        },
        authorization: {
          schema: {
            publish: result.canPublishSchema,
            check: result.canCheckSchema,
          },
        },
      });
    }

    if (result.__typename === 'TokenNotFoundError') {
      return this.failureEnvelope({
        suggestions: [`How to create a token? https://docs.graphql-hive.com/features/tokens`],
        exitCode: 0,
        data: {
          __typename: 'TokenNotFoundError',
          message: result.message,
        },
      });
    }

    throw casesExhausted(result);
  }
}

function createPrinter(records: { [label: string]: [value: string, extra?: string] }) {
  const labels = Object.keys(records);
  const values = Object.values(records).map(v => v[0]);
  const maxLabelsLen = Math.max(...labels.map(v => v.length)) + 4;
  const maxValuesLen = Math.max(...values.map(v => v.length)) + 4;

  return () => {
    const lines: string[] = [];

    for (const label in records) {
      const [value, extra] = records[label];

      lines.push(label.padEnd(maxLabelsLen, ' ') + value.padEnd(maxValuesLen, ' ') + (extra || ''));
    }

    return lines.join('\n');
  };
}
