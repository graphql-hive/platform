import { writeFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { buildSchema, GraphQLError, introspectionFromSchema } from 'graphql';
import { Args, Flags } from '@oclif/core';
import Command from '../base-command';
import { loadSchema } from '../helpers/schema';
import { Output } from '../output/__';

export default class Introspect extends Command<typeof Introspect> {
  static description = 'introspects a GraphQL Schema';
  static flags = {
    write: Flags.string({
      aliases: ['W'],
      description: 'Write to a file (possible extensions: .graphql, .gql, .gqls, .graphqls, .json)',
    }),
    header: Flags.string({
      aliases: ['H'],
      description: 'HTTP header to add to the introspection request (in key:value format)',
      multiple: true,
    }),
  };
  static args = {
    location: Args.string({
      name: 'location',
      required: true,
      description: 'GraphQL Schema location (URL or file path/glob)',
      hidden: false,
    }),
  };
  static output = [Output.SuccessOutputFile, Output.SuccessOutputStdout];

  async runResult() {
    const { flags, args } = await this.parse(Introspect);
    const headers = flags.header?.reduce(
      (acc, header) => {
        const [key, ...values] = header.split(':');

        return {
          ...acc,
          [key]: values.join(':'),
        };
      },
      {} as Record<string, string>,
    );

    const schema = await loadSchema(args.location, {
      headers,
      method: 'POST',
    }).catch(err => {
      if (err instanceof GraphQLError) {
        this.logFailure(err.message);
        this.exit(1);
      }

      this.error(err, {
        exit: 1,
      });
    });

    if (!schema) {
      this.logFailure('Unable to load schema');
      this.exit(1);
    }

    if (!flags.write) {
      return this.success({
        type: 'SuccessOutputStdout',
        content: schema,
      });
    }

    const filepath = resolve(process.cwd(), flags.write);
    switch (extname(flags.write.toLowerCase())) {
      case '.graphql':
      case '.gql':
      case '.gqls':
      case '.graphqls':
        writeFileSync(filepath, schema, 'utf8');
        break;
      case '.json': {
        const schemaObject = buildSchema(schema, {
          assumeValidSDL: true,
          assumeValid: true,
        });
        writeFileSync(
          filepath,
          JSON.stringify(introspectionFromSchema(schemaObject), null, 2),
          'utf8',
        );
        break;
      }
      default:
        this.logFailure(`Unsupported file extension ${extname(flags.write)}`);
        this.exit(1);
    }

    this.logSuccess(`Saved to ${filepath}`);
    return this.success({
      type: 'SuccessOutputFile',
      path: filepath,
      bytes: schema.length,
    });
  }
}
