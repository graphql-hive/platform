import { tb } from '../helpers/typebox/__';
import { success } from './success';

export const CLIOutputFile = success('CLIOutputFile', {
  path: tb.String(),
});

export const CLIOutputStdout = success('CLIOutputStdout', {
  content: tb.String(),
});
