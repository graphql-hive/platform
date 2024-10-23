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
          resource: [`hrn:${organizationId}:*`],
        });
        break;
      }
      case OrganizationAccessScope.SETTINGS: {
        policies.push({
          effect: 'allow',
          action: ['organization:updateSlug'],
          resource: [`hrn:${organizationId}:*`],
        });
        break;
      }
      case OrganizationAccessScope.INTEGRATIONS: {
        policies.push({
          effect: 'allow',
          action: ['oidc:modify'],
          resource: [`hrn:${organizationId}:*`],
        });
        break;
      }
      case ProjectAccessScope.ALERTS: {
        policies.push({
          effect: 'allow',
          action: ['alert:modify', 'alert:describe'],
          resource: [`hrn:${organizationId}:*`],
        });
        break;
      }
      case TargetAccessScope.REGISTRY_READ: {
        policies.push({
          effect: 'allow',
          action: ['appDeployment:describe'],
          resource: [`hrn:${organizationId}:*`],
        });
        break;
      }
      case TargetAccessScope.REGISTRY_WRITE: {
        policies.push({
          effect: 'allow',
          action: ['appDeployment:create', 'appDeployment:publish', 'appDeployment:retire'],
          resource: [`hrn:${organizationId}:*`],
        });
        break;
      }
      case TargetAccessScope.SETTINGS: {
        policies.push({
          effect: 'allow',
          action: ['schemaContract:create', 'schemaContract:disable', 'schemaContract:describe'],
          resource: [`hrn:${organizationId}:*`],
        });
        break;
      }
    }
  }

  return policies;
}
