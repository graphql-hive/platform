import { Args, Errors, Flags } from '@oclif/core';
import Command from '../../base-command';
import { Fragments } from '../../fragments/__';
import { graphql } from '../../gql';
import { graphqlEndpoint } from '../../helpers/config';
import { casesExhausted } from '../../helpers/general';
import { gitInfo } from '../../helpers/git';
import { loadSchema, minifySchema } from '../../helpers/schema';
import { Tex } from '../../helpers/tex/__';
import { tb } from '../../helpers/typebox/__';
import { Output } from '../../output/__';

const schemaCheckMutation = graphql(/* GraphQL */ `
  mutation schemaCheck($input: SchemaCheckInput!, $usesGitHubApp: Boolean!) {
    schemaCheck(input: $input) {
      __typename
      ... on SchemaCheckSuccess @skip(if: $usesGitHubApp) {
        valid
        initial
        warnings {
          nodes {
            message
            source
            line
            column
          }
          total
        }
        changes {
          nodes {
            message(withSafeBasedOnUsageNote: false)
            criticality
            isSafeBasedOnUsage
            approval {
              approvedBy {
                id
                displayName
              }
            }
          }
          total
          ...RenderChanges_schemaChanges
        }
        schemaCheck {
          webUrl
        }
      }
      ... on SchemaCheckError @skip(if: $usesGitHubApp) {
        valid
        changes {
          nodes {
            message(withSafeBasedOnUsageNote: false)
            criticality
            isSafeBasedOnUsage
          }
          total
          ...RenderChanges_schemaChanges
        }
        warnings {
          nodes {
            message
            source
            line
            column
          }
          total
        }
        errors {
          nodes {
            message
          }
          total
        }
        schemaCheck {
          webUrl
        }
      }
      ... on GitHubSchemaCheckSuccess @include(if: $usesGitHubApp) {
        message
      }
      ... on GitHubSchemaCheckError @include(if: $usesGitHubApp) {
        message
      }
    }
  }
`);

export default class SchemaCheck extends Command<typeof SchemaCheck> {
  static description = 'checks schema';
  static flags = {
    service: Flags.string({
      description: 'service name (only for distributed schemas)',
    }),
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
    forceSafe: Flags.boolean({
      description: 'mark the check as safe, breaking changes are expected',
    }),
    github: Flags.boolean({
      description: 'Connect with GitHub Application',
      default: false,
    }),
    require: Flags.string({
      description:
        'Loads specific require.extensions before running the codegen and reading the configuration',
      default: [],
      multiple: true,
    }),
    author: Flags.string({
      description: 'Author of the change',
    }),
    commit: Flags.string({
      description: 'Associated commit sha',
    }),
    contextId: Flags.string({
      description: 'Context ID for grouping the schema check.',
    }),
  };
  static args = {
    file: Args.string({
      name: 'file',
      required: true,
      description: 'Path to the schema file(s)',
      hidden: false,
    }),
  };
  static output = [
    Output.success('SuccessSchemaCheck', {
      data: {
        changes: tb.Array(Output.SchemaChange),
        warnings: tb.Array(Output.SchemaWarning),
        url: tb.Nullable(tb.String({ format: 'uri' })),
      },
    }),
    Output.success('SuccessSchemaCheckGitHub', {
      data: {
        message: tb.String(),
      },
      text: (_, output) => {
        return Tex.success(output.message);
      },
    }),
    Output.success('FailureSchemaCheck', {
      data: {
        changes: tb.Array(Output.SchemaChange),
        warnings: tb.Array(Output.SchemaWarning),
        url: tb.Nullable(tb.String({ format: 'uri' })),
      },
    }),

    Output.failure('FailureSchemaCheckGitHub', {
      data: {
        message: tb.String(),
      },
      text: (_, data) => {
        return Tex.failure(data.message);
      },
    }),
  ];

  async runResult() {
    const { flags, args } = await this.parse(SchemaCheck);

    await this.require(flags);

    const service = flags.service;
    const forceSafe = flags.forceSafe;
    const usesGitHubApp = flags.github === true;
    const endpoint = this.ensure({
      key: 'registry.endpoint',
      args: flags,
      legacyFlagName: 'registry',
      defaultValue: graphqlEndpoint,
      env: 'HIVE_REGISTRY',
    });
    const file = args.file;
    const accessToken = this.ensure({
      key: 'registry.accessToken',
      args: flags,
      legacyFlagName: 'token',
      env: 'HIVE_TOKEN',
    });
    const sdl = await loadSchema(file);
    const git = await gitInfo(() => {
      // noop
    });

    const commit = flags.commit || git?.commit;
    const author = flags.author || git?.author;

    if (typeof sdl !== 'string' || sdl.length === 0) {
      throw new Errors.CLIError('Schema seems empty');
    }

    let github: null | {
      commit: string;
      repository: string | null;
      pullRequestNumber: string | null;
    } = null;

    if (usesGitHubApp) {
      if (!commit) {
        throw new Errors.CLIError(`Couldn't resolve commit sha required for GitHub Application`);
      }
      if (!git.repository) {
        throw new Errors.CLIError(
          `Couldn't resolve git repository required for GitHub Application`,
        );
      }
      if (!git.pullRequestNumber) {
        this.warn(
          "Could not resolve pull request number. Are you running this command on a 'pull_request' event?\n" +
            'See https://the-guild.dev/graphql/hive/docs/other-integrations/ci-cd#github-workflow-for-ci',
        );
      }

      github = {
        commit: commit,
        repository: git.repository,
        pullRequestNumber: git.pullRequestNumber,
      };
    }

    const result = await this.registryApi(endpoint, accessToken)
      .request({
        operation: schemaCheckMutation,
        variables: {
          input: {
            service,
            sdl: minifySchema(sdl),
            github,
            meta:
              !!commit && !!author
                ? {
                    commit,
                    author,
                  }
                : null,
            contextId: flags.contextId ?? undefined,
          },
          usesGitHubApp,
        },
      })
      .then(_ => _.schemaCheck);

    if (result.__typename === 'SchemaCheckSuccess') {
      const changes = result.changes;
      if (result.initial) {
        this.logSuccess('Schema registry is empty, nothing to compare your schema with.');
      } else if (!changes?.total) {
        this.logSuccess('No changes');
      } else {
        Fragments.SchemaChangeConnection.log.call(this, changes);
        this.log('');
      }

      const warnings = result.warnings;
      if (warnings?.total) {
        Fragments.SchemaWarningConnection.log.call(this, warnings);
        this.log('');
      }

      if (result.schemaCheck?.webUrl) {
        this.log(`View full report:\n${result.schemaCheck.webUrl}`);
      }

      return this.success({
        type: 'SuccessSchemaCheck',
        //   breakingChanges: false,
        warnings: Fragments.SchemaWarningConnection.toSchemaOutput(result.warnings),
        changes: Fragments.SchemaChangeConnection.toSchemaOutput(result.changes),
        url: result.schemaCheck?.webUrl ?? null,
      });
    }

    if (result.__typename === 'SchemaCheckError') {
      Fragments.SchemaErrorConnection.log.call(this, result.errors);

      if (result?.warnings?.total) {
        Fragments.SchemaWarningConnection.log.call(this, result.warnings);
        this.log('');
      }

      if (result?.changes?.total) {
        this.log('');
        Fragments.SchemaChangeConnection.log.call(this, result.changes);
      }

      if (result.schemaCheck?.webUrl) {
        this.log('');
        this.log(`View full report:\n${result.schemaCheck.webUrl}`);
      }

      this.log('');

      if (forceSafe) {
        this.logSuccess('Breaking changes were expected (forced)');
      } else {
        process.exitCode = 1;
      }

      return this.success({
        type: 'FailureSchemaCheck',
        warnings: Fragments.SchemaWarningConnection.toSchemaOutput(result.warnings),
        changes: Fragments.SchemaChangeConnection.toSchemaOutput(result.changes),
        url: result.schemaCheck?.webUrl ?? null,
      });
    }

    if (result.__typename === 'GitHubSchemaCheckSuccess') {
      return this.success({
        type: 'SuccessSchemaCheckGitHub',
        message: result.message,
      });
    }

    if (result.__typename === 'GitHubSchemaCheckError') {
      return this.failure({
        type: 'FailureSchemaCheckGitHub',
        message: result.message,
      });
    }

    throw casesExhausted(result);
  }
}
