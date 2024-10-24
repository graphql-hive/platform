import {
  OrganizationAccessScope,
  ProjectAccessScope,
  TargetAccessScope,
} from '../providers/scopes';
import type { AuthorizationPolicyStatement } from './authz';

/** Transform the legacy access scopes to policy statements */
export function transformLegacyPolicies(
  args: {
    organizationId: string;
    targetId: string | null;
  },
  scopes: Array<OrganizationAccessScope | ProjectAccessScope | TargetAccessScope>,
): Array<AuthorizationPolicyStatement> {
  const policies: Array<AuthorizationPolicyStatement> = [];
  for (const scope of scopes) {
    switch (scope) {
      case OrganizationAccessScope.READ: {
        policies.push({
          effect: 'allow',
          action: ['support:manageTickets'],
          resource: [`hrn:${args.organizationId}:organization/${args.organizationId}`],
        });
        break;
      }
      case OrganizationAccessScope.SETTINGS: {
        policies.push({
          effect: 'allow',
          action: ['organization:updateSlug'],
          resource: [`hrn:${args.organizationId}:organization/${args.organizationId}`],
        });
        break;
      }
      case OrganizationAccessScope.INTEGRATIONS: {
        policies.push({
          effect: 'allow',
          action: ['oidc:modify', 'gitHubIntegration:modify', 'slackIntegration:modify'],
          resource: [`hrn:${args.organizationId}:organization/${args.organizationId}`],
        });
        break;
      }
      case ProjectAccessScope.ALERTS: {
        policies.push({
          effect: 'allow',
          action: ['alert:modify', 'alert:describe'],
          resource: [`hrn:${args.organizationId}:organization/${args.organizationId}`],
        });
        break;
      }
      case ProjectAccessScope.READ: {
        policies.push({
          effect: 'allow',
          action: ['project:describe'],
          resource: [`hrn:${args.organizationId}:organization/${args.organizationId}`],
        });
        break;
      }
      case TargetAccessScope.REGISTRY_READ: {
        policies.push({
          effect: 'allow',
          action: ['appDeployment:describe', 'schema:check'],
          resource: [
            args.targetId
              ? `hrn:${args.organizationId}:target/${args.targetId}`
              : `hrn:${args.organizationId}:organization/${args.organizationId}`,
          ],
        });
        break;
      }
      case TargetAccessScope.REGISTRY_WRITE: {
        policies.push({
          effect: 'allow',
          action: [
            'appDeployment:describe',
            'appDeployment:create',
            'appDeployment:publish',
            'appDeployment:retire',
            'cdnAccessToken:describe',
            'cdnAccessToken:create',
            'schema:publish',
            'schema:deleteService',
            'schema:check',
            'schema:approve',
          ],
          resource: [
            args.targetId
              ? `hrn:${args.organizationId}:target/${args.targetId}`
              : `hrn:${args.organizationId}:organization/${args.organizationId}`,
          ],
        });
        break;
      }
      case TargetAccessScope.TOKENS_READ: {
        policies.push({
          effect: 'allow',
          action: ['cdnAccessToken:describe', 'targetAccessToken:describe'],
          resource: [`hrn:${args.organizationId}:organization/${args.organizationId}`],
        });
        break;
      }
      case TargetAccessScope.TOKENS_WRITE: {
        policies.push({
          effect: 'allow',
          action: [
            'targetAccessToken:create',
            'targetAccessToken:delete',
            'targetAccessToken:describe',
            'cdnAccessToken:create',
            'cdnAccessToken:delete',
            'cdnAccessToken:describe',
          ],
          resource: [`hrn:${args.organizationId}:organization/${args.organizationId}`],
        });
        break;
      }
      case TargetAccessScope.SETTINGS: {
        policies.push({
          effect: 'allow',
          action: ['schemaContract:create', 'schemaContract:disable', 'schemaContract:describe'],
          resource: [`hrn:${args.organizationId}:organization/${args.organizationId}`],
        });

        break;
      }
    }
  }

  return policies;
}
