import { Tex } from '../helpers/tex/__';
import { T } from '../helpers/typebox/__';
import { FailureBase } from './failure';
import { SuccessBase } from './success';

export interface DataType<$Schema extends T.TObject = T.TObject> {
  schema: $Schema;
  text?: TextBuilder;
}

export const success: Factory<typeof SuccessBase> = (typeName, config) => {
  return {
    text: config.text,
    schema: T.Composite([
      SuccessBase,
      T.Object({
        data: T.Composite([
          T.Object({ type: T.Literal(typeName, { default: typeName }) }),
          T.Object(config.data),
        ]),
      }),
    ]),
  } as any;
};

export const failure: Factory<typeof FailureBase> = (typeName, config) => {
  return {
    text: config.text,
    schema: T.Composite([
      FailureBase,
      T.Object({
        data: T.Composite([
          T.Object({ type: T.Literal(typeName, { default: typeName }) }),
          T.Object(config.data),
        ]),
      }),
    ]),
  } as any;
};

export type Factory<$BaseT extends T.TObject> = <
  $DataT extends T.TProperties,
  $TypeName extends string,
  $OutputT extends T.TObject = T.TComposite<
    [
      $BaseT,
      T.TObject<{
        data: T.TComposite<
          [T.TObject<{ type: T.TLiteral<$TypeName> }>, T.TObject<NoInfer<$DataT>>]
        >;
      }>,
    ]
  >,
>(
  typeName: $TypeName,
  config: {
    /**
     * The schema for this data type.
     */
    data: $DataT;
    /**
     * An optional function used to create a string to be displayed to the user
     * whenever this data type is output by a command.
     *
     * @returns
     *
     * 1. You may return a string
     * 2. You may return a {@link Tex.Builder} (tip: use the one given, third parameter).
     * 3. You may return nothing. In this case the the string state of the given text builder is used.
     *
     * Tip: If you want a declarative logging-like experience use the given {@link Tex.Builder} and
     * don't return anything.
     *
     * Note: If user invoked the CLI with --json, then the output from this function is ignored.
     */
    text?: TextBuilder<T.Static<$OutputT>['data']>;
  },
) => DataType<$OutputT>;

interface TextBuilder<$Data = any> {
  (
    /**
     * The arguments passed to the command.
     */
    input: {
      /**
       * The flag arguments passed to the command.
       */
      flags: any;
      /**
       * The positional arguments passed to the command.
       */
      args: any;
    },
    /**
     * The data output by the command.
     */
    data: $Data,
    /**
     * A {@link Tex.Builder} instance provided to you for easily building your text.
     */
    texBuilder: Tex.Builder,
  ): void | string | Tex.Builder;
}
