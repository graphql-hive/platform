import type { SnapshotSerializer } from 'vitest';
import { ExecaError } from '@esm2cjs/execa';

export const path: SnapshotSerializer = {
  test: (value: unknown) => {
    if (typeof value === 'string') {
      return variableReplacements.some(replacement => replacement.pattern.test(value));
    }
    return isExecaError(value);
  },
  serialize: (value: unknown) => {
    if (typeof value === 'string') {
      return maskVariables(value);
    }
    if (isExecaError(value)) {
      let valueSerialized = '';
      valueSerialized += '--------------------------------------------exitCode:\n';
      valueSerialized += value.exitCode;
      valueSerialized += '\n\n--------------------------------------------stderr:\n';
      valueSerialized += maskVariables(value.stderr);
      valueSerialized += '\n\n--------------------------------------------stdout:\n';
      valueSerialized += maskVariables(value.stdout);
      return valueSerialized;
    }
    return String(value);
  },
};

const variableReplacements = [
  {
    pattern: /(Reference: )[^ ]+/gi,
    mask: '$1__ID__',
  },
  {
    pattern: /(https?:\/\/)[^ ]+/gi,
    mask: '$1__PATH__',
  },
  {
    pattern: /\/.*(\/cli\/bin\/run)/gi,
    mask: '__PATH__$1',
  },
];

const maskVariables = (value: string) => {
  for (const replacement of variableReplacements) {
    value = value.replace(replacement.pattern, replacement.mask);
  }
  return value;
};

/**
 * The esm2cjs execa package we are using is not exporting the error class, so use this.
 */
const isExecaError = (value: unknown): value is ExecaError => {
  // @ts-expect-error
  return typeof value.exitCode === 'number';
};
