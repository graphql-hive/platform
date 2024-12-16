import { Typebox } from './typebox/__';

// prettier-ignore
export type OutputSchema =
  | EnvelopeEmpty
  | Typebox.Union<EnvelopeEmpty[]>
// | Typebox.Union<[EnvelopeEmpty]>
// | Typebox.Union<[EnvelopeEmpty, EnvelopeEmpty]>
// | Typebox.Union<[EnvelopeEmpty, EnvelopeEmpty, EnvelopeEmpty]>
// | Typebox.Union<[EnvelopeEmpty, EnvelopeEmpty, EnvelopeEmpty, EnvelopeEmpty]>;
// ... as many as needed

type EnvelopeEmpty = OutputSchema.EnvelopeEmpty;

export namespace OutputSchema {
  export const EnvelopeEmpty = Typebox.Object({
    ok: Typebox.Literal(true),
    message: Typebox.Optional(Typebox.String()),
  });
  export type EnvelopeEmpty = typeof EnvelopeEmpty;

  export const Envelope = <$DataInit extends Typebox.TProperties>(data: $DataInit) =>
    Typebox.Composite([
      EnvelopeEmpty,
      Typebox.Object({
        data: Typebox.Object(data),
      }),
    ]);

  export const IdempotentableEnvelopeSkipped = <$Data extends Typebox.TProperties>(data: $Data) =>
    Typebox.Composite([
      EnvelopeEmpty,
      Typebox.Object({
        effect: Typebox.Literal('skipped'),
        data: Typebox.Object(data),
      }),
    ]);

  export const IdempotentableEnvelopeExecuted = <$Data extends Typebox.TProperties>(data: $Data) =>
    Typebox.Composite([
      EnvelopeEmpty,
      Typebox.Object({
        effect: Typebox.Literal('executed'),
        data: Typebox.Object(data),
      }),
    ]);

  export namespace DataOutputMode {
    export const Stdout = Typebox.Object({
      outputMode: Typebox.Literal('stdout'),
      content: Typebox.String(),
    });
    export const File = Typebox.Object({
      outputMode: Typebox.Literal('file'),
      path: Typebox.String(),
    });
  }
}
