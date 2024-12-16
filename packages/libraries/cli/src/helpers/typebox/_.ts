import { TObject, TProperties, TSchema, TString, Type } from '@sinclair/typebox';

export * from '@sinclair/typebox';

export * from './value/__';

export const Nullable = <T extends TSchema>(schema: T) => Type.Union([schema, Type.Null()]);

export const StringNonEmpty = Type.String({ minLength: 1 });

// todo remove
// export type NormalizeTObjectInitX<$T extends TObjectInit> = $T extends TProperties
//   ? TObject<$T>
//   : $T;

// // prettier-ignore
// export type NormalizeTObjectInit<$T extends TObjectInit> =
//   $T extends TObject
//     ? $T
//     : $T extends TProperties
//       ? TObject<$T>
//       : never;

// export type TObjectInit = TObject | TProperties;
