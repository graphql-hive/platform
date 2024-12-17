import { Typebox } from '../helpers/typebox/__';
import { success } from './envelope';

export const CLIOutputFile = success({
  __typename: Typebox.Literal('CLIOutputFile'),
  path: Typebox.String(),
});

export const CLIOutputStdout = success({
  __typename: Typebox.Literal('CLIOutputStdout'),
  content: Typebox.String(),
});
