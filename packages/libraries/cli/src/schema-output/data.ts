import { Typebox } from '../helpers/typebox/__';

export const SchemaChangeCriticalityLevel = Typebox.Enum({
  Breaking: 'Breaking',
  Dangerous: 'Dangerous',
  Safe: 'Safe',
});

export const SchemaChange = Typebox.Object({
  message: Typebox.String(),
  criticality: SchemaChangeCriticalityLevel,
  isSafeBasedOnUsage: Typebox.Boolean(),
  approval: Typebox.Nullable(
    Typebox.Object({
      by: Typebox.Nullable(
        Typebox.Object({
          displayName: Typebox.Nullable(Typebox.String()),
        }),
      ),
    }),
  ),
});
export type SchemaChange = Typebox.Static<typeof SchemaChange>;

export const SchemaWarning = Typebox.Object({
  message: Typebox.String(),
  source: Typebox.Nullable(Typebox.String()),
  line: Typebox.Nullable(Typebox.Number()),
  column: Typebox.Nullable(Typebox.Number()),
});
export type SchemaWarning = Typebox.Static<typeof SchemaWarning>;

export const SchemaError = Typebox.Object({
  message: Typebox.String(),
});
export type SchemaError = Typebox.Static<typeof SchemaError>;

export namespace OutputMode {
  export const Stdout = Typebox.Object({
    __typename: Typebox.Literal('CLIOutputStdout'),
    content: Typebox.String(),
  });
  export const File = Typebox.Object({
    __typename: Typebox.Literal('CLIOutputFile'),
    path: Typebox.String(),
  });
}
