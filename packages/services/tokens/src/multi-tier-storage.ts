import type { FastifyBaseLogger } from 'fastify';
import type { Redis } from 'ioredis';
import { LRUCache } from 'lru-cache';
import ms from 'ms';
import { createConnectionString, createTokenStorage, Interceptor, tokens } from '@hive/storage';
import { until, useActionTracker } from './helpers';
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

export async function createStorage(
  config: Parameters<typeof createConnectionString>[0],
  redis: Redis,
  logger: FastifyBaseLogger,
  additionalInterceptors: Interceptor[],
): Promise<Storage> {
  const tracker = useActionTracker();
  const connectionString = createConnectionString(config);
  const db = await createTokenStorage(connectionString, 5, additionalInterceptors.concat([{}]));
  const touch = tokenTouchScheduler(logger, async tokens => {
    try {
      await db.touchTokens({ tokens });
    } catch (error) {
      logger.error('Failed to touch tokens', error);
    }
  });
  const cache = new LRUCache<string, CacheEntry>({
    max: 1000,
    ttl: ms('5m'),
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
          logger.error('Failed to read token from Redis', error);
          return null;
        });
      } else {
        // TODO: what if redis is not ready? Should we call the DB or return null?
        logger.debug('Redis is not ready, skipping cache read');
      }

      if (redisData) {
        return JSON.parse(redisData) as CacheEntry;
      }

      // Nothing in Redis, let's check the DB
      const dbResult = await db.getToken({ token: hashedToken }).catch(error => {
        // If the DB is down, we log the error, and we throw exception.
        // This will cause the cache to return stale data.
        // This may have a performance impact (more calls to Db), but it won't break the system.
        logger.error('Failed to read token from the DB', error);
        return Promise.reject(error);
      });

      const cacheEntry = dbResult ? transformToken(dbResult) : 'not-found';

      // Write to Redis, so the next time we can read it from there
      await setInRedis(redis, hashedToken, cacheEntry).catch(error => {
        logger.error(
          'Failed to write token to Redis, but it was written to the in-memory cache',
          error,
        );
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
        logger.error('Failed to write token to Redis, but it was created in the DB', error);
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

const promisesInFlight = new Map<string, Promise<any>>();
function atomic<R>(fn: () => Promise<R>): () => Promise<R> {
  const uniqueString = Math.random().toString(36).slice(2) + Date.now().toString(36);

  return function atomicWrapper() {
    if (promisesInFlight.has(uniqueString)) {
      return promisesInFlight.get(uniqueString)!;
    }

    const promise = fn();
    promisesInFlight.set(uniqueString, promise);

    return promise.finally(() => {
      promisesInFlight.delete(uniqueString);
    });
  };
}

async function setInRedis(redis: Redis, hashedToken: string, cacheEntry: CacheEntry) {
  if (redis.status !== 'ready') {
    return;
  }

  const redisKey = generateRedisKey(hashedToken);
  await redis.setex(redisKey, ms('24h') / 1000, JSON.stringify(cacheEntry));
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
  }, ms('60s'));

  function dispose() {
    clearInterval(interval);
  }

  return {
    schedule,
    dispose,
  };
}
