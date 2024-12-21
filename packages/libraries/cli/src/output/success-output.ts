import { tb } from '../helpers/typebox/__';
import { success } from './output-data-type';

export const SuccessOutputFile = success('SuccessOutputFile', {
  data: {
    path: tb.String(),
    bytes: tb.Number(),
  },
});

export const SuccessOutputStdout = success('SuccessOutputStdout', {
  data: {
    content: tb.String(),
  },
  text(_, data) {
    return data.content;
  },
});
