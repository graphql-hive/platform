import { tb } from '../helpers/typebox/__';
import { success } from './success';

export const SuccessOutputFile = success('SuccessOutputFile', {
  path: tb.String(),
});

export const SuccessOutputStdout = success('SuccessOutputStdout', {
  content: tb.String(),
});
