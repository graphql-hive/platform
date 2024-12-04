import { ProjectType } from 'testkit/gql/graphql';
import { initSeed } from '../../../testkit/seed';

describe('Preflight Script', () => {
  describe.only('CRUD', () => {
    it.concurrent('Create and update a Preflight Script', async () => {
      const { createDocumentCollection, updateDocumentCollection } =
        await initSeed()
          .createOwner()
          .then(r => r.createOrg())
          .then(r => r.createProject(ProjectType.Single));

      // Create a preflight script


      // const createDocumentCollectionResult = await createDocumentCollection({
      //   name: 'My Collection',
      //   description: 'My favorite queries',
      // });
      // expect(createDocumentCollectionResult.error).toBeNull();
      // expect(createDocumentCollectionResult.ok?.collection.id).toBeDefined();
      // expect(
      //   createDocumentCollectionResult.ok?.updatedTarget.documentCollections.edges.length,
      // ).toBe(1);

      // Update the collection
      // const updateDocumentCollectionResult = await updateDocumentCollection({
      //   collectionId: createDocumentCollectionResult.ok?.collection.id!,
      //   name: 'Best Queries #3',
      //   description: 'My favorite queries updated',
      // });
      // expect(updateDocumentCollectionResult.error).toBeNull();
      // expect(updateDocumentCollectionResult.ok?.collection.id).toBeDefined();
      // expect(updateDocumentCollectionResult.ok?.collection.name).toBe('Best Queries #3');
      // expect(updateDocumentCollectionResult.ok?.collection.description).toBe(
      //   'My favorite queries updated',
      // );
      // expect(
      //   updateDocumentCollectionResult.ok?.updatedTarget.documentCollections.edges.length,
      // ).toBe(1);
    });

    describe('Permissions Check', () => {
      it('Prevent creating collection without the write permission to the target', async () => {
        const { createDocumentCollection, createTargetAccessToken } = await initSeed()
          .createOwner()
          .then(r => r.createOrg())
          .then(r => r.createProject(ProjectType.Single));
        const { secret: readOnlyToken } = await createTargetAccessToken({
          mode: 'readOnly',
        });

        // Create a collection
        await expect(
          createDocumentCollection({
            name: 'My Collection',
            description: 'My favorite queries',
            token: readOnlyToken,
          }),
        ).rejects.toEqual(
          expect.objectContaining({
            message: expect.stringContaining(
              `No access (reason: "Missing permission for performing 'laboratory:modify' on resource")`,
            ),
          }),
        );
      });

      it('Prevent updating collection without the write permission to the target', async () => {
        const { createDocumentCollection, updateDocumentCollection, createTargetAccessToken } =
          await initSeed()
            .createOwner()
            .then(r => r.createOrg())
            .then(r => r.createProject(ProjectType.Single));

        const createResult = await createDocumentCollection({
          name: 'My Collection',
          description: 'My favorite queries',
        });

        const { secret: readOnlyToken } = await createTargetAccessToken({
          mode: 'readOnly',
        });

        await expect(
          updateDocumentCollection({
            collectionId: createResult.ok?.collection.id!,
            token: readOnlyToken,
            name: 'My Collection',
            description: 'My favorite queries',
          }),
        ).rejects.toEqual(
          expect.objectContaining({
            message: expect.stringContaining(
              `No access (reason: "Missing permission for performing 'laboratory:modify' on resource")`,
            ),
          }),
        );
      });
    });
  });
});
