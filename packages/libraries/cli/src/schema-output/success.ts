import { OptionalizePropertyUnsafe, Simplify } from '../helpers/general';
import { tb } from '../helpers/typebox/__';
import type { FailureBase } from './failure';
import { OutputDataType } from './output-data-type';

export const SuccessBase = tb.Object({
  type: tb.Literal('success', { default: 'success' }),
});
export type SuccessBase = tb.Static<typeof SuccessBase>;

export const SuccessGeneric = tb.Composite([
  SuccessBase,
  tb.Object({
    data: tb.Record(tb.String(), tb.Any()),
  }),
]);
export type SuccessGeneric = tb.Static<typeof SuccessGeneric>;

export const successDefaults: tb.Static<typeof SuccessGeneric> = {
  type: 'success',
  data: {},
};

export const isSuccess = <$Output extends FailureBase | SuccessBase>(
  schema: $Output,
): schema is Extract<$Output, { type: 'success' }> =>
  schema.type === SuccessBase.properties.type.const;

export type InferSuccessData<$DataType extends OutputDataType> = Simplify<
  InferSuccess<$DataType>['data']
>;

export type InferSuccessEnvelopeInit<$DataType extends OutputDataType> = Simplify<
  OptionalizePropertyUnsafe<Omit<InferSuccess<$DataType>, 'type'>, 'data'>
>;

export type InferSuccess<$DataType extends OutputDataType> = Extract<
  tb.Static<$DataType['schema']>,
  { type: 'success' }
>;
