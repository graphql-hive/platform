import type { FastifyBaseLogger } from 'fastify';
import type { Redis } from 'ioredis';
import { LRUCache } from 'lru-cache';
import ms from 'ms';
import { createConnectionString, createTokenStorage, Interceptor, tokens } from '@hive/storage';
import { captureException, captureMessage } from '@sentry/node';
import { atomic, until, useActionTracker } from './helpers';
import { cacheHits, cacheInvalidations, cacheMisses } from './metrics';

type CacheEntry = StorageItem | 'not-found';

interface StorageItem {
  token: string;
  name: string;
  tokenAlias: string;
  date: string;
  lastUsedAt: string;
  organization: string;
  project: string;
  target: string;
  scopes: readonly string[];
}

export interface Storage {
  close(): Promise<void>;
  isReady(): Promise<boolean>;
  readTarget(targetId: string): Promise<StorageItem[]>;
  readToken(hashedToken: string): Promise<StorageItem | null>;
  writeToken(item: Omit<StorageItem, 'date' | 'lastUsedAt'>): Promise<StorageItem>;
  deleteToken(hashedToken: string): Promise<void>;
  invalidateTokens(hashedTokens: string[]): Promise<void>;
}

const cacheConfig = {
  inMemory: {
    maxEntries: 1000,
    ttlInMs: ms('5m'),
  },
  redis: {
    ttlInMs: ms('24h') / 1000,
  },
  tokenTouchIntervalInMs: ms('60s'),
} as const;

export async function createStorage(
  config: Parameters<typeof createConnectionString>[0],
  redis: Redis,
  logger: FastifyBaseLogger,
  additionalInterceptors: Interceptor[],
): Promise<Storage> {
  const tracker = useActionTracker();
  const connectionString = createConnectionString(config);
  const db = await createTokenStorage(connectionString, 5, additionalInterceptors);
  const touch = tokenTouchScheduler(logger, async tokens => {
    try {
      await db.touchTokens({ tokens });
    } catch (error) {
      logger.error('Failed to touch tokens', error);
    }
  });
  const cache = new LRUCache<string, CacheEntry>({
    max: cacheConfig.inMemory.maxEntries,
    ttl: cacheConfig.inMemory.ttlInMs,
    // Allow to return stale data if the fetchMethod is slow
    allowStale: false,
    // Don't delete the cache entry if the fetchMethod fails
    noDeleteOnFetchRejection: true,
    // Allow to return stale data if the fetchMethod fails.
    // The rejection reason won't be logged though.
    allowStaleOnFetchRejection: true,
    // If a cache entry is stale or missing, this method is called
    // to fill the cache with fresh data.
    // This method is called only once per cache key,
    // even if multiple requests are waiting for it.
    async fetchMethod(hashedToken) {
      // Nothing fresh in the in-memory cache, let's check Redis
      let redisData: string | null = null;

      if (redis.status === 'ready') {
        redisData = await redis.get(hashedToken).catch(error => {
          handleStorageError({
            logger,
            error,
            logMsg: 'Failed to read token from Redis',
            tier: 'redis',
            action: 'fetch',
          });
          return null;
        });
      } else {
        // If redis is not ready, we fallback to the Db.
        // This will put more load on the Db, but it won't break the usage reporting.
        // It's a temporary state, as fetched value will be written to in-memory cache,
        // and to Redis - when it's back online.
        logger.warn('Redis is not ready, falling back to Db');
        captureMessage('Redis was not available as secondary cache', 'warning');
      }

      if (redisData) {
        return JSON.parse(redisData) as CacheEntry;
      }

      // Nothing in Redis, let's check the DB
      const dbResult = await db.getToken({ token: hashedToken }).catch(error => {
        // If the DB is down, we log the error, and we throw exception.
        // This will cause the cache to return stale data.
        // This may have a performance impact (more calls to Db), but it won't break the system.
        handleStorageError({
          logger,
          error,
          logMsg: 'Failed to read token from the Db',
          tier: 'db',
          action: 'fetch',
        });
        return Promise.reject(error);
      });

      const cacheEntry = dbResult ? transformToken(dbResult) : 'not-found';

      // Write to Redis, so the next time we can read it from there
      await setInRedis(redis, hashedToken, cacheEntry).catch(error => {
        handleStorageError({
          logger,
          error,
          logMsg: 'Failed to write token to Redis, but it was written to the in-memory cache',
          tier: 'redis',
          action: 'set',
        });
      });

      return cacheEntry;
    },
  });

  return {
    async close() {
      // Wait for all the pending operations to finish
      await until(tracker.idle, 10_000).catch(error => {
        logger.error('Failed to wait for tokens being idle', error);
      });
      await db.destroy();
      // Wait for Redis to finish all the pending operations
      await redis.quit();
      touch.dispose();
    },
    isReady: atomic(async () => {
      if (redis.status === 'ready' || redis.status === 'reconnecting') {
        return db.isReady();
      }
      return false;
    }),
    async readTarget(target) {
      const tokens = await db.getTokens({ target });
      return tokens.map(transformToken);
    },
    async readToken(hashedToken) {
      const data = await cache.fetch(hashedToken);

      if (!data) {
        // Looked up in all layers, and the token is not found
        return null;
      }

      if (data === 'not-found') {
        return null;
      }

      touch.schedule(hashedToken);
      return data;
    },
    writeToken: tracker.wrap(async item => {
      const result = await db.createToken(item);

      // We don't want to write to in-memory cache,
      // as the token may not be used immediately, or at all.
      // We write to Redis, so in case the token is used,
      // we reuse it for the in-memory cache, without hitting the DB.
      const hashedToken = result.token;
      const cacheEntry = transformToken(result);

      // Write to Redis gracefully. If it fails, we log the error, but we don't throw.
      // The token won't be in Redis cache, but it will be possible to retrieve it from the DB.
      // It will affect performance slightly, but it won't break the system.
      try {
        await setInRedis(redis, hashedToken, cacheEntry);
      } catch (error) {
        handleStorageError({
          logger,
          error,
          logMsg: 'Failed to write token to Redis, but it was created in the Db',
          tier: 'redis',
          action: 'set',
        });
      }

      return cacheEntry;
    }),
    deleteToken: tracker.wrap(async hashedToken => {
      await db.deleteToken({
        token: hashedToken,
        async postDeletionTransaction() {
          // delete from Redis when the token is deleted from the DB
          await redis.del(generateRedisKey(hashedToken));
          // only then delete from the in-memory cache.
          // The other replicas will purge the token from
          // their own in-memory caches on their own pace (ttl)
          cache.delete(hashedToken);
        },
      });
    }),
    invalidateTokens: tracker.wrap(async hashedTokens => {
      if (hashedTokens.length === 0) {
        return;
      }

      cacheInvalidations.inc();

      await redis.del(hashedTokens.map(generateRedisKey));
      for (const hashedToken of hashedTokens) {
        cache.delete(hashedToken);
      }
    }),
  };
}

function transformToken(item: tokens): StorageItem {
  return {
    token: item.token,
    tokenAlias: item.token_alias,
    name: item.name,
    date: item.created_at as any,
    lastUsedAt: item.last_used_at as any,
    organization: item.organization_id,
    project: item.project_id,
    target: item.target_id,
    scopes: item.scopes || [],
  };
}

function generateRedisKey(hashedToken: string) {
  // bump the version when the cache format changes
  return `tokens:cache:v2:${hashedToken}`;
}

async function setInRedis(redis: Redis, hashedToken: string, cacheEntry: CacheEntry) {
  if (redis.status !== 'ready') {
    return;
  }

  const redisKey = generateRedisKey(hashedToken);
  await redis.setex(
    redisKey,
    Math.ceil(cacheConfig.redis.ttlInMs / 1000),
    JSON.stringify(cacheEntry),
  );
}

function tokenTouchScheduler(
  logger: FastifyBaseLogger,
  onTouch: (tokens: Array<{ token: string; date: Date }>) => Promise<void>,
) {
  const scheduledTokens = new Map<string, Date>();

  /**
   * Mark token as used
   */
  function schedule(hashedToken: string): void {
    const now = new Date();
    scheduledTokens.set(hashedToken, now);
  }

  const interval = setInterval(() => {
    if (!scheduledTokens.size) {
      return;
    }

    const tokens = Array.from(scheduledTokens.entries()).map(([token, date]) => ({
      token,
      date,
    }));
    scheduledTokens.clear();

    logger.debug(`Touch ${tokens.length} tokens`);
    void onTouch(tokens);
  }, cacheConfig.tokenTouchIntervalInMs);

  function dispose() {
    clearInterval(interval);
  }

  return {
    schedule,
    dispose,
  };
}

async function handleStorageError(params: {
  logger: FastifyBaseLogger;
  error: unknown;
  logMsg: string;
  tier: 'redis' | 'db';
  action: 'fetch' | 'set';
}) {
  params.logger.error(params.logMsg, params.error);
  captureException(params.error, {
    tags: {
      storageTier: params.tier,
      storageAction: params.action,
    },
  });
}