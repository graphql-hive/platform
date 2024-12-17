import colors from 'colors';
import { print } from 'graphql';
import type { ExecutionResult } from 'graphql';
import { http } from '@graphql-hive/core';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { Command, Errors, Flags, Interfaces } from '@oclif/core';
import { CommandError } from '@oclif/core/lib/interfaces';
import { Config, GetConfigurationValueType, ValidConfigurationKeys } from './helpers/config';
import { CLIFailure } from './helpers/errors/cli-failure';
import { ClientError } from './helpers/errors/client-error';
import { OmitNever, OptionalizePropertyUnsafe } from './helpers/general';
import { Envelope, OutputType } from './helpers/output-schema';
import { Typebox } from './helpers/typebox/__';

export default abstract class BaseCommand<$Command extends typeof Command> extends Command {
  public static enableJsonFlag = true;

  /**
   * A description of the action that this command performs.
   * Used in certain automated error messages.
   */
  public static descriptionOfAction = 'perform action';

  /**
   * The data type returned by this command when executed.
   *
   * Used by methods: {@link BaseCommand.success}, {@link BaseCommand.failure}, {@link BaseCommand.runResult}.
   */
  public static output: OutputType = Envelope.SuccessBase;

  protected _userConfig: Config | undefined;

  static baseFlags = {
    debug: Flags.boolean({
      default: false,
      summary: 'Whether debug output for HTTP calls and similar should be enabled.',
    }),
  };

  protected flags!: Flags<$Command>;

  protected args!: Args<$Command>;

  /**
   * Prefer implementing {@link BaseCommand.runResult} instead of this method. Refer to it for its benefits.
   *
   * By default this command runs {@link BaseCommand.runResult}, having logic to handle its return value.
   */
  async run(): Promise<void | InferSuccess<$Command>> {
    const resultUnsafe = await this.runResult();
    const schema = (this.constructor as typeof BaseCommand).output as OutputType;
    const result = Typebox.Value.Parse(schema, resultUnsafe);

    if (result.ok) {
      return result as any;
    }

    throw new CLIFailure(result);
  }

  /**
   * A safer alternative to {@link BaseCommand.run}. Benefits:
   *
   * 1. Clearer control-flow: Treats errors as data (meaning you return them).
   * 2. More type-safe 1: Throwing is not tracked by TypeScript, return is.
   * 3. More type-safe 2: You are prevented from forgetting to return JSON data (void return not allowed).
   *
   * Note: You must specify your command's output type in {@link BaseCommand.output} to take advantage of this method.
   */
  async runResult(): Promise<InferSuccess<$Command> | InferFailure<$Command>> {
    throw new Error('Not implemented');
  }

  toErrorJson(value: unknown) {
    if (value instanceof CLIFailure) {
      return value.envelope;
    }
    return super.toErrorJson(value);
  }

  /**
   * Helper function for easy creation of success data (with defaults) that
   * adheres to the type specified by your command's {@link BaseCommand.output}.
   */
  success(envelopeInit: InferSuccessInit<$Command>): InferSuccess<$Command> {
    return {
      ...Envelope.successDefaults,
      ...(envelopeInit as object),
    } as any;
  }

  /**
   * Helper function for easy creation of failure data (with defaults) that
   * adheres to the type specified by your command's {@link BaseCommand.output}.
   */
  failure(envelopeInit: InferFailureInit<$Command>): InferFailure<$Command> {
    return {
      ...Envelope.failureDefaults,
      ...(envelopeInit as object),
    } as any;
  }

  protected get userConfig(): Config {
    if (!this._userConfig) {
      throw new Error('User config is not initialized');
    }
    return this._userConfig!;
  }

  async init(): Promise<void> {
    await super.init();

    this._userConfig = new Config({
      // eslint-disable-next-line no-process-env
      filepath: process.env.HIVE_CONFIG,
      rootDir: process.cwd(),
    });

    const { args, flags } = await this.parse({
      flags: this.ctor.flags,
      baseFlags: (super.ctor as typeof BaseCommand).baseFlags,
      enableJsonFlag: this.ctor.enableJsonFlag,
      args: this.ctor.args,
      strict: this.ctor.strict,
    });
    this.flags = flags as Flags<$Command>;
    this.args = args as Args<$Command>;
  }

  /**
   * {@link Command.log} with success styling.
   */
  logSuccess(...args: any[]) {
    this.log(colors.green('✔'), ...args);
  }

  /**
   * {@link Command.log} with failure styling.
   */
  logFailure(...args: any[]) {
    this.log(colors.red('✖'), ...args);
  }

  /**
   * {@link Command.log} with info styling.
   */
  logInfo(...args: any[]) {
    this.log(colors.yellow('ℹ'), ...args);
  }

  /**
   * {@link Command.log} with warning styling.
   */
  logWarning(...args: any[]) {
    this.log(colors.yellow('⚠'), ...args);
  }

  bolderize(msg: string) {
    const findSingleQuotes = /'([^']+)'/gim;
    const findDoubleQuotes = /"([^"]+)"/gim;

    return msg
      .replace(findSingleQuotes, (_: string, value: string) => colors.bold(value))
      .replace(findDoubleQuotes, (_: string, value: string) => colors.bold(value));
  }

  maybe<TArgs extends Record<string, any>, TKey extends keyof TArgs>({
    key,
    env,
    args,
  }: {
    key: TKey;
    env: string;
    args: TArgs;
  }) {
    if (args[key] != null) {
      return args[key];
    }

    // eslint-disable-next-line no-process-env
    if (env && process.env[env]) {
      // eslint-disable-next-line no-process-env
      return process.env[env];
    }

    return undefined;
  }

  /**
   * Get a value from arguments or flags first, then from env variables,
   * then fallback to config.
   * Throw when there's no value.
   *
   * @param key
   * @param args all arguments or flags
   * @param defaultValue default value
   * @param message custom error message in case of no value
   * @param env an env var name
   */
  ensure<
    TKey extends ValidConfigurationKeys,
    TArgs extends {
      [key in TKey]: GetConfigurationValueType<TKey>;
    },
  >({
    key,
    args,
    legacyFlagName,
    defaultValue,
    message,
    env,
  }: {
    args: TArgs;
    key: TKey;
    /** By default we try to match config names with flag names, but for legacy compatibility we need to provide the old flag name. */
    legacyFlagName?: keyof OmitNever<{
      // Symbol.asyncIterator to discriminate against any lol
      [TArgKey in keyof TArgs]: typeof Symbol.asyncIterator extends TArgs[TArgKey]
        ? never
        : string extends TArgs[TArgKey]
          ? TArgKey
          : never;
    }>;

    defaultValue?: TArgs[keyof TArgs] | null;
    message?: string;
    env?: string;
  }): NonNullable<GetConfigurationValueType<TKey>> | never {
    if (args[key] != null) {
      return args[key] as NonNullable<GetConfigurationValueType<TKey>>;
    }

    if (legacyFlagName && (args as any)[legacyFlagName] != null) {
      return args[legacyFlagName] as any as NonNullable<GetConfigurationValueType<TKey>>;
    }

    // eslint-disable-next-line no-process-env
    if (env && process.env[env]) {
      // eslint-disable-next-line no-process-env
      return process.env[env] as TArgs[keyof TArgs] as NonNullable<GetConfigurationValueType<TKey>>;
    }

    const userConfigValue = this._userConfig!.get(key);

    if (userConfigValue != null) {
      return userConfigValue;
    }

    if (defaultValue) {
      return defaultValue;
    }

    if (message) {
      throw new Errors.CLIError(message);
    }

    throw new Errors.CLIError(`Missing "${String(key)}"`);
  }

  cleanRequestId(requestId?: string | null) {
    return requestId ? requestId.split(',')[0].trim() : undefined;
  }

  registryApi(registry: string, token: string) {
    const requestHeaders = {
      Authorization: `Bearer ${token}`,
      'graphql-client-name': 'Hive CLI',
      'graphql-client-version': this.config.version,
    };

    return this.graphql(registry, requestHeaders);
  }

  graphql(endpoint: string, additionalHeaders: Record<string, string> = {}) {
    const requestHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': `hive-cli/${this.config.version}`,
      ...additionalHeaders,
    };

    const isDebug = this.flags.debug;

    return {
      async request<TResult, TVariables>(
        args: {
          operation: TypedDocumentNode<TResult, TVariables>;
          /** timeout in milliseconds */
          timeout?: number;
        } & (TVariables extends Record<string, never>
          ? {
              variables?: never;
            }
          : {
              variables: TVariables;
            }),
      ): Promise<TResult> {
        const response = await http.post(
          endpoint,
          JSON.stringify({
            query: typeof args.operation === 'string' ? args.operation : print(args.operation),
            variables: args.variables,
          }),
          {
            logger: {
              info: (...args) => {
                if (isDebug) {
                  console.info(...args);
                }
              },
              error: (...args) => {
                console.error(...args);
              },
            },
            headers: requestHeaders,
            timeout: args.timeout,
          },
        );

        if (!response.ok) {
          throw new Error(`Invalid status code for HTTP call: ${response.status}`);
        }
        const jsonData = (await response.json()) as ExecutionResult<TResult>;

        if (jsonData.errors && jsonData.errors.length > 0) {
          throw new ClientError(
            `Failed to execute GraphQL operation: ${jsonData.errors
              .map(e => e.message)
              .join('\n')}`,
            {
              errors: jsonData.errors,
              headers: response.headers,
            },
          );
        }

        return jsonData.data!;
      },
    };
  }

  /**
   * @see https://oclif.io/docs/error_handling/#error-handling-in-the-catch-method
   */
  async catch(error: CommandError): Promise<void> {
    if (error instanceof Errors.CLIError) {
      await super.catch(error);
    } else {
      const descriptionOfAction = (this.constructor as typeof BaseCommand).descriptionOfAction;
      this.logFailure(`Failed to ${descriptionOfAction}`);
      this.handleFetchError(error);
    }
  }

  handleFetchError(error: unknown): never {
    if (typeof error === 'string') {
      return this.error(error);
    }

    if (error instanceof Error) {
      if (error instanceof ClientError) {
        const errors = error.response?.errors;

        if (Array.isArray(errors) && errors.length > 0) {
          return this.error(errors[0].message, {
            ref: this.cleanRequestId(error.response?.headers?.get('x-request-id')),
          });
        }

        return this.error(error.message, {
          ref: this.cleanRequestId(error.response?.headers?.get('x-request-id')),
        });
      }

      return this.error(error);
    }

    return this.error(JSON.stringify(error));
  }

  async require<
    TFlags extends {
      require: string[];
      [key: string]: any;
    },
  >(flags: TFlags) {
    if (flags.require && flags.require.length > 0) {
      await Promise.all(
        flags.require.map(mod => import(require.resolve(mod, { paths: [process.cwd()] }))),
      );
    }
  }
}

export type Flags<T extends typeof Command> = Interfaces.InferredFlags<
  (typeof BaseCommand)['baseFlags'] & T['flags']
>;

export type Args<T extends typeof Command> = Interfaces.InferredArgs<T['args']>;

type InferFailure<$CommandClass extends typeof Command> =
  'outputFailure' extends keyof $CommandClass
    ? $CommandClass['outputFailure'] extends Envelope.FailureBase
      ? Typebox.Static<$CommandClass['outputFailure']>
      : never
    : never;

type InferFailureInit<$CommandClass extends typeof Command> = 'output' extends keyof $CommandClass
  ? $CommandClass['output'] extends OutputType
    ? OptionalizePropertyUnsafe<
        Omit<Exclude<Typebox.Static<$CommandClass['output']>, { ok: true }>, 'ok'>,
        'message' | 'exitCode' | 'code' | 'url' | 'suggestions'
      >
    : InferFailureInputError
  : InferFailureInputError;

type InferFailureInputError =
  'Error: Missing e.g. `static output = Envelope.Failure({ ... })` on your command.';

type InferSuccess<$CommandClass extends typeof Command> = 'output' extends keyof $CommandClass
  ? $CommandClass['output'] extends OutputType
    ? Exclude<Typebox.Static<$CommandClass['output']>, { ok: false }>
    : never
  : never;

type InferSuccessInit<$CommandClass extends typeof Command> = 'output' extends keyof $CommandClass
  ? $CommandClass['output'] extends OutputType
    ? OptionalizePropertyUnsafe<
        Omit<Exclude<Typebox.Static<$CommandClass['output']>, { ok: false }>, 'ok'>,
        'message'
      >
    : InferSuccessDataInputError
  : InferSuccessDataInputError;

type InferSuccessDataInputError =
  'Error: Missing e.g. `static output = Envelope.Success({ ... })` on your command.';
