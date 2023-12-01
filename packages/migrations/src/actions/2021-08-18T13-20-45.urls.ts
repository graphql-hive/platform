import { type MigrationExecutor } from '../pg-migrator';

export default {
  name: '2021-08-18T13-20-45.urls.sql',
  run: ({ sql }) => sql`
--urls (up)
ALTER TABLE
  version_commit
ALTER COLUMN
  url
TYPE
  TEXT;

ALTER TABLE
  projects
ALTER COLUMN
  build_url
TYPE
  TEXT;

ALTER TABLE
  projects
ALTER COLUMN
  validation_url
TYPE
  TEXT;
`,
} satisfies MigrationExecutor;
