import { Errors } from '@oclif/core';
import { SchemaOutput } from '../../schema-output/__';

export class CLIErrorWithData extends Errors.CLIError {
  public envelope: SchemaOutput.FailureGeneric;
  constructor(envelopeInit: Partial<SchemaOutput.FailureGeneric>) {
    const envelope = {
      ...SchemaOutput.failureDefaults,
      ...envelopeInit,
    };
    super(envelope.message, {
      exit: envelope.exitCode,
      message: envelope.message,
      code: envelope.code,
      ref: envelope.reference ?? undefined,
      suggestions: envelope.suggestions,
    });
    this.envelope = envelope;
  }
}
