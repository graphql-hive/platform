import { SchemaWarningConnection } from 'src/gql/graphql';
import { casesExhausted } from 'src/helpers/general';
import { Envelope } from 'src/helpers/output-schema';
import { Typebox } from 'src/helpers/typebox/__';
import { Args, Errors, Flags } from '@oclif/core';
import Command from '../../base-command';
import { graphql, useFragment } from '../../gql';
import { graphqlEndpoint } from '../../helpers/config';
import { gitInfo } from '../../helpers/git';
import {
  loadSchema,
  MaskedChanges,
  minifySchema,
  renderChanges,
  RenderChanges_SchemaChanges,
  renderErrors,
  renderWarnings,
} from '../../helpers/schema';

const CriticalityLevel = Typebox.Enum({
  Breaking: 'Breaking',
  Dangerous: 'Dangerous',
  Safe: 'Safe',
});

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

const Change = Typebox.Object({
  message: Typebox.String(),
  criticality: CriticalityLevel,
  isSafeBasedOnUsage: Typebox.Boolean(),
  approval: Typebox.Nullable(
    Typebox.Object({
      by: Typebox.Nullable(
        Typebox.Object({
          // id: z.string().nullable(),
          displayName: Typebox.String().nullable(),
        }),
      ),
    }),
  ),
});
type Change = Typebox.Static<typeof Change>;

const Warning = Typebox.Object({
  message: Typebox.String(),
  source: Typebox.Nullable(Typebox.String()),
  line: Typebox.Nullable(Typebox.Number()),
  column: Typebox.Nullable(Typebox.Number()),
});
type Warning = Typebox.Static<typeof Warning>;

export default class SchemaCheck extends Command<typeof SchemaCheck> {
  static description = 'checks schema';
  static descriptionOfAction = 'check schema';
  static SuccessSchema = Typebox.Union([
    Envelope.Generic({
      checkType: Typebox.Literal('registry'),
      url: Typebox.Nullable(Typebox.String({ format: 'uri-template' })),
      breakingChanges: Typebox.Boolean(),
      changes: Typebox.Array(Change),
      warnings: Typebox.Array(Warning),
    }),
    Envelope.Generic({
      checkType: Typebox.Literal('github'),
      message: Typebox.String(),
    }),
  ]);

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

  async run() {
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

    const result = await this.registryApi(endpoint, accessToken).request({
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
    });

    if (result.schemaCheck.__typename === 'SchemaCheckSuccess') {
      const changes = result.schemaCheck.changes;
      if (result.schemaCheck.initial) {
        this.logSuccess('Schema registry is empty, nothing to compare your schema with.');
      } else if (!changes?.total) {
        this.logSuccess('No changes');
      } else {
        renderChanges.call(this, changes);
        this.log('');
      }

      const warnings = result.schemaCheck.warnings;
      if (warnings?.total) {
        renderWarnings.call(this, warnings);
        this.log('');
      }

      if (result.schemaCheck.schemaCheck?.webUrl) {
        this.log(`View full report:\n${result.schemaCheck.schemaCheck.webUrl}`);
      }

      return this.successData({
        data: {
          checkType: 'registry',
          breakingChanges: false,
          warnings: toWaring(result.schemaCheck.warnings),
          changes: toChange(result.schemaCheck.changes),
          url: result.schemaCheck?.schemaCheck?.webUrl ?? null,
        },
      });
    }

    if (result.schemaCheck.__typename === 'SchemaCheckError') {
      const changes = result.schemaCheck.changes;
      const errors = result.schemaCheck.errors;
      const warnings = result.schemaCheck.warnings;
      renderErrors.call(this, errors);

      if (warnings?.total) {
        renderWarnings.call(this, warnings);
        this.log('');
      }

      if (changes && changes.total) {
        this.log('');
        renderChanges.call(this, changes);
      }

      if (result.schemaCheck.schemaCheck?.webUrl) {
        this.log('');
        this.log(`View full report:\n${result.schemaCheck.schemaCheck.webUrl}`);
      }

      this.log('');

      if (forceSafe) {
        this.logSuccess('Breaking changes were expected (forced)');
      } else {
        process.exitCode = 1;
      }

      return this.successData({
        data: {
          checkType: 'registry',
          breakingChanges: true,
          warnings: toWaring(result.schemaCheck.warnings),
          changes: toChange(result.schemaCheck.changes),
          url: result.schemaCheck?.schemaCheck?.webUrl ?? null,
        },
      });
    }

    if (result.schemaCheck.__typename === 'GitHubSchemaCheckSuccess') {
      this.logSuccess(result.schemaCheck.message);
      return this.successData({
        data: {
          checkType: 'github',
          message: result.schemaCheck.message,
        },
      });
    }

    if (result.schemaCheck.__typename === 'GitHubSchemaCheckError') {
      this.error(result.schemaCheck.message);
    }

    casesExhausted(result.schemaCheck);
  }
}

const toWaring = (warnings: undefined | null | SchemaWarningConnection): Warning[] => {
  return (
    warnings?.nodes.map(_ => ({
      message: _.message,
      source: _.source ?? null,
      line: _.line ?? null,
      column: _.column ?? null,
    })) ?? []
  );
};

const toChange = (maskedChanges: undefined | null | MaskedChanges): Change[] => {
  const changes = useFragment(RenderChanges_SchemaChanges, maskedChanges);
  return (
    changes?.nodes.map(_ => ({
      message: _.message,
      criticality: _.criticality,
      isSafeBasedOnUsage: _.isSafeBasedOnUsage,
      approval: _.approval
        ? {
            by: _.approval.approvedBy
              ? {
                  // id: _.approval.approvedBy.id,
                  displayName: _.approval.approvedBy.displayName,
                }
              : null,
          }
        : null,
    })) ?? []
  );
};
