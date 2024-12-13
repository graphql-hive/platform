/**
 * This code should never be reached.
 */
export const casesExhausted = (value: never): never => {
  throw new Error(`Unhandled case: ${String(value)}`);
};

export type OmitNever<T> = { [K in keyof T as T[K] extends never ? never : K]: T[K] };

export type OptionalizePropertyUnsafe<$Object extends object, $Key extends PropertyKey> = Omit<
  $Object,
  $Key
> & {
  [_ in $Key]?: $Key extends keyof $Object ? $Object[$Key] : never;
};
