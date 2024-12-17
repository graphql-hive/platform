import { Args, Flags, ux } from '@oclif/core';
import Command from '../../base-command';
import { graphql } from '../../gql';
import { graphqlEndpoint } from '../../helpers/config';
import { casesExhausted } from '../../helpers/general';
import { Envelope } from '../../helpers/output-type';
import { renderErrors } from '../../helpers/schema';
import { Typebox } from '../../helpers/typebox/__';

const schemaDeleteMutation = graphql(/* GraphQL */ `
  mutation schemaDelete($input: SchemaDeleteInput!) {
    schemaDelete(input: $input) {
      __typename
      ... on SchemaDeleteSuccess {
        valid
        changes {
          nodes {
            criticality
            message
          }
          total
        }
        errors {
          nodes {
            message
          }
          total
        }
      }
      ... on SchemaDeleteError {
        valid
        errors {
          nodes {
            message
          }
          total
        }
      }
    }
  }
`);

export default class SchemaDelete extends Command<typeof SchemaDelete> {
  static description = 'deletes a schema';
  static descriptionOfAction = 'delete schema';
  static flags = {
    'registry.endpoint': Flags.string({
      description: 'registry endpoint',
    }),
    /** @deprecated */
    registry: Flags.string({
      description: 'registry address',
      deprecated: {
        message: 'use --registry.accessToken instead',
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
    dryRun: Flags.boolean({
      description: 'Does not delete the service, only reports what it would have done.',
      default: false,
    }),
    confirm: Flags.boolean({
      description: 'Confirm deletion of the service',
      default: false,
    }),
  };

  static args = {
    service: Args.string({
      name: 'service' as const,
      required: true,
      description: 'name of the service',
      hidden: false,
    }),
  };

  static output = Typebox.Union([
    Envelope.Failure({
      errors: Typebox.Array(
        Typebox.Object({
          message: Typebox.String(),
        }),
      ),
    }),
    Envelope.Success({}),
  ]);

  async runResult() {
    const { flags, args } = await this.parse(SchemaDelete);

    const service: string = args.service;

    if (!flags.confirm) {
      const confirmed = await ux.confirm(
        `Are you sure you want to delete "${service}" from the registry? (y/n)`,
      );

      if (!confirmed) {
        this.logInfo('Aborting');
        this.exit(0);
      }
    }

    const endpoint = this.ensure({
      key: 'registry.endpoint',
      args: flags,
      legacyFlagName: 'registry',
      defaultValue: graphqlEndpoint,
      env: 'HIVE_REGISTRY',
    });
    const accessToken = this.ensure({
      key: 'registry.accessToken',
      args: flags,
      legacyFlagName: 'token',
      env: 'HIVE_TOKEN',
    });

    const result = await this.registryApi(endpoint, accessToken).request({
      operation: schemaDeleteMutation,
      variables: {
        input: {
          serviceName: service,
          dryRun: flags.dryRun,
        },
      },
    });

    if (result.schemaDelete.__typename === 'SchemaDeleteSuccess') {
      const message = `${service} deleted`;
      this.logSuccess(message);
      return this.success({
        message,
        data: {},
      });
    }

    if (result.schemaDelete.__typename === 'SchemaDeleteError') {
      this.logFailure(`Failed to delete ${service}`);
      renderErrors.call(this, result.schemaDelete.errors);
      return this.failure({
        context: {
          errors: result.schemaDelete.errors.nodes.map(e => {
            return {
              message: e.message,
            };
          }),
        },
      });
    }

    throw casesExhausted(result.schemaDelete);
  }
}
