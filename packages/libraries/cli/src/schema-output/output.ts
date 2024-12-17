import { Typebox } from '../helpers/typebox/__';
import { FailureBase, SuccessBase } from './envelope';

export type $Output =
  | typeof SuccessBase
  | typeof FailureBase
  | Typebox.Union<(typeof SuccessBase | typeof FailureBase)[]>;
