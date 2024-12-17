import { Typebox } from '../helpers/typebox/__';

export const SuccessBase = Typebox.Object({
  ok: Typebox.Literal(true),
  message: Typebox.String(),
});
export type SuccessBase = Typebox.Static<typeof SuccessBase>;

export const successDefaults: Typebox.Static<typeof SuccessBase> = {
  ok: true,
  message: 'Command succeeded.',
};

export const success = <$DataInit extends Typebox.TProperties>(data: $DataInit) =>
  Typebox.Composite([
    SuccessBase,
    Typebox.Object({
      data: Typebox.Object(data),
    }),
  ]);

export const successIdempotentableSkipped = <$Data extends Typebox.TProperties>(data: $Data) =>
  Typebox.Composite([
    SuccessBase,
    Typebox.Object({
      effect: Typebox.Literal('skipped'),
      data: Typebox.Object(data),
    }),
  ]);

export const successIdempotentableExecuted = <$Data extends Typebox.TProperties>(data: $Data) =>
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
export type FailureBase = Typebox.Static<typeof FailureBase>;

export const failure = <$Context extends Typebox.TProperties>(context: $Context) =>
  Typebox.Composite([FailureBase, Typebox.Object({ context: Typebox.Object(context) })]);

export const failureDefaults: Typebox.Static<typeof FailureBase> = {
  ok: false,
  exitCode: 1,
  code: 'unexpected',
  message: 'Command failed.',
  url: null,
  suggestions: [],
  // context: {},
};
