import { gql } from 'graphql-modules';

export const typeDefs = gql`
  type DocumentCollection {
    id: ID!
    name: String!
    description: String
    createdAt: DateTime!
    updatedAt: DateTime!
    createdBy: User!
    operations(first: Int, after: String): DocumentCollectionOperationsConnection!
  }

  type DocumentCollectionConnection {
    nodes: [DocumentCollection!]!
    total: Int!
  }

  type DocumentCollectionOperationsConnection {
    nodes: [DocumentCollectionOperation!]!
    total: Int!
  }

  type DocumentCollectionOperation {
    id: ID!
    name: String!
    query: String!
    variables: JSON
    headers: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
    collection: DocumentCollection!
  }

  input CreateDocumentCollectionInput {
    name: String!
    description: String
  }

  input UpdateDocumentCollectionInput {
    collectionId: ID!
    name: String!
    description: String
  }

  input CreateDocumentCollectionOperationInput {
    collectionId: ID!
    name: String!
    query: String!
    variables: JSON
    headers: JSON
  }

  input UpdateDocumentCollectionOperationInput {
    operationId: ID!
    collectionId: ID!
    name: String!
    query: String!
    variables: JSON
    headers: JSON
  }

  extend type Mutation {
    createOperationInDocumentCollection(
      selector: TargetSelectorInput!
      input: CreateDocumentCollectionOperationInput!
    ): ModifyDocumentCollectionOperationResult!
    updateOperationInDocumentCollection(
      selector: TargetSelectorInput!
      input: UpdateDocumentCollectionOperationInput!
    ): ModifyDocumentCollectionOperationResult!
    deleteOperationInDocumentCollection(
      selector: TargetSelectorInput!
      id: ID!
    ): DeleteDocumentCollectionOperationResult!

    createDocumentCollection(
      selector: TargetSelectorInput!
      input: CreateDocumentCollectionInput!
    ): ModifyDocumentCollectionResult!
    updateDocumentCollection(
      selector: TargetSelectorInput!
      input: UpdateDocumentCollectionInput!
    ): ModifyDocumentCollectionResult!
    deleteDocumentCollection(
      selector: TargetSelectorInput!
      id: ID!
    ): DeleteDocumentCollectionResult!
  }

  type ModifyDocumentCollectionError implements Error {
    message: String!
  }

  """
  @oneOf
  """
  type DeleteDocumentCollectionResult {
    ok: DeleteDocumentCollectionOkPayload
    error: ModifyDocumentCollectionError
  }

  type DeleteDocumentCollectionOkPayload {
    updatedTarget: Target!
    deletedId: ID!
  }

  """
  @oneOf
  """
  type DeleteDocumentCollectionOperationResult {
    ok: DeleteDocumentCollectionOperationOkPayload
    error: ModifyDocumentCollectionError
  }

  type DeleteDocumentCollectionOperationOkPayload {
    updatedTarget: Target!
    updatedCollection: DocumentCollection!
    deletedId: ID!
  }

  """
  @oneOf
  """
  type ModifyDocumentCollectionResult {
    ok: ModifyDocumentCollectionOkPayload
    error: ModifyDocumentCollectionError
  }

  type ModifyDocumentCollectionOkPayload {
    collection: DocumentCollection!
    updatedTarget: Target!
  }

  """
  @oneOf
  """
  type ModifyDocumentCollectionOperationResult {
    ok: ModifyDocumentCollectionOperationOkPayload
    error: ModifyDocumentCollectionError
  }

  type ModifyDocumentCollectionOperationOkPayload {
    operation: DocumentCollectionOperation!
    collection: DocumentCollection!
    updatedTarget: Target!
  }

  extend type Target {
    documentCollection(id: ID!): DocumentCollection!
    documentCollections: DocumentCollectionConnection!
    documentCollectionOperation(id: ID!): DocumentCollectionOperation!
  }
`;
