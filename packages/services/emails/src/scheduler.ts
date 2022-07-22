import * as Sentry from '@sentry/node';
import type { FastifyLoggerInstance } from '@hive/service-common';
import { Queue, QueueScheduler, Worker, Job } from 'bullmq';
import Redis, { Redis as RedisInstance } from 'ioredis';
import pTimeout from 'p-timeout';
import mjml2html from 'mjml';
import type { EmailInput } from './shapes';
import type { EmailProvider } from './providers';

const DAY_IN_SECONDS = 86_400;

export function createScheduler(config: {
  logger: FastifyLoggerInstance;
  redis: {
    host: string;
    port: number;
    password: string;
  };
  queueName: string;
  emailProvider: EmailProvider;
}) {
  let redisConnection: RedisInstance | null;
  let queue: Queue | null;
  let queueScheduler: QueueScheduler | null;
  let stopped = false;
  const logger = config.logger;

  function onError(source: string) {
    return (error: Error) => {
      logger.error(`onError called from source ${source}`, error);
      Sentry.captureException(error, {
        extra: {
          error,
          source,
        },
        level: 'error',
      });
    };
  }

  function onFailed(job: Job, error: Error) {
    logger.debug(`Job %s failed after %s attempts, reason: %s`, job.name, job.attemptsMade, job.failedReason);
    logger.error(error);
  }

  async function initQueueAndWorkers() {
    if (!redisConnection) {
      return;
    }

    const prefix = 'hive-emails';

    queueScheduler = new QueueScheduler(config.queueName, {
      prefix,
      connection: redisConnection,
      sharedConnection: true,
    });

    queue = new Queue(config.queueName, {
      prefix,
      connection: redisConnection,
      sharedConnection: true,
    });

    // Wait for Queues and Scheduler to be ready
    await Promise.all([queueScheduler.waitUntilReady(), queue.waitUntilReady()]);

    const worker = new Worker<EmailInput>(
      config.queueName,
      async job => {
        logger.info('Sending email to %s', job.data.email);
        const rendered = mjml2html(job.data.body, {
          minify: false,
          minifyOptions: undefined,
        });

        if (rendered.errors.length > 0) {
          throw new Error(rendered.errors.map(e => e.formattedMessage).join('\n'));
        }

        await config.emailProvider.send({
          to: job.data.email,
          subject: job.data.subject,
          body: rendered.html,
        });

        logger.info('Email sent');
      },
      {
        prefix,
        connection: redisConnection,
        sharedConnection: true,
      }
    );

    worker.on('error', onError('emailsWorker'));
    worker.on('failed', onFailed);

    // Wait for Workers
    await worker.waitUntilReady();

    logger.info('BullMQ started');
  }

  async function start() {
    redisConnection = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      retryStrategy(times) {
        return Math.min(times * 500, 2000);
      },
      reconnectOnError(error) {
        onError('redis:reconnectOnError')(error);
        return 1;
      },
      db: 0,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    redisConnection.on('error', err => {
      onError('redis:error')(err);
    });

    redisConnection.on('connect', () => {
      logger.info('Redis connection established');
    });

    redisConnection.on('ready', async () => {
      logger.info('Redis connection ready... creating queues and workers...');
      await initQueueAndWorkers();
    });

    redisConnection.on('close', () => {
      logger.info('Redis connection closed');
    });

    redisConnection.on('reconnecting', timeToReconnect => {
      logger.info('Redis reconnecting in %s', timeToReconnect);
    });

    redisConnection.on('end', async () => {
      logger.info('Redis ended - no more reconnections will be made');
      await stop();
    });
  }

  async function stop() {
    logger.info('Started Usage shutdown...');

    stopped = true;

    logger.info('Clearing BullMQ...');
    try {
      queue?.removeAllListeners();
      queueScheduler?.removeAllListeners(),
        await pTimeout(Promise.all([queue?.close(), queueScheduler?.close()]), 5000, 'BullMQ close timeout');
    } catch (e) {
      logger.error('Failed to stop queues', e);
    } finally {
      queue = null;
      queueScheduler = null;
      logger.info('BullMQ stopped');
    }

    if (redisConnection) {
      logger.info('Stopping Redis...');

      try {
        redisConnection.disconnect(false);
      } catch (e) {
        logger.error('Failed to stop Redis connection', e);
      } finally {
        redisConnection = null;
        queue = null;
        logger.info('Redis stopped');
      }
    }

    logger.info('Exiting');
    process.exit(0);
  }

  async function schedule(email: EmailInput) {
    if (!queue) {
      throw new Error('Queue not initialized');
    }

    const jobName = email.id;

    return queue.add(jobName, email, {
      jobId: jobName,
      // We don't want to remove completed jobs, because it tells us that the job has been processed
      // and we avoid sending the same email twice.
      removeOnComplete: {
        // Let's keep the job longer than a full month, just in case :)
        age: DAY_IN_SECONDS * 32,
      },
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }

  return {
    schedule,
    start,
    stop,
    readiness() {
      if (stopped) {
        return false;
      }

      return queue !== null && redisConnection !== null && redisConnection?.status === 'ready';
    },
  };
}
