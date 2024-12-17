import { TSchema, Type } from '@sinclair/typebox';

export * from '@sinclair/typebox';

export * from './value/__';

export const Nullable = <T extends TSchema>(schema: T) => Type.Union([schema, Type.Null()]);

export const StringNonEmpty = Type.String({ minLength: 1 });
