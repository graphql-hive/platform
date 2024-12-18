import { OptionalizePropertyUnsafe, Simplify } from '../helpers/general';
import { Typebox } from '../helpers/typebox/__';
import { $Output, Output } from './output';
import { ExcludeSuccess } from './success';

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

export const isFailure = <$Ouput extends Output>(
  schema: $Ouput,
): schema is ExcludeSuccess<$Ouput> => !schema.ok;

export type ExcludeFailure<$Type> = Exclude<$Type, { ok: false }>;

export const failureDefaults: Typebox.Static<typeof FailureBase> = {
  ok: false,
  exitCode: 1,
  code: 'unexpected',
  message: 'Command failed.',
  url: null,
  suggestions: [],
  // context: {},
};

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

export type InferFailure<$Schema extends $Output> = ExcludeSuccess<Typebox.Static<$Schema>>;
