#!/usr/bin/env node
import 'reflect-metadata';
import * as Sentry from '@sentry/node';
import { createServer, startMetrics, ensureEnv, registerShutdown } from '@hive/service-common';
import { createRateLimiter } from './limiter';
import { createConnectionString } from '@hive/storage';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify/dist/trpc-server-adapters-fastify.cjs.js';
import { rateLimitApiRouter } from './api';

const LIMIT_CACHE_UPDATE_INTERVAL_MS = process.env.LIMIT_CACHE_UPDATE_INTERVAL_MS
  ? parseInt(process.env.LIMIT_CACHE_UPDATE_INTERVAL_MS as string)
  : 1 * 60_000; // default is every 1m

async function main() {
  Sentry.init({
    serverName: 'rate-limit',
    enabled: process.env.ENVIRONMENT === 'prod',
    environment: process.env.ENVIRONMENT,
    dsn: process.env.SENTRY_DSN,
    release: process.env.RELEASE || 'local',
  });

  const server = createServer({
    name: 'rate-limit',
    tracing: false,
  });

  try {
    const ctx = createRateLimiter({
      logger: server.log,
      rateLimitConfig: {
        interval: LIMIT_CACHE_UPDATE_INTERVAL_MS,
      },
      rateEstimator: {
        endpoint: ensureEnv('USAGE_ESTIMATOR_ENDPOINT', 'string'),
      },
      storage: {
        connectionString: createConnectionString(process.env as any),
      },
    });

    server.register(fastifyTRPCPlugin, {
      prefix: '/trpc',
      trpcOptions: {
        router: rateLimitApiRouter,
        createContext: () => ctx,
      },
    });

    registerShutdown({
      logger: server.log,
      async onShutdown() {
        await Promise.all([stop(), server.close()]);
      },
    });

    const port = process.env.PORT || 5000;

    server.route({
      method: ['GET', 'HEAD'],
      url: '/_health',
      handler(_, res) {
        res.status(200).send();
      },
    });

    server.route({
      method: ['GET', 'HEAD'],
      url: '/_readiness',
      handler(_, res) {
        res.status(ctx.readiness() ? 200 : 400).send();
      },
    });

    if (process.env.METRICS_ENABLED === 'true') {
      await startMetrics();
    }
    await server.listen(port, '0.0.0.0');
    await ctx.start();
  } catch (error) {
    server.log.fatal(error);
    Sentry.captureException(error, {
      level: Sentry.Severity.Fatal,
    });
  }
}

main().catch(err => {
  Sentry.captureException(err, {
    level: Sentry.Severity.Fatal,
  });
  console.error(err);
  process.exit(1);
});
