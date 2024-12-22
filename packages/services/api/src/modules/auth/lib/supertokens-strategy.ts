import SessionNode from 'supertokens-node/recipe/session/index.js';
import * as zod from 'zod';
import type { FastifyReply, FastifyRequest, ServiceLogger } from '@hive/service-common';
import { captureException } from '@sentry/node';
import type { User } from '../../../shared/entities';
import { AccessError, HiveError } from '../../../shared/errors';
import { isUUID } from '../../../shared/is-uuid';
import { Logger } from '../../shared/providers/logger';
import type { Storage } from '../../shared/providers/storage';
import {
  OrganizationMembers,
  OrganizationMembershipRoleAssignment,
} from '../providers/organization-members';
import { ActionStrings, AuthNStrategy, AuthorizationPolicyStatement, Session } from './authz';

export class SuperTokensCookieBasedSession extends Session {
  public superTokensUserId: string;
  private organizationMembers: OrganizationMembers;
  private storage: Storage;

  constructor(
    args: { superTokensUserId: string; email: string },
    deps: { organizationMembers: OrganizationMembers; storage: Storage; logger: Logger },
  ) {
    super({ logger: deps.logger });
    this.superTokensUserId = args.superTokensUserId;
    this.organizationMembers = deps.organizationMembers;
    this.storage = deps.storage;
  }

  protected async loadPolicyStatementsForOrganization(
    organizationId: string,
  ): Promise<Array<AuthorizationPolicyStatement>> {
    const user = await this.getViewer();

    this.logger.debug(
      'Loading policy statements for organization. (userId=%s, organizationId=%s)',
      user.id,
      organizationId,
    );

    if (!isUUID(organizationId)) {
      this.logger.debug(
        'Invalid organization ID provided. (userId=%s, organizationId=%s)',
        user.id,
        organizationId,
      );

      return [];
    }

    this.logger.debug(
      'Load organization membership for user. (userId=%s, organizationId=%s)',
      user.id,
      organizationId,
    );

    const organization = await this.storage.getOrganization({ organizationId });
    const organizationMembership = await this.organizationMembers.findOrganizationMembership({
      organization,
      userId: user.id,
    });

    console.log(JSON.stringify(organizationMembership, null, 2));

    if (!organizationMembership) {
      this.logger.debug(
        'No membership found, resolve empty policy statements. (userId=%s, organizationId=%s)',
        user.id,
        organizationId,
      );

      return [];
    }

    // owner of organization should have full right to do anything.
    if (organizationMembership.isAdmin) {
      this.logger.debug(
        'User is organization owner, resolve admin access policy. (userId=%s, organizationId=%s)',
        user.id,
        organizationId,
      );

      return [
        {
          action: '*',
          effect: 'allow',
          resource: `hrn:${organizationId}:organization/${organizationId}`,
        },
      ];
    }

    this.logger.debug(
      'Translate organization role assignments to policy statements. (userId=%s, organizationId=%s)',
      user.id,
      organizationId,
    );

    const policyStatements = this.translateAssignedRolesToAuthorizationPolicyStatements(
      organizationId,
      organizationMembership.assignedRoles,
    );

    return policyStatements;
  }

  private translateAssignedRolesToAuthorizationPolicyStatements(
    organizationId: string,
    organizationMembershipRoleAssignments: Array<OrganizationMembershipRoleAssignment>,
  ): Array<AuthorizationPolicyStatement> {
    const policyStatements: Array<AuthorizationPolicyStatement> = [];

    for (const assignedRole of organizationMembershipRoleAssignments) {
      for (const permissionGroup of assignedRole.role.permissionGroups) {
        const resources = assignedRole.resources[permissionGroup.resourceType];

        if (!resources) {
          // skip is assignment group is missing
          continue;
        }

        const resourceIds: Array<string> = [];

        switch (permissionGroup.resourceType) {
          case 'organization':
          case 'project':
          case 'target': {
            if (resources === '*') {
              resourceIds.push(`hrn:${organizationId}:${permissionGroup.resourceType}/*`);
              break;
            }
            resourceIds.push(
              ...resources.map(
                resourceId => `hrn:${organizationId}:${permissionGroup.resourceType}/${resourceId}`,
              ),
            );
            break;
          }
          case 'service': {
            if (resources === '*') {
              resourceIds.push(`hrn:${organizationId}:target/*/service/*`);
              break;
            }
            resourceIds.push(
              ...resources.map(resourceId => {
                const [targetId, serviceName] = resourceId.split('/');
                return `hrn:${organizationId}:${targetId}/service/${serviceName}`;
              }),
            );
            break;
          }
        }

        policyStatements.push({
          action: permissionGroup.permissions as ActionStrings[],
          effect: permissionGroup.effect,
          resource: resourceIds,
        });
      }
    }

    return policyStatements;
  }

  public async getViewer(): Promise<User> {
    const user = await this.storage.getUserBySuperTokenId({
      superTokensUserId: this.superTokensUserId,
    });

    if (!user) {
      throw new AccessError('User not found');
    }

    return user;
  }

  public isViewer() {
    return true;
  }
}

export class SuperTokensUserAuthNStrategy extends AuthNStrategy<SuperTokensCookieBasedSession> {
  private logger: ServiceLogger;
  private organizationMembers: OrganizationMembers;
  private storage: Storage;

  constructor(deps: {
    logger: ServiceLogger;
    organizationMembers: OrganizationMembers;
    storage: Storage;
  }) {
    super();
    this.logger = deps.logger.child({ module: 'SuperTokensUserAuthNStrategy' });
    this.organizationMembers = deps.organizationMembers;
    this.storage = deps.storage;
  }

  private async verifySuperTokensSession(args: { req: FastifyRequest; reply: FastifyReply }) {
    this.logger.debug('Attempt verifying SuperTokens session');
    let session: SessionNode.SessionContainer | undefined;

    try {
      session = await SessionNode.getSession(args.req, args.reply, {
        sessionRequired: false,
        antiCsrfCheck: false,
        checkDatabase: true,
      });
      this.logger.debug('Session resolution ended successfully');
    } catch (error) {
      this.logger.debug('Session resolution failed');
      if (SessionNode.Error.isErrorFromSuperTokens(error)) {
        // Check whether the email is already verified.
        // If it is not then we need to redirect to the email verification page - which will trigger the email sending.
        if (error.type === SessionNode.Error.INVALID_CLAIMS) {
          throw new HiveError('Your account is not verified. Please verify your email address.', {
            extensions: {
              code: 'VERIFY_EMAIL',
            },
          });
        } else if (
          error.type === SessionNode.Error.TRY_REFRESH_TOKEN ||
          error.type === SessionNode.Error.UNAUTHORISED
        ) {
          throw new HiveError('Invalid session', {
            extensions: {
              code: 'NEEDS_REFRESH',
            },
          });
        }
      }

      this.logger.error('Error while resolving user');
      console.log(error);
      captureException(error);

      throw error;
    }

    if (!session) {
      this.logger.debug('No session found');
      return null;
    }

    const payload = session.getAccessTokenPayload();

    if (!payload) {
      this.logger.error('No access token payload found');
      return null;
    }

    const result = SuperTokenAccessTokenModel.safeParse(payload);

    if (result.success === false) {
      this.logger.error('SuperTokens session payload is invalid');
      this.logger.debug('SuperTokens session payload: %s', JSON.stringify(payload));
      this.logger.debug(
        'SuperTokens session parsing errors: %s',
        JSON.stringify(result.error.flatten().fieldErrors),
      );
      throw new HiveError(`Invalid access token provided`);
    }

    this.logger.debug('SuperTokens session resolved.');
    return result.data;
  }

  async parse(args: {
    req: FastifyRequest;
    reply: FastifyReply;
  }): Promise<SuperTokensCookieBasedSession | null> {
    const session = await this.verifySuperTokensSession(args);
    if (!session) {
      return null;
    }

    this.logger.debug('SuperTokens session resolved successfully');

    return new SuperTokensCookieBasedSession(
      {
        superTokensUserId: session.superTokensUserId,
        email: session.email,
      },
      {
        organizationMembers: this.organizationMembers,
        logger: args.req.log,
        storage: this.storage,
      },
    );
  }
}

const SuperTokenAccessTokenModel = zod.object({
  version: zod.literal('1'),
  superTokensUserId: zod.string(),
  email: zod.string(),
});
