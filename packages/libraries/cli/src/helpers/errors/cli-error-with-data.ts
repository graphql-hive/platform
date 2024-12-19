import { Errors } from '@oclif/core';
import { SchemaOutput } from '../../schema-output/__';

export class CLIErrorWithData extends Errors.CLIError {
  public envelope: SchemaOutput.FailureGeneric;
  constructor(args: {
    message: string;
    exitCode?: number;
    code?: string;
    ref?: string | undefined;
    suggestions?: string[];
    data?: Partial<SchemaOutput.FailureGeneric>['data'];
  }) {
    const envelope = {
      ...SchemaOutput.failureDefaults,
      data: args.data ?? {},
    };
    super(args.message, {
      exit: args.exitCode,
      message: args.message,
      code: args.code,
      ref: args.ref,
      suggestions: args.suggestions,
    });
    this.envelope = envelope;
  }
}
