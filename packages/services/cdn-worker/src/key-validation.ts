import { Response, Request } from '@whatwg-node/fetch';
import bcrypt from 'bcryptjs';
import { AwsClient } from 'packages/services/api/src/shared/aws';

export type KeyValidator = (targetId: string, headerKey: string) => Promise<boolean>;

type CreateKeyValidatorDeps = {
  keyData: string;
  s3: {
    endpoint: string;
    bucketName: string;
    client: AwsClient;
  };
  cache: Promise<Cache | null> | Cache | null;
};

export const createIsKeyValid =
  (deps: CreateKeyValidatorDeps): KeyValidator =>
  async (targetId: string, accessHeaderValue: string): Promise<boolean> => {
    const requestCache = await deps.cache;

    let cacheKey: null | Request = null;

    console.log('use cache', !!deps.cache);

    if (requestCache) {
      cacheKey = new Request('http://key-cache.graphql-hive.com/' + targetId, {
        method: 'GET',
      });
      const response = await requestCache.match(cacheKey);
      if (response) {
        console.log('use cache response');

        return (await response.text()) === '1';
      }
    }

    console.log('compute');

    const key = await deps.s3.client.fetch(
      [deps.s3.endpoint, deps.s3.bucketName, 'cdn-legacy-keys', targetId].join('/'),
      {
        method: 'GET',
      },
    );

    if (key.status !== 200) {
      return false;
    }

    const isValid = await bcrypt.compare(accessHeaderValue, await key.text());

    if (cacheKey && requestCache) {
      console.log('try caching');
      await requestCache.put(
        cacheKey,
        new Response(isValid ? '1' : '0', {
          status: 200,
          headers: {
            'Cache-Control': `s-maxage=${60 * 5}`,
          },
        }),
      );

      console.log('caching done caching');
    }

    console.log('all done');

    return isValid;
  };
