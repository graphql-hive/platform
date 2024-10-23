import {
  OrganizationAccessScope,
  ProjectAccessScope,
  TargetAccessScope,
} from '../providers/scopes';
import type { AuthorizationPolicyStatement } from './authz';

/** Transform the legacy access scopes to policy statements */
export function transformLegacyPolicies(
  organizationId: string,
  projectId: string,
  targetId: string,
  scopes: Array<OrganizationAccessScope | ProjectAccessScope | TargetAccessScope>,
): Array<AuthorizationPolicyStatement> {
  const policies: Array<AuthorizationPolicyStatement> = [];
  for (const scope of scopes) {
    switch (scope) {
      case OrganizationAccessScope.READ: {
        policies.push({
          effect: 'allow',
          action: ['support:manageTickets'],
          resource: [`hrn:${organizationId}:organization/${organizationId}`],
        });
        break;
      }
      case OrganizationAccessScope.SETTINGS: {
        policies.push({
          effect: 'allow',
          action: ['organization:updateSlug'],
          resource: [`hrn:${organizationId}:organization/${organizationId}`],
        });
        break;
      }
      case OrganizationAccessScope.INTEGRATIONS: {
        policies.push({
          effect: 'allow',
          action: ['oidc:modify', 'gitHubIntegration:modify', 'slackIntegration:modify'],
          resource: [`hrn:${organizationId}:organization/${organizationId}`],
        });
        break;
      }
      case ProjectAccessScope.ALERTS: {
        policies.push({
          effect: 'allow',
          action: ['alert:modify', 'alert:describe'],
          resource: [`hrn:${organizationId}:organization/${organizationId}`],
        });
        break;
      }
      case TargetAccessScope.REGISTRY_READ: {
        policies.push({
          effect: 'allow',
          action: ['appDeployment:describe', 'schema:check'],
          resource: [`hrn:${organizationId}:organization/${organizationId}`],
        });
        break;
      }
      case TargetAccessScope.REGISTRY_WRITE: {
        policies.push({
          effect: 'allow',
          action: [
            'appDeployment:create',
            'appDeployment:publish',
            'appDeployment:retire',
            'accessToken:create',
            'schema:publish',
            'schema:deleteService',
            'schema:check',
            'schema:approve',
          ],
          resource: [`hrn:${organizationId}:organization/${organizationId}`],
        });
        break;
      }
      case TargetAccessScope.TOKENS_READ: {
        policies.push({
          effect: 'allow',
          action: ['accessToken:create', 'accessToken:describe'],
          resource: [`hrn:${organizationId}:organization/${organizationId}`],
        });
        break;
      }
      case TargetAccessScope.TOKENS_WRITE: {
        policies.push({
          effect: 'allow',
          action: ['accessToken:create', 'accessToken:delete'],
          resource: [`hrn:${organizationId}:organization/${organizationId}`],
        });
        break;
      }
      case TargetAccessScope.SETTINGS: {
        policies.push({
          effect: 'allow',
          action: [
            'schemaContract:create',
            'schemaContract:disable',
            'schemaContract:describe',
            'accessToken:create',
            'accessToken:delete',
            'accessToken:describe',
          ],
          resource: [`hrn:${organizationId}:organization/${organizationId}`],
        });
        break;
      }
    }
  }

  return policies;
}
