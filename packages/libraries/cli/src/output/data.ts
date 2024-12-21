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
export const SchemaChangesText = (data: SchemaChanges) => {
  let o = '';

  const writeChanges = (schemaChanges: SchemaChange[]) => {
    return schemaChanges
      .map(change => {
        const messageParts = [
          Tex.indent,
          criticalityMap[
            change.isSafeBasedOnUsage ? schemaChangeCriticalityLevel.Safe : change.criticality
          ],
          Tex.bolderize(change.message),
        ];

        if (change.isSafeBasedOnUsage) {
          messageParts.push(Tex.colors.green('(Safe based on usage ✓)'));
        }
        if (change.approval) {
          messageParts.push(
            Tex.colors.green(`(Approved by ${change.approval.by?.displayName ?? '<unknown>'} ✓)`),
          );
        }

        return messageParts.join(' ');
      })
      .join('\n');
  };

  o += Tex.info(`Detected ${data.length} change${data.length > 1 ? 's' : ''}\n`);

  const breakingChanges = data.filter(
    change => change.criticality === schemaChangeCriticalityLevel.Breaking,
  );
  const safeChanges = data.filter(
    change => change.criticality !== schemaChangeCriticalityLevel.Breaking,
  );

  if (breakingChanges.length) {
    o += Tex.indent + `Breaking changes:\n`;
    o += writeChanges(breakingChanges);
  }

  if (safeChanges.length) {
    o += Tex.indent + `Safe changes:\n`;
    o += writeChanges(safeChanges);
  }

  return o + '\n';
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

export const SchemaError = tb.Object({
  message: tb.String(),
});

export type SchemaError = tb.Static<typeof SchemaError>;

export const SchemaErrors = tb.Array(SchemaError);
export const SchemaErrorsText = (data: tb.Static<typeof SchemaErrors>) => {
  let o = '';
  o += Tex.failure(`Detected ${data.length} error${data.length > 1 ? 's' : ''}\n`);
  data.forEach(error => {
    o += Tex.indent + Tex.colors.red('-') + Tex.bolderize(error.message) + '\n';
  });
  return o + '\n';
};

export const AppDeploymentStatus = tb.Enum({
  active: SchemaHive.AppDeploymentStatus.Active,
  pending: SchemaHive.AppDeploymentStatus.Pending,
  retired: SchemaHive.AppDeploymentStatus.Retired,
});
export type AppDeploymentStatus = tb.Static<typeof AppDeploymentStatus>;
