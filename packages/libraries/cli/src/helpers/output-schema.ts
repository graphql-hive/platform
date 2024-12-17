import { Typebox } from './typebox/__';

// prettier-ignore
export type OutputType =
  | Envelope.SuccessBase
  | Envelope.FailureBase
  | Typebox.Union<(Envelope.SuccessBase | Envelope.FailureBase)[]>

export namespace Envelope {
  export const SuccessBase = Typebox.Object({
    ok: Typebox.Literal(true),
    message: Typebox.String(),
  });
  export type SuccessBase = typeof SuccessBase;

  export const successDefaults: Typebox.Static<SuccessBase> = {
    ok: true,
    message: 'Command succeeded.',
  };

  export const Success = <$DataInit extends Typebox.TProperties>(data: $DataInit) =>
    Typebox.Composite([
      SuccessBase,
      Typebox.Object({
        data: Typebox.Object(data),
      }),
    ]);

  export const SuccessIdempotentableSkipped = <$Data extends Typebox.TProperties>(data: $Data) =>
    Typebox.Composite([
      SuccessBase,
      Typebox.Object({
        effect: Typebox.Literal('skipped'),
        data: Typebox.Object(data),
      }),
    ]);

  export const SuccessIdempotentableExecuted = <$Data extends Typebox.TProperties>(data: $Data) =>
    Typebox.Composite([
      SuccessBase,
      Typebox.Object({
        effect: Typebox.Literal('executed'),
        data: Typebox.Object(data),
      }),
    ]);

  export const FailureBase = Typebox.Object({
    ok: Typebox.Literal(false),
    exitCode: Typebox.Integer({ minimum: 1 }),
    code: Typebox.String(),
    message: Typebox.String(),
    url: Typebox.Nullable(Typebox.String({ format: 'uri' })),
    suggestions: Typebox.Array(Typebox.String()),
    // data: Typebox.Record(Typebox.String(), Typebox.Any()),
  });
  export type FailureBase = typeof FailureBase;

  export const Failure = <$Context extends Typebox.TProperties>(context: $Context) =>
    Typebox.Composite([FailureBase, Typebox.Object({ context: Typebox.Object(context) })]);

  export const failureDefaults: Typebox.Static<FailureBase> = {
    ok: false,
    exitCode: 1,
    code: 'unexpected',
    message: 'Command failed.',
    url: null,
    suggestions: [],
    // context: {},
  };
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
