import { OptionalizePropertyUnsafe, Simplify } from '../helpers/general';
import { Typebox } from '../helpers/typebox/__';
import { $Output } from './output';

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
  Typebox.Composite([FailureBase, Typebox.Object({ data: Typebox.Object(context) })]);

export const failureDefaults: Typebox.Static<typeof FailureBase> = {
  ok: false,
  exitCode: 1,
  code: 'unexpected',
  message: 'Command failed.',
  url: null,
  suggestions: [],
  // context: {},
};

export type InferSuccessData<$Schema extends $Output> = Simplify<
  // @ts-expect-error fixme
  InferSuccess<$Schema>['data']
>;

export type InferSuccessEnvelopeInit<$Schema extends $Output> = Simplify<
  OptionalizePropertyUnsafe<Omit<InferSuccess<$Schema>, 'ok'>, 'message'>
>;

export type InferSuccess<$Schema extends $Output> = Exclude<Typebox.Static<$Schema>, { ok: false }>;

export type InferFailureData<$Schema extends $Output> = Simplify<
  // @ts-expect-error fixme
  InferFailure<$Schema>['data']
>;

export type InferFailureEnvelopeInit<$Schema extends $Output> = Simplify<
  OptionalizePropertyUnsafe<
    Omit<InferFailure<$Schema>, 'ok'>,
    'message' | 'exitCode' | 'code' | 'url' | 'suggestions'
  >
>;

export type InferFailure<$Schema extends $Output> = Exclude<Typebox.Static<$Schema>, { ok: true }>;
