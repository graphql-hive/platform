# Testing

## Unit Tests

We are using Vitest.

Simply run `pnpm test` to run all the tests locally.

## Integration Tests

We are using Vitest to test the following concerns:

1. Main application flows and integration of different services
2. Containerize execution of all services
3. Cross-service network calls

Integration tests are based pre-built Docker images, so you can run it in 2 modes:

#### Running from built artifact (Docker)

**To run integration tests locally with a built artifact, you need to build a Docker image for the
services. **

Use `pnpm integration:prepare` command to set up the complete environment from locally running
integration tests.

And then, to run the tests, use the following:

```
pnpm test:integration
```

> Make sure to run the prepare command every time you change your code.

#### Running from source code (local services)

You can also run integration tests against the local-running services, during development.

To do so, use the following instructions:

1. Run Hive from VSCode (using `Start Hive` button).
2. Make sure all services are running correctly.
3. Run integration tests with `pnpm dev:integration` command (from root directory).

#### Running from Pre-Built Docker Image

To run integration tests locally, from the pre-build Docker image, follow:

1. Install all deps: `pnpm i`
2. Generate types: `pnpm graphql:generate`
3. Build only addition, local CF Workers source code, by running:
   `pnpm --filter integration-tests prepare:env`
4. Decide on the commit ID / Docker image tag you would like to use (make sure `build-and-dockerize`
   is done successfully)
5. Set the needed env vars, and use Docker Compose to run all local services:

   ```bash
   export DOCKER_REGISTRY="ghcr.io/graphql-hive/"
   export DOCKER_TAG=":IMAGE_TAG_HERE"
   
   docker compose -f ./docker/docker-compose.community.yml -f ./integration-tests/docker-compose.integration.yaml --env-file ./integration-tests/.env up -d --wait
   ```

6. Run the tests: `pnpm --filter integration-tests test:integration`

## E2E Tests

e2e Tests are based on Cypress, and matches files that ends with `.cy.ts`. The tests flow runs from
a pre-build Docker image.

#### Running on built Docker images from source code

To run e2e tests locally, from the local source code, follow:

1. Make sure you have Docker installed. If you are having issues, try to run `docker system prune`
   to clean the Docker caches.
2. Install all deps: `pnpm i`
3. Move into the `cypress` folder (`cd cypress`)
4. Run `./local.sh` for building the project and starting the Docker containers
5. Follow the output instruction from the script for starting the tests

#### Running from pre-built Docker image

To run integration tests locally, from the pre-build Docker image, follow:

1. Make sure you have Docker installed. If you are having issues, try to run `docker system prune`
   to clean the Docker caches.
2. Install all deps: `pnpm i`
3. Generate types: `pnpm graphql:generate`
4. Build source code: `pnpm build`
5. Decide on the commit ID / Docker image tag you would like to use and set it as env var:
   ```bash
   export DOCKER_REGISTRY="ghcr.io/graphql-hive/"
   export DOCKER_TAG=":IMAGE_TAG_HERE"
   ```
6. Run the e2e environment, by running:
   ```
   docker compose \
     -f ./docker/docker-compose.community.yml \
     -f ./docker/docker-compose.end2end.yml \
     --env-file ./integration-tests/.env \
     up -d --wait
   ```
7. Run Cypress: `pnpm test:e2e`

#### Docker Compose Configuration

Keep in mind that integration tests are running a combination of 2 Docker Compose files:

1. `docker-compose.community.yml` - this is also used for self-hosting Hive, so this file contains
   all services and configurations needed for running Hive core (without Cloud-specific services,
   like billing).
2. `docker-compose.integration.yaml` - An extension and overrides file: we are using that file to
   run local services such as CloudFlare CDN mock, external composition service and so on - this is
   done in order to mock a complete Hive Cloud environment and test all features. **This file also
   includes overrides such as environment variables that are specific only for integration testing -
   so make sure to choose wisely where to add environment variables!**

## Troubleshoot

If you are having issues with running Docker images, follow these instructions:

1. Make sure you have the latest Docker installed.
2. Make sure no containers are running (`docker ps` and then `docker stop CONTAINER_ID`).
3. Delete the local volume used for testing, it's located under `.hive` directory.
4. Try to run `docker system prune` to clean all the Docker images, containers, networks and caches.
