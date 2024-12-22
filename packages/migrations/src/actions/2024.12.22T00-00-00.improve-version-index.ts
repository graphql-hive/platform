import { type MigrationExecutor } from '../pg-migrator';

export default {
  name: '2024.12.22T00-00-00.improve-version-index.ts',
  run: ({ sql }) => sql`
    CREATE INDEX idx_schema_log_action_created ON schema_log(action, created_at DESC);
    CREATE INDEX idx_schema_log_action_service ON schema_log(action, lower(service_name));
  `,
} satisfies MigrationExecutor;
