import { Errors } from '@oclif/core';
import { Envelope } from '../../schema/envelope';
import { Typebox } from '../typebox/__';

export class CLIFailure extends Errors.CLIError {
  public envelope: Typebox.Static<Envelope.FailureBase>;
  constructor(envelopeInit: Partial<Typebox.Static<Envelope.FailureBase>>) {
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
