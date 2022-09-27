#!/usr/bin/env node
import url from 'node:url';
import path from 'node:path';
import { SlonikMigrator } from '@slonik/migrator';
import { createPool } from 'slonik';
import { env } from '../src/environment';
import { migrateClickHouse } from './clickhouse';
import { createConnectionString } from '../src/db';

const [, , cmd] = process.argv;
const slonik = await createPool(createConnectionString(env.postgres));

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const actionsDirectory = __dirname + path.sep + 'actions';
console.log('Actions in:', actionsDirectory);

const migrator = new SlonikMigrator({
  migrationsPath: actionsDirectory,
  slonik,
  migrationTableName: 'migration',
  logger: console,
});

// Why? We don't want to run the 'create' and 'down' commands programmatically, it should run from CLI.
const isCreateCommand = cmd === 'create';
const isDownCommand = cmd === 'down';

// This is used by production build of this package.
// We are building a "cli" out of the package, so we need a workaround to pass the command to run.
 
if (env.isMigrator && !isCreateCommand && !isDownCommand) {
  console.log('Running the UP migrations');

  try {
    await migrator.up();
    await migrateClickHouse(env.isClickHouseMigrator);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

if (import.meta.url === url.pathToFileURL(process.argv[1]).href || require.main === module) {
  console.log('Running as a CLI');
  await migrator.runAsCLI();
}
