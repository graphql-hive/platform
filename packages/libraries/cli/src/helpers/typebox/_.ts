import { FormatRegistry, TSchema, Type } from '@sinclair/typebox';

const uriRegex = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i;

FormatRegistry.Set('uri', (value: unknown) => {
  if (typeof value !== 'string') {
    return false;
  }

  return uriRegex.test(value);
});

export * from '@sinclair/typebox';

export * from './value/__';

export const Nullable = <T extends TSchema>(schema: T) => Type.Union([schema, Type.Null()]);

export const StringNonEmpty = Type.String({ minLength: 1 });
