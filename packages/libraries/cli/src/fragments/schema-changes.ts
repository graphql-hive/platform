import colors from 'colors';
import BaseCommand from '../base-command';
import { FragmentType, graphql, useFragment as unmaskFragment, useFragment } from '../gql';
import { CriticalityLevel } from '../gql/graphql';
import { indent } from '../helpers/text';
import * as SchemaOutput from '../schema-output/data';

export const RenderChanges_SchemaChanges = graphql(`
  fragment RenderChanges_schemaChanges on SchemaChangeConnection {
    total
    nodes {
      criticality
      isSafeBasedOnUsage
      message(withSafeBasedOnUsageNote: false)
      approval {
        approvedBy {
          displayName
        }
      }
    }
  }
`);

type MaskedFragment = FragmentType<typeof RenderChanges_SchemaChanges>;

export namespace SchemaChange {
  export function log(this: BaseCommand<any>, maskedFragment: MaskedFragment) {
    const changes = unmaskFragment(RenderChanges_SchemaChanges, maskedFragment);
    type ChangeType = (typeof changes)['nodes'][number];

    const writeChanges = (changes: ChangeType[]) => {
      changes.forEach(change => {
        const messageParts = [
          String(indent),
          criticalityMap[change.isSafeBasedOnUsage ? CriticalityLevel.Safe : change.criticality],
          this.bolderize(change.message),
        ];

        if (change.isSafeBasedOnUsage) {
          messageParts.push(colors.green('(Safe based on usage ✓)'));
        }
        if (change.approval) {
          messageParts.push(
            colors.green(
              `(Approved by ${change.approval.approvedBy?.displayName ?? '<unknown>'} ✓)`,
            ),
          );
        }

        this.log(...messageParts);
      });
    };

    this.logInfo(`Detected ${changes.total} change${changes.total > 1 ? 's' : ''}`);
    this.log('');

    const breakingChanges = changes.nodes.filter(
      change => change.criticality === CriticalityLevel.Breaking,
    );
    const safeChanges = changes.nodes.filter(
      change => change.criticality !== CriticalityLevel.Breaking,
    );

    if (breakingChanges.length) {
      this.log(String(indent), `Breaking changes:`);
      writeChanges(breakingChanges);
    }

    if (safeChanges.length) {
      this.log(String(indent), `Safe changes:`);
      writeChanges(safeChanges);
    }
  }

  export const toSchemaOutput = (
    maskedChanges: undefined | null | MaskedFragment,
  ): SchemaOutput.SchemaChange[] => {
    const changes = useFragment(RenderChanges_SchemaChanges, maskedChanges);
    return (
      changes?.nodes.map(_ => ({
        message: _.message,
        criticality: _.criticality,
        isSafeBasedOnUsage: _.isSafeBasedOnUsage,
        approval: _.approval
          ? {
              by: _.approval.approvedBy
                ? {
                    displayName: _.approval.approvedBy.displayName,
                  }
                : null,
            }
          : null,
      })) ?? []
    );
  };
}

const criticalityMap: Record<CriticalityLevel, string> = {
  [CriticalityLevel.Breaking]: colors.red('-'),
  [CriticalityLevel.Safe]: colors.green('-'),
  [CriticalityLevel.Dangerous]: colors.green('-'),
};
