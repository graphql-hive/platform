import { inspect as nodeInspect } from 'node:util';
import colors from 'colors';

export { colors };

export const indent = '  ';

export const bolderize = (msg: string) => {
  const findSingleQuotes = /'([^']+)'/gim;
  const findDoubleQuotes = /"([^"]+)"/gim;

  return msg
    .replace(findSingleQuotes, (_: string, value: string) => colors.bold(value))
    .replace(findDoubleQuotes, (_: string, value: string) => colors.bold(value));
};

export const prefixedInspect =
  (prefix: string) =>
  (...values: unknown[]) => {
    const body = values.map(inspect).join(' ');
    return [prefix, body].join(' ');
  };

export const inspect = (value: unknown) => {
  if (typeof value === 'string') {
    return value;
  }
  return nodeInspect(value);
};

export const success = prefixedInspect(colors.green('✔'));

export const failure = prefixedInspect(colors.red('✖'));

export const info = prefixedInspect(colors.yellow('ℹ'));

export const warning = prefixedInspect(colors.yellow('⚠'));
