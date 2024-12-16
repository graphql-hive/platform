import { Typebox } from './typebox/__';

// prettier-ignore
export type OutputType =
  | Envelope.Empty
  | Typebox.Union<Envelope.Empty[]>

export namespace Envelope {
  export const Empty = Typebox.Object({
    ok: Typebox.Literal(true),
    message: Typebox.Optional(Typebox.String()),
  });
  export type Empty = typeof Empty;

  export const Generic = <$DataInit extends Typebox.TProperties>(data: $DataInit) =>
    Typebox.Composite([
      Empty,
      Typebox.Object({
        data: Typebox.Object(data),
      }),
    ]);

  export const IdempotentableSkipped = <$Data extends Typebox.TProperties>(data: $Data) =>
    Typebox.Composite([
      Empty,
      Typebox.Object({
        effect: Typebox.Literal('skipped'),
        data: Typebox.Object(data),
      }),
    ]);

  export const IdempotentableExecuted = <$Data extends Typebox.TProperties>(data: $Data) =>
    Typebox.Composite([
      Empty,
      Typebox.Object({
        effect: Typebox.Literal('executed'),
        data: Typebox.Object(data),
      }),
    ]);
}

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
