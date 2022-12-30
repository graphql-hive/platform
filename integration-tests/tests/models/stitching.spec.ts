import { ProjectType } from '@app/gql/graphql';
import { createCLI } from '../../testkit/cli';
import { prepareProject } from '../../testkit/registry-models';

describe('publish', () => {
  test.concurrent('accepted: composable', async () => {
    const { publish } = await prepare();
    await publish({
      sdl: `type Query { topProductName: String }`,
      serviceName: 'products',
      serviceUrl: 'http://products:3000/graphql',
      expect: 'latest-composable',
    });
  });

  test.concurrent('accepted: composable, breaking changes', async () => {
    const { publish } = await prepare();
    await publish({
      sdl: /* GraphQL */ `
        type Query {
          topProductName: String
        }
      `,
      serviceName: 'products',
      serviceUrl: 'http://products:3000/graphql',
      expect: 'latest-composable',
    });

    await publish({
      sdl: /* GraphQL */ `
        type Query {
          nooooo: String
        }
      `,
      serviceName: 'products',
      serviceUrl: 'http://products:3000/graphql',
      expect: 'latest-composable',
    });
  });

  test.concurrent('rejected: not composable (build errors)', async () => {
    const { publish } = await prepare();
    await publish({
      sdl: /* GraphQL */ `
        type Query {
          topProductName: UnknownType
        }
      `,
      serviceName: 'products',
      serviceUrl: 'http://products:3000/graphql',
      expect: 'rejected',
    });
  });

  test.concurrent('accepted: composable, previous version was not', async () => {
    const { publish } = await prepare();

    // non-composable
    await publish({
      sdl: /* GraphQL */ `
        type Query {
          product(id: ID!): Product
        }

        type Product @key(selectionSet: "{ id") {
          id: ID!
          name: String
        }
      `,
      serviceName: 'products',
      serviceUrl: 'http://products:3000/graphql',
      expect: 'latest',
    });

    // composable
    await publish({
      sdl: /* GraphQL */ `
        type Query {
          product(id: ID!): Product
        }

        type Product @key(selectionSet: "{ id }") {
          id: ID!
          name: String
        }
      `,
      serviceName: 'products',
      serviceUrl: 'http://products:3000/graphql',
      expect: 'latest-composable',
    });
  });

  test.concurrent('accepted: composable, no changes', async () => {
    const { publish } = await prepare();

    // composable
    await publish({
      sdl: /* GraphQL */ `
        type Query {
          topProduct: String
        }
      `,
      serviceName: 'products',
      serviceUrl: 'http://products:3000/graphql',
      expect: 'latest-composable',
    });

    // composable but no changes
    await publish({
      sdl: /* GraphQL */ `
        type Query {
          topProduct: String
        }
      `,
      serviceName: 'products',
      serviceUrl: 'http://products:3000/graphql',
      expect: 'ignored',
    });
  });

  test.concurrent('accepted: composable, new url', async () => {
    const { publish } = await prepare();

    // composable
    await publish({
      sdl: /* GraphQL */ `
        type Query {
          topProduct: String
        }
      `,
      serviceName: 'products',
      serviceUrl: 'http://products:3000/graphql',
      expect: 'latest-composable',
    });

    // composable, no changes, only url is different
    await publish({
      sdl: /* GraphQL */ `
        type Query {
          topProduct: String
        }
      `,
      serviceName: 'products',
      serviceUrl: 'http://products:4321/graphql', // new url
      expect: 'latest-composable',
    });
  });

  test.concurrent('rejected: missing service name', async () => {
    const { publish } = await prepare();

    // composable
    await publish({
      sdl: /* GraphQL */ `
        type Query {
          topProduct: String
        }
      `,
      serviceUrl: 'http://products:3000/graphql',
      expect: 'rejected',
    });
  });

  test.concurrent('rejected: missing service url', async () => {
    const { publish } = await prepare();

    // composable
    await publish({
      sdl: /* GraphQL */ `
        type Query {
          topProduct: String
        }
      `,
      serviceName: 'products',
      expect: 'rejected',
    });
  });
});

describe('check', () => {
  test.concurrent('accepted: composable, no breaking changes', async () => {
    const { publish, check } = await prepare();

    await publish({
      sdl: /* GraphQL */ `
        type Query {
          topProduct: String
        }
      `,
      serviceName: 'products',
      serviceUrl: 'http://products:3000/graphql',
      expect: 'latest-composable',
    });

    const message = await check({
      sdl: /* GraphQL */ `
        type Query {
          topProduct: String
          topProductName: String
        }
      `,
      serviceName: 'products',
      expect: 'approved',
    });

    expect(message).toMatch('topProductName');
  });

  test.concurrent('accepted: composable, previous version was not', async () => {
    const { publish, check } = await prepare();

    await publish({
      sdl: /* GraphQL */ `
        type Query {
          product(id: ID!): Product
        }

        type Product @key(selectionSet: "{ id") {
          id: ID!
          name: String
        }
      `,
      serviceName: 'products',
      serviceUrl: 'http://products:3000/graphql',
      expect: 'latest',
    });

    const message = await check({
      sdl: /* GraphQL */ `
        type Query {
          product(id: ID!): Product
        }

        type Product @key(selectionSet: "{ id }") {
          id: ID!
          name: String
        }
      `,
      serviceName: 'products',
      expect: 'approved',
    });

    expect(message).toMatch('No changes');
  });

  test.concurrent('accepted: no changes', async () => {
    const { publish, check } = await prepare();

    await publish({
      sdl: /* GraphQL */ `
        type Query {
          topProduct: String
        }
      `,
      serviceName: 'products',
      serviceUrl: 'http://products:3000/graphql',
      expect: 'latest-composable',
    });

    await check({
      sdl: /* GraphQL */ `
        type Query {
          topProduct: String
        }
      `,
      serviceName: 'products',
      expect: 'approved',
    });
  });

  test.concurrent('rejected: missing service name', async () => {
    const { check } = await prepare();

    const message = await check({
      sdl: /* GraphQL */ `
        type Query {
          topProduct: String
        }
      `,
      expect: 'rejected',
    });

    expect(message).toMatch('name');
  });

  test.concurrent('rejected: composable, breaking changes', async () => {
    const { publish, check } = await prepare();

    await publish({
      sdl: /* GraphQL */ `
        type Query {
          topProduct: String
        }
      `,
      serviceName: 'products',
      serviceUrl: 'http://products:3000/graphql',
      expect: 'latest-composable',
    });

    const message = await check({
      sdl: /* GraphQL */ `
        type Query {
          topProductName: String
        }
      `,
      serviceName: 'products',
      expect: 'rejected',
    });

    expect(message).toMatch('removed');
  });

  test.concurrent('rejected: not composable, no breaking changes', async () => {
    const { publish, check } = await prepare();

    await publish({
      sdl: /* GraphQL */ `
        type Query {
          topProduct: String
        }
      `,
      serviceName: 'products',
      serviceUrl: 'http://products:3000/graphql',
      expect: 'latest-composable',
    });

    const message = await check({
      sdl: /* GraphQL */ `
        type Query {
          topProduct: String
          topProductName: Strin
        }
      `,
      serviceName: 'products',
      expect: 'rejected',
    });

    expect(message).toMatch('Str');
  });

  test.concurrent('rejected: not composable, breaking changes', async () => {
    const { publish, check } = await prepare();

    await publish({
      sdl: /* GraphQL */ `
        type Query {
          topProduct: Product
        }

        type Product @key(selectionSet: "{ id }") {
          id: ID!
          name: String
        }
      `,
      serviceName: 'products',
      serviceUrl: 'http://products:3000/graphql',
      expect: 'latest-composable',
    });

    const message = await check({
      sdl: /* GraphQL */ `
        type Query {
          product(id: ID!): Product
        }

        type Product @key(selectionSet: "{ id") {
          id: ID!
          name: String
        }
      `,
      serviceName: 'products',
      expect: 'rejected',
    });

    expect(message).toMatch('topProduct');
    expect(message).toMatch('Expected Name');
  });
});

async function prepare() {
  const {
    tokens: { registry: token },
  } = await prepareProject(ProjectType.Stitching);

  return createCLI(token);
}
