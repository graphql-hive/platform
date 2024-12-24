import { buildSchema, GraphQLError, Source } from 'graphql';
import { InvalidDocument, validate } from '@graphql-inspector/core';
import { Args, Flags, ux } from '@oclif/core';
import Command from '../../base-command';
import { graphql } from '../../gql';
import { graphqlEndpoint } from '../../helpers/config';
import { loadOperations } from '../../helpers/operations';
import { Tex } from '../../helpers/tex/__';
import { T } from '../../helpers/typebox/__';
import { Output } from '../../output/__';

const fetchLatestVersionQuery = graphql(/* GraphQL */ `
  query fetchLatestVersion {
    latestValidVersion {
      sdl
    }
  }
`);

export default class OperationsCheck extends Command<typeof OperationsCheck> {
  static description = 'checks operations against a published schema';
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
  static args = {
    file: Args.string({
      name: 'file',
      required: true,
      description: 'Glob pattern to find the operations',
      hidden: false,
    }),
  };
  static output = [
    Output.failure('FailureOperationsCheckNoSchemaFound', { data: {} }),
    Output.success('SuccessOperationsCheckNoOperationsFound', { data: {} }),
    Output.success('SuccessOperationsCheck', {
      data: {
        countTotal: T.Integer({ minimum: 0 }),
        countInvalid: T.Integer({ minimum: 0 }),
        countValid: T.Integer({ minimum: 0 }),
        invalidOperations: T.Array(
          T.Object({
            source: T.Object({
              name: T.String(),
            }),
            errors: T.Array(
              T.Object({
                message: T.String(),
                locations: T.Array(
                  T.Object({
                    line: T.Integer({ minimum: 0 }),
                    column: T.Integer({ minimum: 0 }),
                  }),
                ),
              }),
            ),
          }),
        ),
      },
      text(_, data, s) {
        if (data.invalidOperations.length === 0) {
          s.success(`All operations are valid (${data.countTotal})`);
        }
      },
    }),
  ];

  async runResult() {
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
      const message = 'No operations found';
      this.logInfo(message);
      return this.success({
        type: 'SuccessOperationsCheckNoOperationsFound',
      });
    }

    const result = await this.registryApi(endpoint, accessToken)
      .request({
        operation: fetchLatestVersionQuery,
      })
      .then(_ => _.latestValidVersion);

    const sdl = result?.sdl;

    if (!sdl) {
      this.logFailure('Could not find a published schema.');
      return this.failureEnvelope({
        suggestions: ['Publish a valid schema first.'],
        data: {
          type: 'FailureOperationsCheckNoSchemaFound',
        },
      });
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

    // todo migrate text output to data type text formatter.
    // We just need a migration away from the anyways-deprecated ux.styledHeader function.
    if (operationsWithErrors.length) {
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
      type: 'SuccessOperationsCheck',
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
    });
  }

  private printInvalidDocuments(invalidDocuments: InvalidDocument[]): void {
    invalidDocuments.forEach(doc => {
      this.renderErrors(doc.source.name, doc.errors);
    });
  }

  private renderErrors(sourceName: string, errors: GraphQLError[]) {
    this.logFailure(sourceName);
    errors.forEach(e => {
      this.log(` - ${Tex.bolderize(e.message)}`);
    });
    this.log('');
  }
}
