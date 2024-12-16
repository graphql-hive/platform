import { buildSchema, GraphQLError, Source } from 'graphql';
import { Envelope } from 'src/helpers/output-schema';
import { Typebox } from 'src/helpers/typebox/__';
import { InvalidDocument, validate } from '@graphql-inspector/core';
import { Args, Errors, Flags, ux } from '@oclif/core';
import { CommandError } from '@oclif/core/lib/interfaces';
import Command from '../../base-command';
import { graphql } from '../../gql';
import { graphqlEndpoint } from '../../helpers/config';
import { loadOperations } from '../../helpers/operations';

const fetchLatestVersionQuery = graphql(/* GraphQL */ `
  query fetchLatestVersion {
    latestValidVersion {
      sdl
    }
  }
`);

export default class OperationsCheck extends Command<typeof OperationsCheck> {
  static description = 'checks operations against a published schema';
  static descriptionOfAction = 'validate operations';
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
    require: Flags.string({
      description: 'Loads specific require.extensions before running the command',
      default: [],
      multiple: true,
    }),
    graphqlTag: Flags.string({
      description: [
        'Identify template literals containing GraphQL queries in JavaScript/TypeScript code. Supports multiple values.',
        'Examples:',
        '  --graphqlTag graphql-tag (Equivalent to: import gqlTagFunction from "graphql-tag")',
        '  --graphqlTag graphql:react-relay (Equivalent to: import { graphql } from "react-relay")',
      ].join('\n'),
      multiple: true,
    }),
    globalGraphqlTag: Flags.string({
      description: [
        'Allows to use a global identifier instead of a module import. Similar to --graphqlTag.',
        'Examples:',
        '  --globalGraphqlTag gql (Supports: export const meQuery = gql`{ me { id } }`)',
        '  --globalGraphqlTag graphql (Supports: export const meQuery = graphql`{ me { id } }`)',
      ].join('\n'),
      multiple: true,
    }),
    apolloClient: Flags.boolean({
      description: 'Supports Apollo Client specific directives',
      default: false,
    }),
  };
  static SuccessSchema = Envelope.Generic({
    countTotal: Typebox.Integer({ minimum: 0 }),
    countInvalid: Typebox.Integer({ minimum: 0 }),
    countValid: Typebox.Integer({ minimum: 0 }),
    invalidOperations: Typebox.Array(
      Typebox.Object({
        source: Typebox.Object({
          name: Typebox.String(),
        }),
        errors: Typebox.Array(
          Typebox.Object({
            message: Typebox.String(),
            locations: Typebox.Array(
              Typebox.Object({
                line: Typebox.Integer({ minimum: 0 }),
                column: Typebox.Integer({ minimum: 0 }),
              }),
            ),
          }),
        ),
      }),
    ),
  });
  static args = {
    file: Args.string({
      name: 'file',
      required: true,
      description: 'Glob pattern to find the operations',
      hidden: false,
    }),
  };

  async run() {
    const { flags, args } = await this.parse(OperationsCheck);

    await this.require(flags);

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
    const graphqlTag = flags.graphqlTag;
    const globalGraphqlTag = flags.globalGraphqlTag;

    const file: string = args.file;

    const operations = await loadOperations(file, {
      normalize: false,
      pluckModules: graphqlTag?.map(tag => {
        const [name, identifier] = tag.split(':');
        return {
          name,
          identifier,
        };
      }),
      pluckGlobalGqlIdentifierName: globalGraphqlTag,
    });

    if (operations.length === 0) {
      this.logInfo('No operations found');
      return this.success({
        data: {
          countTotal: 0,
          countInvalid: 0,
          countValid: 0,
          invalidOperations: [],
        },
      });
    }

    const result = await this.registryApi(endpoint, accessToken).request({
      operation: fetchLatestVersionQuery,
    });

    const sdl = result.latestValidVersion?.sdl;

    if (!sdl) {
      this.error('Could not find a published schema. Please publish a valid schema first.');
    }

    const schema = buildSchema(sdl, {
      assumeValidSDL: true,
      assumeValid: true,
    });

    if (!flags.apolloClient) {
      const detectedApolloDirectives = operations.some(
        s => s.content.includes('@client') || s.content.includes('@connection'),
      );

      if (detectedApolloDirectives) {
        // TODO: Gather warnings into a "warnings" array property in our envelope.
        this.warn(
          'Apollo Client specific directives detected (@client, @connection). Please use the --apolloClient flag to enable support.',
        );
      }
    }

    const invalidOperations = validate(
      schema,
      operations.map(s => new Source(s.content, s.location)),
      {
        apollo: flags.apolloClient === true,
      },
    );

    const operationsWithErrors = invalidOperations.filter(o => o.errors.length > 0);

    if (operationsWithErrors.length === 0) {
      this.logSuccess(`All operations are valid (${operations.length})`);
    } else {
      ux.styledHeader('Summary');
      this.log(
        [
          `Total: ${operations.length}`,
          `Invalid: ${operationsWithErrors.length} (${Math.floor(
            (operationsWithErrors.length / operations.length) * 100,
          )}%)`,
          '',
        ].join('\n'),
      );

      ux.styledHeader('Details');

      this.printInvalidDocuments(operationsWithErrors);
      process.exitCode = 1;
    }

    return this.success({
      data: {
        countTotal: operations.length,
        countInvalid: operationsWithErrors.length,
        countValid: operations.length - operationsWithErrors.length,
        invalidOperations: operationsWithErrors.map(o => {
          return {
            source: {
              name: o.source.name,
            },
            errors: o.errors.map(e => {
              return {
                message: e.message,
                locations:
                  e.locations?.map(l => {
                    return {
                      line: l.line,
                      column: l.column,
                    };
                  }) ?? [],
              };
            }),
          };
        }),
      },
    });
  }

  private printInvalidDocuments(invalidDocuments: InvalidDocument[]): void {
    invalidDocuments.forEach(doc => {
      this.renderErrors(doc.source.name, doc.errors);
    });
  }

  private renderErrors(sourceName: string, errors: GraphQLError[]) {
    this.logFail(sourceName);
    errors.forEach(e => {
      this.log(` - ${this.bolderize(e.message)}`);
    });
    this.log('');
  }
}
