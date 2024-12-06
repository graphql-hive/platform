#!/usr/bin/env node --experimental-strip-types --no-warnings=ExperimentalWarning
import { globSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { printErrors, scanURLs, validateFiles, type DetectedError } from 'next-validate-link';

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
let validations = await validateFiles(files, { scanned });

const withoutFalsePositives = await Promise.all(
  validations.map(async ({ file, detected }) => {
    const filteredDetected: DetectedError[] = [];

    for (const error of detected) {
      let link = error[0];

      if (link.startsWith('./') || link.startsWith('../')) {
        // If there is a hash #id, we don't parse the file to find the heading,
        // just assume it exists and check if the file exists.
        link = link.split('#')[0];

        // relative links inside of JSX lose the .mdx extension
        if (!link.endsWith('.mdx')) {
          link = `${link}.mdx`;
        }

        const path = resolve(dirname(file), link);
        const stats = await stat(path).catch(() => false);

        if (stats) {
          // file exists, the error is a false positive
          continue;
        }
      }

      filteredDetected.push(error);
    }

    if (filteredDetected.length === 0) {
      return null;
    }

    return {
      file,
      detected: filteredDetected,
    };
  }),
);

const errors = withoutFalsePositives.filter(
  (validation): validation is NonNullable<typeof validation> => validation !== null,
);

printErrors(errors);

if (errors.length > 0) {
  process.exit(1);
}
