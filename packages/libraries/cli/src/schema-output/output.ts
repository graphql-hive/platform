import { Typebox } from '../helpers/typebox/__';
import { FailureBase } from './failure';
import { SuccessBase } from './success';

export const Output = Typebox.Union([
  SuccessBase,
  FailureBase,
  Typebox.Union([SuccessBase, FailureBase]),
]);
export type Output = Typebox.Static<typeof Output>;

export type $Output =
  | typeof SuccessBase
  | typeof FailureBase
  | Typebox.Union<(typeof SuccessBase | typeof FailureBase)[]>;

export const output = <$Types extends (typeof SuccessBase | typeof FailureBase)[]>(
  ...types: $Types
): Typebox.Union<$Types> => Typebox.Union(types) as any;
