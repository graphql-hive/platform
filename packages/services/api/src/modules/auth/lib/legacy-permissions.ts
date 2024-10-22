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
    }
  }

  return policies;
}
