import { OrganizationAccessScope, ProjectAccessScope, TargetAccessScope } from './scopes';

export class OrganizationMembers {
  async deleteOrganizationMember(args: { userId: string; organizationId: string }) {}
  async updateOrganizationMemberAccess(args: {
    userId: string;
    organizationId: string;
    scopes: Array<OrganizationAccessScope | ProjectAccessScope | TargetAccessScope>;
  }) {}
  async createOrganizationMemberRole(args: {
    organizationId: string;
    name: string;
    scopes: Array<OrganizationAccessScope | ProjectAccessScope | TargetAccessScope>;
    description: string;
  }) {}
  async updateOrganizationMemberRole(args: {
    organizationId: string;
    name: string;
    scopes: Array<OrganizationAccessScope | ProjectAccessScope | TargetAccessScope>;
    description: string;
  }) {}
  async assignOrganizationMemberRole(args: {
    userId: string;
    organizationId: string;
    roleId: string;
  }) {}
  async assignOrganizationMemberRoleToMany(args: {
    userIds: Array<string>;
    organizationId: string;
    roleId: string;
  }) {}
}
