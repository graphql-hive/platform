import { tb } from '../helpers/typebox/__';
import { success } from './success';

export const CLIOutputFile = success({
  type: tb.Literal('CLIOutputFile'),
  path: tb.String(),
});

export const CLIOutputStdout = success({
  type: tb.Literal('CLIOutputStdout'),
  content: tb.String(),
});
