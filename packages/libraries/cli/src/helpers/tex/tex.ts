import { inspect as nodeInspect } from 'node:util';
import colors from 'colors';

export { colors };

export const indent = '  ';

export const newline = '\n';

export const plural = (value: unknown[]) => (value.length > 1 ? 's' : '');

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

export const success = (...values: unknown[]) =>
  prefixedInspect(colors.green('✔'))(...values) + newline;

export const failure = (...values: unknown[]) =>
  prefixedInspect(colors.red('✖'))(...values) + newline;

export const info = (...values: unknown[]) =>
  prefixedInspect(colors.yellow('ℹ'))(...values) + newline;

export const warning = (...values: unknown[]) =>
  prefixedInspect(colors.yellow('⚠'))(...values) + newline;
