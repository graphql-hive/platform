import { OptionalizePropertyUnsafe, Simplify } from '../helpers/general';
import { Typebox } from '../helpers/typebox/__';
import { ExcludeFailure } from './failure';
import { $Output, Output } from './output';

export const SuccessBase = Typebox.Object({
  ok: Typebox.Literal(true),
  message: Typebox.String(),
});
export type SuccessBase = Typebox.Static<typeof SuccessBase>;

export const successDefaults: Typebox.Static<typeof SuccessBase> = {
  ok: true,
  message: 'Command succeeded.',
};

export const isSuccess = <$Output extends Output>(
  schema: $Output,
): schema is ExcludeFailure<$Output> => schema.ok;

export type ExcludeSuccess<$Type> = Exclude<$Type, { ok: true }>;

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

export type InferSuccessData<$Schema extends $Output> = Simplify<
  // @ts-expect-error fixme
  InferSuccess<$Schema>['data']
>;

export type InferSuccessEnvelopeInit<$Schema extends $Output> = Simplify<
  OptionalizePropertyUnsafe<Omit<InferSuccess<$Schema>, 'ok'>, 'message'>
>;

export type InferSuccess<$Schema extends $Output> = ExcludeFailure<Typebox.Static<$Schema>>;
