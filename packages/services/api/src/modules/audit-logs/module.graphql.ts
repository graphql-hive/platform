import { gql } from 'graphql-modules';

export const typeDefs = gql`
  """
  AuditLog is a record of actions performed by users in
  the organization. It is used to track changes and
  actions performed by users.
  """
  interface AuditLog {
    id: ID!
    eventTime: DateTime!
    record: AuditLogIdRecord!
  }

  type AuditLogIdRecord {
    userId: ID!
    userEmail: String!
    organizationId: ID!
    """
    User can be null if the user is deleted
    """
    user: User
  }

  extend type Mutation {
    exportOrganizationAuditLog(
      selector: OrganizationSelectorInput!
      filter: AuditLogFilter!
    ): ExportOrganizationAuditLogResult!
  }

  input AuditLogFilter {
    startDate: DateTime!
    endDate: DateTime!
  }

  type AuditLogConnection {
    edges: [AuditLogEdge!]!
    pageInfo: AuditLogPageInfo!
  }

  type AuditLogEdge {
    node: AuditLog!
    cursor: String!
  }

  type AuditLogPageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type ExportOrganizationAuditLogError implements Error {
    message: String!
  }

  type ExportOrganizationAuditLogPayload {
    url: String!
  }

  type ExportOrganizationAuditLogResult {
    ok: ExportOrganizationAuditLogPayload
    error: ExportOrganizationAuditLogError
  }
`;
