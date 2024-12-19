import { OptionalizePropertyUnsafe, Simplify } from '../helpers/general';
import { tb } from '../helpers/typebox/__';
import { OutputBase, OutputBaseT } from './output';

export const FailureBase = tb.Object({
  type: tb.Literal('failure'),
  exitCode: tb.Integer({ minimum: 1 }),
  code: tb.String(),
  message: tb.String(),
  reference: tb.Nullable(tb.String()),
  suggestions: tb.Array(tb.String()),
});
export type FailureBase = tb.Static<typeof FailureBase>;

export const FailureGeneric = tb.Composite([
  FailureBase,
  tb.Object({
    data: tb.Record(tb.String(), tb.Any()),
  }),
]);
export type FailureGeneric = tb.Static<typeof FailureGeneric>;

export const failure = <$Context extends tb.TProperties>(context: $Context) =>
  tb.Composite([FailureBase, tb.Object({ data: tb.Object(context) })]);

export const isFailure = <$Ouput extends OutputBase>(
  schema: $Ouput,
): schema is Extract<$Ouput, { type: 'failure' }> => schema.type === 'failure';

export const failureDefaults: tb.Static<typeof FailureGeneric> = {
  type: 'failure',
  exitCode: 1,
  code: 'unexpected',
  message: 'Command failed.',
  reference: null,
  suggestions: [],
  data: {},
};

export type InferFailureData<$Schema extends OutputBaseT> =
  // @ts-expect-error fixme
  Simplify<InferFailure<$Schema>['data']>;

export type InferFailureEnvelopeInit<$Schema extends OutputBaseT> = Simplify<
  OptionalizePropertyUnsafe<
    Omit<InferFailure<$Schema>, 'type'>,
    'message' | 'exitCode' | 'code' | 'url' | 'suggestions' | 'reference'
  >
>;

export type InferFailure<$Schema extends OutputBaseT> = Extract<
  tb.Static<$Schema>,
  { type: 'failure' }
>;
