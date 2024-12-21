import { tb } from '../helpers/typebox/__';
import { FailureBase } from './failure';
import { SuccessBase } from './success';

export interface OutputDataType<$Schema extends tb.TObject = tb.TObject> {
  schema: $Schema;
  render?: (input: { flags: any; args: any }, output: any) => string;
}

export const success: Factory<typeof SuccessBase> = (typeName, config) => {
  return {
    render: config.render,
    schema: tb.Composite([
      SuccessBase,
      tb.Object({
        data: tb.Composite([
          tb.Object({ type: tb.Literal(typeName, { default: typeName }) }),
          tb.Object(config.schema),
        ]),
      }),
    ]),
  } as any;
};

export const failure: Factory<typeof FailureBase> = (typeName, config) => {
  return {
    render: config.render,
    schema: tb.Composite([
      FailureBase,
      tb.Object({
        data: tb.Composite([
          tb.Object({ type: tb.Literal(typeName, { default: typeName }) }),
          tb.Object(config.schema),
        ]),
      }),
    ]),
  } as any;
};

export type Factory<$Base extends tb.TObject> = <
  $DataSchema extends tb.TProperties,
  $TypeName extends string,
>(
  typeName: $TypeName,
  config: {
    schema: $DataSchema;
    render?: (
      input: { flags: any; args: any },
      // @ts-expect-error fixme
      output: tb.Static<
        tb.TComposite<
          [
            $Base,
            tb.TObject<{
              data: tb.TComposite<
                [tb.TObject<{ type: tb.TLiteral<$TypeName> }>, tb.TObject<NoInfer<$DataSchema>>]
              >;
            }>,
          ]
        >
      >['data'],
    ) => string;
  },
) => OutputDataType<
  tb.TComposite<
    [
      $Base,
      tb.TObject<{
        data: tb.TComposite<
          [tb.TObject<{ type: tb.TLiteral<$TypeName> }>, tb.TObject<$DataSchema>]
        >;
      }>,
    ]
  >
>;
