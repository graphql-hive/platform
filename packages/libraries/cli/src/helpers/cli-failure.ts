import { Errors } from '@oclif/core';
import { Envelope } from './output-schema';
import { Typebox } from './typebox/__';

export class CLIFailure extends Errors.CLIError {
  public envelope: Envelope.FailureBase;
  constructor(envelopeInit: Partial<Envelope.FailureBase>) {
    const envelope = {
      ...Envelope.failureDefaults,
      ...envelopeInit,
    };
    super(envelope.message, {
      exit: envelope.exitCode,
      message: envelope.message,
      code: envelope.code,
      ref: envelope.url ?? undefined,
      suggestions: envelope.suggestions,
    });
    this.envelope = envelope;
  }
}
