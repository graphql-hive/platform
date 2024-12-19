import { type MigrationExecutor } from '../pg-migrator';

export default {
  name: '2024.11.21T00-00-00.member-rules-permissions.ts',
  run: ({ sql }) => sql`
    ALTER TABLE "organization_member_roles"
      ALTER "scopes" DROP NOT NULL
      , ADD COLUMN "permissions_groups" JSONB
    ;

    CREATE TABLE "organization_member_role_assignments" (
      "organization_id" UUID NOT NULL REFERENCES "organizations" ("id") ON DELETE CASCADE
      , "user_id" UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE
      , "organization_member_role_id" UUID NOT NULL REFERENCES "organization_member_roles" ("id") ON DELETE CASCADE
      , "resources" JSONB
      PRIMARY KEY ("organization_id", "user_id", "organization_member_role_id")
    );
  `,
} satisfies MigrationExecutor;
