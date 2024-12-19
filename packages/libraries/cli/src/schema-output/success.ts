import { OptionalizePropertyUnsafe, Simplify } from '../helpers/general';
import { tb } from '../helpers/typebox/__';
import { OutputBase, OutputBaseT } from './output';

export const SuccessBase = tb.Object({
  type: tb.Literal('success'),
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

export const isSuccess = <$Output extends OutputBase>(
  schema: $Output,
): schema is Extract<$Output, { type: 'success' }> =>
  schema.type === SuccessBase.properties.type.const;

export const success = <$DataInit extends tb.TProperties>(data: $DataInit) =>
  tb.Composite([
    SuccessBase,
    tb.Object({
      data: tb.Object(data),
    }),
  ]);

export type InferSuccessData<$Schema extends OutputBaseT> =
  // @ts-expect-error fixme
  Simplify<InferSuccess<$Schema>['data']>;

export type InferSuccessEnvelopeInit<$Schema extends OutputBaseT> = Simplify<
  OptionalizePropertyUnsafe<Omit<InferSuccess<$Schema>, 'type'>, 'data'>
>;

export type InferSuccess<$Schema extends OutputBaseT> = Extract<
  tb.Static<$Schema>,
  { type: 'success' }
>;
