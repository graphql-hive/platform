import { tb } from '../helpers/typebox/__';
import { FailureBase } from './failure';
import { SuccessBase } from './success';

export interface DataType<$Schema extends tb.TObject = tb.TObject> {
  /**
   * The schema for this data type.
   */
  schema: $Schema;
  /**
   * An optional function that returns a string to be displayed to the user
   * whenever this data type is output by a command.
   *
   * If user invoked the CLI with --json, then the output from this function is ignored.
   */
  text?: (input: { flags: any; args: any }, output: any) => string;
}

export const success: Factory<typeof SuccessBase> = (typeName, config) => {
  return {
    text: config.text,
    schema: tb.Composite([
      SuccessBase,
      tb.Object({
        data: tb.Composite([
          tb.Object({ type: tb.Literal(typeName, { default: typeName }) }),
          tb.Object(config.data),
        ]),
      }),
    ]),
  } as any;
};

export const failure: Factory<typeof FailureBase> = (typeName, config) => {
  return {
    text: config.text,
    schema: tb.Composite([
      FailureBase,
      tb.Object({
        data: tb.Composite([
          tb.Object({ type: tb.Literal(typeName, { default: typeName }) }),
          tb.Object(config.data),
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
    data: $DataSchema;
    text?: (
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
) => DataType<
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
