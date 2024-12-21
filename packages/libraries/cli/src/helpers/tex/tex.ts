import { inspect as nodeInspect } from 'node:util';
import colors from 'colors';

export { colors };

export const space = ' ';

export const indent = space.repeat(2);

export const newline = '\n';

export const plural = (value: unknown[]) => (value.length > 1 ? 's' : '');

export const trimEnd = (value: string) => value.replace(/\s+$/g, '');

export const bolderize = (value: string) => {
  const findSingleQuotes = /'([^']+)'/gim;
  const findDoubleQuotes = /"([^"]+)"/gim;

  return value
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

/**
 * Helper function and methods for quickly building strings.
 *
 * The function form is an alias to the `line` method.
 */
export interface Builder extends BuilderProperties {
  (...args: Parameters<BuilderProperties['line']>): Builder;
}

export interface BuilderProperties {
  /**
   * When another builder is passed its value is appended _without_ a newline at the end
   * since builders already supply newlines to their content.
   */
  line: (value?: string | Builder) => Builder;
  /**
   * Add a "success" line.
   */
  success: (...values: unknown[]) => Builder;
  /**
   * Add a "failure" line.
   */
  failure: (...values: unknown[]) => Builder;
  /**
   * Add an "info" line.
   */
  info: (...values: unknown[]) => Builder;
  /**
   * Add a "warning" line.
   */
  warning: (...values: unknown[]) => Builder;
  /**
   * Add an indented line.
   */
  indent: (value: string) => Builder;
  /**
   * The current string value of this builder.
   */
  state: BuilderState;
}

interface BuilderState {
  value: string;
}

export const builder = (): Builder => {
  const state: BuilderState = {
    value: '',
  };

  const self: Builder = (value => {
    if (value === undefined) {
      state.value = state.value + newline;
    } else if (typeof value === 'string') {
      state.value = state.value + value + newline;
    } else {
      state.value = state.value + value.state.value;
    }
    return self as Builder;
  }) as Builder;

  const properties: BuilderProperties = {
    line: self,
    indent: value => {
      state.value = state.value + indent + value + newline;
      return self;
    },
    success: (...values) => {
      state.value = state.value + success(...values);
      return self;
    },
    failure: (...values) => {
      state.value = state.value + failure(...values);
      return self;
    },
    info: (...values) => {
      state.value = state.value + info(...values);
      return self;
    },
    warning: (...values) => {
      state.value = state.value + warning(...values);
      return self;
    },
    state,
  };

  Object.assign(self, properties);

  return self;
};
