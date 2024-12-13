---
'@graphql-hive/yoga': patch
---

Align with the latest yoga;

- Remove \`tiny-lru\` dependency, and use `createLruCache` from `graphql-yoga`
- Use Explicit Resource Management of GraphQL Yoga plugins for disposal which already respect Node.js process termination
- Use \`context.waitUntil\` which is handled by the environment automatically, if not `@whatwg-node/server` already takes care of it with above.
- Respect the given `fetchAPI` by GraphQL Yoga(might be Hive Gateway) for the `fetch` function
- Avoid using `async/await` for performance reasons, because in case of cache-hit, it returns synchronously
- Respect Yoga's \`logger\` for logging