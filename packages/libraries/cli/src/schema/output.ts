import { Typebox } from '../helpers/typebox/__';
import { Envelope } from './envelope';

// prettier-ignore
export type OutputType =
  | Envelope.SuccessBase
  | Envelope.FailureBase
  | Typebox.Union<(Envelope.SuccessBase | Envelope.FailureBase)[]>
