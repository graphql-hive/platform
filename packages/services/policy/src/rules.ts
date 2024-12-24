import {
  GraphQLESLintRule,
  rules,
  type CategoryType,
} from '@graphql-eslint/eslint-plugin/programmatic';

type AllRulesType = typeof rules;
type RuleName = keyof AllRulesType;

const SKIPPED_RULES: RuleName[] = [
  // Skipped because in order to operate, it needs operations.
  // Also, it does not make sense to run it as part of a schema check.
  'no-unused-fields',
];

function isRelevantCategory(category: string): boolean {
  return (category as CategoryType).includes('schema');
}

// Some rules have configurations for operations (like "alphabetize") and we do not want to expose them.
function patchRulesConfig<T extends RuleName>(
  ruleName: T,
  ruleDef: AllRulesType[T],
): GraphQLESLintRule {
  const { schema } = ruleDef.meta as any;
  switch (ruleName) {
    case 'alphabetize': {
      // Remove operation-specific configurations
      delete schema.items.properties.selections;
      delete schema.items.properties.variables;
      break;
    }
    case 'naming-convention': {
      // Remove operation-specific configurations
      delete schema.items.properties.VariableDefinition;
      delete schema.items.properties.OperationDefinition;

      // Get rid of "definitions" references because it's breaking Monaco editor in the frontend
      Object.entries(schema.items.properties).forEach(([, propDef]) => {
        if (propDef && typeof propDef === 'object' && 'oneOf' in propDef) {
          propDef.oneOf = [schema.definitions.asObject, schema.definitions.asString];
        }
      });
      schema.items.patternProperties = {
        '^(Argument|DirectiveDefinition|EnumTypeDefinition|EnumValueDefinition|FieldDefinition|InputObjectTypeDefinition|InputValueDefinition|InterfaceTypeDefinition|ObjectTypeDefinition|ScalarTypeDefinition|UnionTypeDefinition)(.+)?$':
          {
            oneOf: [schema.definitions.asObject, schema.definitions.asString],
          },
      };
      delete schema.definitions;

      break;
    }
  }

  return ruleDef as GraphQLESLintRule;
}

// We are using only rules that are running on the schema (SDL) and not on operations.
// Also, we do not need to run GraphQL validation rules because they are already running as part of Hive
// Schema checks.
// Some rule are mixed (like "alphabetize") so we are patch and "hiding" some of their configurations.
export const RELEVANT_RULES = Object.entries(rules)
  .filter(
    ([ruleName, rule]) =>
      isRelevantCategory(rule.meta!.docs!.category!) &&
      rule.meta!.docs!.graphQLJSRuleName === undefined &&
      !SKIPPED_RULES.includes(ruleName as RuleName),
  )
  .map(
    ([ruleName, rule]) =>
      [ruleName, patchRulesConfig(ruleName as RuleName, rule)] as [RuleName, GraphQLESLintRule],
  );
