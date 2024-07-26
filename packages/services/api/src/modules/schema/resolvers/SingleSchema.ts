import type { SingleSchemaResolvers } from './../../../__generated__/types.next';

export const SingleSchema: SingleSchemaResolvers = {
  __isTypeOf: obj => {
    return obj.kind === 'single';
  },
  source: schema => {
    return schema.sdl;
  },
  date: ({ date }, _arg, _ctx) => {
    /* FIXME: eddeee888 This date resolver wasn't implemented in the previous version. However, it never threw.
     * This is because `number` can be serialized https://github.com/Urigo/graphql-scalars/blob/7780dac195bc168d6cbfb8c8ba4168a8829a4e65/src/scalars/iso-date/DateTime.ts#L34-L39
     * But the type only has `Date | string` https://github.com/Urigo/graphql-scalars/blob/7780dac195bc168d6cbfb8c8ba4168a8829a4e65/src/scalars/iso-date/DateTime.ts#L84
     * I think we should have an input and output type in `graphql-scalars` e.g.
     * {
     *   input: 'Date | string',
     *   output: 'Date | string | number'
     * }
     */
    return date as any;
  },
};