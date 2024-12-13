/**
 * This code should never be reached.
 */
export const casesExhausted = (value: never): never => {
  throw new Error(`Unhandled case: ${String(value)}`);
};
