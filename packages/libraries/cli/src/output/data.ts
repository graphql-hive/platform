import { SchemaHive } from '../helpers/schema';
import { Tex } from '../helpers/tex/__';
import { tb } from '../helpers/typebox/__';

export const schemaChangeCriticalityLevel = {
  Breaking: 'Breaking',
  Dangerous: 'Dangerous',
  Safe: 'Safe',
} as const;
export type SchemaChangeCriticalityLevel = keyof typeof schemaChangeCriticalityLevel;

export const SchemaChange = tb.Object({
  message: tb.String(),
  criticality: tb.Enum(schemaChangeCriticalityLevel),
  isSafeBasedOnUsage: tb.Boolean(),
  approval: tb.Nullable(
    tb.Object({
      by: tb.Nullable(
        tb.Object({
          displayName: tb.Nullable(tb.String()),
        }),
      ),
    }),
  ),
});
export type SchemaChange = tb.Static<typeof SchemaChange>;

export const SchemaChanges = tb.Array(SchemaChange);
export type SchemaChanges = tb.Static<typeof SchemaChanges>;
export const schemaChangesText = (data: SchemaChanges): string => {
  const breakingChanges = data.filter(
    change => change.criticality === schemaChangeCriticalityLevel.Breaking,
  );
  const safeChanges = data.filter(
    change => change.criticality !== schemaChangeCriticalityLevel.Breaking,
  );
  const s = Tex.builder();
  const writeChanges = (schemaChanges: SchemaChange[]) => {
    return schemaChanges
      .map(change => {
        const parts = [
          Tex.indent,
          criticalityMap[
            change.isSafeBasedOnUsage ? schemaChangeCriticalityLevel.Safe : change.criticality
          ],
          Tex.bolderize(change.message),
        ];

        if (change.isSafeBasedOnUsage) {
          parts.push(Tex.colors.green('(Safe based on usage ✓)'));
        }
        if (change.approval) {
          parts.push(
            Tex.colors.green(`(Approved by ${change.approval.by?.displayName ?? '<unknown>'} ✓)`),
          );
        }

        return parts.join(Tex.space);
      })
      .join(Tex.newline);
  };

  s.info(`Detected ${data.length} change${Tex.plural(data)}`);

  if (breakingChanges.length) {
    s.indent(`Breaking changes:`);
    s(writeChanges(breakingChanges));
  }

  if (safeChanges.length) {
    s.indent(`Safe changes:`);
    s(writeChanges(safeChanges));
  }

  return s.state.value.trim();
};

const criticalityMap = {
  [schemaChangeCriticalityLevel.Breaking]: Tex.colors.red('-'),
  [schemaChangeCriticalityLevel.Safe]: Tex.colors.green('-'),
  [schemaChangeCriticalityLevel.Dangerous]: Tex.colors.green('-'),
} satisfies Record<SchemaChangeCriticalityLevel, string>;

export const SchemaWarning = tb.Object({
  message: tb.String(),
  source: tb.Nullable(tb.String()),
  line: tb.Nullable(tb.Number()),
  column: tb.Nullable(tb.Number()),
});
export type SchemaWarning = tb.Static<typeof SchemaWarning>;

export const SchemaWarnings = tb.Array(SchemaWarning);
export type SchemaWarnings = tb.Static<typeof SchemaWarnings>;
export const schemaWarningsText = (warnings: SchemaWarnings): string => {
  const s = Tex.builder();
  s.warning(`Detected ${warnings.length} warning${Tex.plural(warnings)}`);
  s.line();
  warnings.forEach(warning => {
    const details = [warning.source ? `source: ${Tex.bolderize(warning.source)}` : undefined]
      .filter(Boolean)
      .join(', ');
    s.indent(`- ${Tex.bolderize(warning.message)}${details ? ` (${details})` : ''}`);
  });
  return s.state.value.trim();
};

export const SchemaError = tb.Object({
  message: tb.String(),
});

export type SchemaError = tb.Static<typeof SchemaError>;

export const SchemaErrors = tb.Array(SchemaError);
export const schemaErrorsText = (data: tb.Static<typeof SchemaErrors>): string => {
  const s = Tex.builder();
  s.failure(`Detected ${data.length} error${Tex.plural(data)}`);
  s();
  data.forEach(error => {
    s.indent(Tex.colors.red('-') + ' ' + Tex.bolderize(error.message));
  });
  return s.state.value.trim();
};

export const AppDeploymentStatus = tb.Enum({
  active: SchemaHive.AppDeploymentStatus.Active,
  pending: SchemaHive.AppDeploymentStatus.Pending,
  retired: SchemaHive.AppDeploymentStatus.Retired,
});
export type AppDeploymentStatus = tb.Static<typeof AppDeploymentStatus>;
