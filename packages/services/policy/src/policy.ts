import Ajv from 'ajv';
import { Linter } from 'eslint';
import { z, ZodType } from 'zod';
import { GraphQLESLintRule, parser, rules } from '@graphql-eslint/eslint-plugin/programmatic';
import { RELEVANT_RULES } from './rules';

const ajv = new Ajv({
  meta: false,
  useDefaults: true,
  validateSchema: false,
  verbose: true,
  allowMatchingProperties: true,
});
const linter = new Linter();

const RULE_LEVEL = z.union([
  //
  z.number().min(0).max(2),
  z.enum(['off', 'warn', 'error']),
]);

type RuleMapValidationType = {
  [RuleKey in keyof typeof rules]: ZodType;
};

export function normalizeAjvSchema(
  schema: NonNullable<GraphQLESLintRule['meta']>['schema'],
): NonNullable<GraphQLESLintRule['meta']>['schema'] {
  if (Array.isArray(schema)) {
    if (schema.length === 0) {
      return;
    }

    return {
      type: 'array',
      items: schema,
      minItems: 0,
      maxItems: schema.length,
    };
  }

  return schema;
}

export function createInputValidationSchema() {
  return z
    .object(
      RELEVANT_RULES.reduce((acc, [name, rule]) => {
        const schema = normalizeAjvSchema(rule.meta!.schema);
        const validate = schema ? ajv.compile(schema) : null;

        return {
          ...acc,
          [name]: z.union([
            z.tuple([RULE_LEVEL]),
            z.tuple(
              validate
                ? [
                    RULE_LEVEL,
                    z.custom(data => {
                      const asArray = (Array.isArray(data) ? data : [data]).filter(Boolean);
                      const result = validate(asArray);

                      if (result) {
                        return true;
                      }

                      throw new Error(
                        `Failed to validate rule "${name}" configuration: ${ajv.errorsText(
                          validate.errors,
                        )}`,
                      );
                    }),
                  ]
                : [RULE_LEVEL],
            ),
          ]),
        };
      }, {} as RuleMapValidationType),
    )
    .required()
    .partial()
    .strict('Unknown rule name passed');
}

export type PolicyConfigurationObject = z.infer<ReturnType<typeof createInputValidationSchema>>;

export async function schemaPolicyCheck(input: {
  source: string;
  schema: string;
  policy: PolicyConfigurationObject;
}) {
  return linter.verify(
    input.source,
    {
      files: ['*.graphql'],
      plugins: {
        '@graphql-eslint': { rules },
      },
      languageOptions: {
        parser,
        parserOptions: {
          graphQLConfig: {
            schema: input.schema,
          },
        },
      },
      rules: input.policy,
    },
    'schema.graphql',
  );
}
