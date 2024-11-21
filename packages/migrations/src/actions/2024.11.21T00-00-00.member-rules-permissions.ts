import { type MigrationExecutor } from '../pg-migrator';

export default {
  name: '2024.11.21T00-00-00.member-rules-permissions.ts',
  run: ({ sql }) => sql`
    ALTER TABLE "organization_member_roles"
      ADD COLUMN "policies" JSONB
      , ALTER "scopes" DROP NOT NULL
    ;
  `,
} satisfies MigrationExecutor;
