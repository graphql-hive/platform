import { Typebox } from '../helpers/typebox/__';
import { FailureBase, SuccessBase } from './envelope';

export type $Output =
  | typeof SuccessBase
  | typeof FailureBase
  | Typebox.Union<(typeof SuccessBase | typeof FailureBase)[]>;

export const output = <$Types extends (typeof SuccessBase | typeof FailureBase)[]>(
  ...types: $Types
): Typebox.Union<$Types> => Typebox.Union(types) as any;
