import { OptionalizePropertyUnsafe, Simplify } from '../helpers/general';
import { tb } from '../helpers/typebox/__';
import { OutputDataType } from './output-data-type';
import type { SuccessBase } from './success';

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

export const isFailure = <$Output extends SuccessBase | FailureBase>(
  schema: $Output,
): schema is Extract<$Output, { type: 'failure' }> =>
  schema.type === FailureBase.properties.type.const;

export const failureDefaults: tb.Static<typeof FailureGeneric> = {
  type: 'failure',
  reference: null,
  suggestions: [],
  data: {},
};

export type InferFailureData<$DataType extends OutputDataType> = Simplify<
  InferFailure<$DataType>['data']
>;

export type InferFailureEnvelopeInit<$DataType extends OutputDataType> = Simplify<
  OptionalizePropertyUnsafe<Omit<InferFailure<$DataType>, 'type'>, 'suggestions' | 'reference'>
>;

export type InferFailure<$DataType extends OutputDataType> = Extract<
  tb.Static<$DataType['schema']>,
  { type: 'failure' }
>;
