import { OptionalizePropertyUnsafe, Simplify } from '../helpers/general';
import { tb } from '../helpers/typebox/__';
import { OutputBase, OutputBaseT } from './output';

export const FailureBase = tb.Object({
  type: tb.Literal('failure'),
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

export const isFailure = <$Output extends OutputBase>(
  schema: $Output,
): schema is Extract<$Output, { type: 'failure' }> =>
  schema.type === FailureBase.properties.type.const;

export const failureDefaults: tb.Static<typeof FailureGeneric> = {
  type: 'failure',
  reference: null,
  suggestions: [],
  data: {},
};

export type InferFailureData<$Schema extends OutputBaseT> =
  // @ts-expect-error fixme
  Simplify<InferFailure<$Schema>['data']>;

export type InferFailureEnvelopeInit<$Schema extends OutputBaseT> = Simplify<
  OptionalizePropertyUnsafe<Omit<InferFailure<$Schema>, 'type'>, 'suggestions' | 'reference'>
>;

export type InferFailure<$Schema extends OutputBaseT> = Extract<
  tb.Static<$Schema>,
  { type: 'failure' }
>;
