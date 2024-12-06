#!/usr/bin/env node --experimental-strip-types --no-warnings=ExperimentalWarning
import { globSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { printErrors, scanURLs, validateFiles } from 'next-validate-link';

const args = parseArgs({
  options: {
    cwd: { type: 'string', default: process.cwd() },
    files: { type: 'string', default: 'src/content/**/*.mdx' },
  },
});

process.chdir(args.values.cwd);
const files = globSync(args.values.files);

if (files.length === 0) {
  console.error('No files found. Please pass the --cwd or navigate to the proper directory.');
  process.exit(1);
}

const scanned = await scanURLs();
const errors = await validateFiles(files, { scanned });

printErrors(errors);
