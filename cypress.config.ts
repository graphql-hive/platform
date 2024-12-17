import * as fs from 'node:fs';
// eslint-disable-next-line import/no-extraneous-dependencies -- cypress SHOULD be a dev dependency
import { defineConfig } from 'cypress';
import { initSeed } from './integration-tests/testkit/seed';

const isCI = Boolean(process.env.CI);

export type Token = {
  sAccessToken: string;
  sFrontToken: string;
  sRefreshToken: string;
};

export const seed = initSeed();

// TODO: Load these from actual env
process.env.SUPERTOKENS_CONNECTION_URI = 'http://127.0.0.1:3567';
process.env.SUPERTOKENS_API_KEY = 'wowverysecuremuchsecret';

export default defineConfig({
  video: isCI,
  screenshotOnRunFailure: isCI,
  defaultCommandTimeout: 15_000, // sometimes the app takes longer to load, especially in the CI
  retries: 2,
  e2e: {
    setupNodeEvents(on) {
      on('task', {
        async seedTarget() {
          const owner = await seed.createOwner();
          const org = await owner.createOrg();
          const project = await org.createProject();
          const slug = `${org.organization.slug}/${project.project.slug}/${project.target.slug}`;
          return {
            slug,
            refreshToken: owner.ownerRefreshToken,
            email: owner.ownerEmail,
          };
        },
      });

      on('after:spec', (_, results) => {
        if (results && results.video) {
          // Do we have failures for any retry attempts?
          const failures = results.tests.some(test =>
            test.attempts.some(attempt => attempt.state === 'failed'),
          );
          if (!failures) {
            // delete the video if the spec passed and no tests retried
            fs.unlinkSync(results.video);
          }
        }
      });
    },
  },
});
