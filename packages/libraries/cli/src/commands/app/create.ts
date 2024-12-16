import { OutputSchema } from 'src/helpers/output-schema';
import { Typebox } from 'src/helpers/typebox/__';
import { Args, Flags } from '@oclif/core';
import Command from '../../base-command';
import { graphql } from '../../gql';
import { AppDeploymentStatus } from '../../gql/graphql';
import { graphqlEndpoint } from '../../helpers/config';

export default class AppCreate extends Command<typeof AppCreate> {
  static SuccessSchema = Typebox.Union([
    OutputSchema.Effect.Skipped.extend({
      data: Typebox.Object({
        // TODO improve type to match GQL Schema enum
        status: Typebox.StringNonEmpty,
      }),
    }),
    OutputSchema.Effect.Executed.extend({
      data: Typebox.Object({
        id: Typebox.StringNonEmpty,
        name: Typebox.StringNonEmpty,
        version: Typebox.StringNonEmpty,
      }),
    }),
  ]);

  static description = 'create an app deployment';
  static flags = {
    'registry.endpoint': Flags.string({
      description: 'registry endpoint',
    }),
    'registry.accessToken': Flags.string({
      description: 'registry access token',
    }),
    name: Flags.string({
      description: 'app name',
      required: true,
    }),
    version: Flags.string({
      description: 'app version',
      required: true,
    }),
  };

  static args = {
    file: Args.string({
      name: 'file',
      required: true,
      description: 'Path to the persisted operations mapping.',
      hidden: false,
    }),
  };

  async run() {
    const { flags, args } = await this.parse(AppCreate);

    const endpoint = this.ensure({
      key: 'registry.endpoint',
      args: flags,
      defaultValue: graphqlEndpoint,
      env: 'HIVE_REGISTRY',
    });
    const accessToken = this.ensure({
      key: 'registry.accessToken',
      args: flags,
      env: 'HIVE_TOKEN',
    });

    const file: string = args.file;
    const fs = await import('fs/promises');
    const contents = await fs.readFile(file, 'utf-8');
    // TODO: better error message if parsing fails :)
    const operations = Typebox.Value.ParseJson(ManifestModel, contents);

    const result = await this.registryApi(endpoint, accessToken).request({
      operation: CreateAppDeploymentMutation,
      variables: {
        input: {
          appName: flags['name'],
          appVersion: flags['version'],
        },
      },
    });

    if (result.createAppDeployment.error) {
      // TODO: better error message formatting :)
      throw new Error(result.createAppDeployment.error.message);
    }

    if (!result.createAppDeployment.ok) {
      throw new Error('Unknown error');
    }

    if (result.createAppDeployment.ok.createdAppDeployment.status !== AppDeploymentStatus.Pending) {
      const message = `App deployment "${flags['name']}@${flags['version']}" is "${result.createAppDeployment.ok.createdAppDeployment.status}". Skip uploading documents...`;
      this.log(message);
      return this.successData({
        message,
        effect: 'skipped',
        data: {
          status: result.createAppDeployment.ok.createdAppDeployment.status,
        },
      });
    }

    let buffer: Array<{ hash: string; body: string }> = [];

    const flush = async (force = false) => {
      if (buffer.length >= 100 || force) {
        const result = await this.registryApi(endpoint, accessToken).request({
          operation: AddDocumentsToAppDeploymentMutation,
          variables: {
            input: {
              appName: flags['name'],
              appVersion: flags['version'],
              documents: buffer,
            },
          },
        });

        if (result.addDocumentsToAppDeployment.error) {
          if (result.addDocumentsToAppDeployment.error.details) {
            const affectedOperation = buffer.at(
              result.addDocumentsToAppDeployment.error.details.index,
            );

            const maxCharacters = 40;

            if (affectedOperation) {
              const truncatedBody = (
                affectedOperation.body.length > maxCharacters - 3
                  ? affectedOperation.body.substring(0, maxCharacters) + '...'
                  : affectedOperation.body
              ).replace(/\n/g, '\\n');
              this.logWarning(
                `Failed uploading document: ${result.addDocumentsToAppDeployment.error.details.message}` +
                  `\nOperation hash: ${affectedOperation?.hash}` +
                  `\nOperation body: ${truncatedBody}`,
              );
            }
          }
          this.error(result.addDocumentsToAppDeployment.error.message);
        }
        buffer = [];
      }
    };

    let counter = 0;

    for (const [hash, body] of Object.entries(operations)) {
      buffer.push({ hash, body });
      await flush();
      counter++;
    }

    await flush(true);

    const message = `App deployment "${flags['name']}@${flags['version']}" (${counter} operations) created.\nActivate it with the "hive app:publish" command.`;
    this.log(message);
    return this.successData({
      message,
      effect: 'executed',
      data: {
        id: result.createAppDeployment.ok.createdAppDeployment.id,
        name: flags['name'],
        version: flags['version'],
      },
    });
  }
}

const ManifestModel = Typebox.Record(Typebox.String(), Typebox.String());

const CreateAppDeploymentMutation = graphql(/* GraphQL */ `
  mutation CreateAppDeployment($input: CreateAppDeploymentInput!) {
    createAppDeployment(input: $input) {
      ok {
        createdAppDeployment {
          id
          name
          version
          status
        }
      }
      error {
        message
      }
    }
  }
`);

const AddDocumentsToAppDeploymentMutation = graphql(/* GraphQL */ `
  mutation AddDocumentsToAppDeployment($input: AddDocumentsToAppDeploymentInput!) {
    addDocumentsToAppDeployment(input: $input) {
      ok {
        appDeployment {
          id
          name
          version
          status
        }
      }
      error {
        message
        details {
          index
          message
          __typename
        }
      }
    }
  }
`);
