import { gql } from 'graphql-modules';

export default gql`
  extend type Query {
    lab(selector: TargetSelectorInput!): Lab
  }
  type Lab {
    schema: String!
    mocks: JSON
  }

  type PreflightScript {
    id: ID!
    sourceCode: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    # TODO: should I add this field?
    # createdBy: User!
  }

  input CreatePreflightScriptInput {
    sourceCode: String!
  }

  input UpdatePreflightScriptInput {
    id: ID!
    sourceCode: String!
  }

  extend type Mutation {
    createPreflightScript(
      selector: TargetSelectorInput!
      input: CreatePreflightScriptInput!
    ): PreflightScriptResult!
    updatePreflightScript(
      selector: TargetSelectorInput!
      input: UpdatePreflightScriptInput!
    ): PreflightScriptResult!
  }

  """
  @oneOf
  """
  type PreflightScriptResult {
    ok: PreflightScriptOk
    error: PreflightScriptError
  }

  type PreflightScriptOk {
    preflightScript: PreflightScript!
    updatedTarget: Target!
  }

  type PreflightScriptError implements Error {
    message: String!
  }

  extend type Target {
    preflightScript: PreflightScript
  }
`;
