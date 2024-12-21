import { tb } from '../helpers/typebox/__';
import { success } from './output-data-type';

export const SuccessOutputFile = success('SuccessOutputFile', {
  schema: {
    path: tb.String(),
  },
});

export const SuccessOutputStdout = success('SuccessOutputStdout', {
  schema: {
    content: tb.String(),
  },
});
