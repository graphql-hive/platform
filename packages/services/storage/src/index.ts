import {
  ActivityObject,
  Alert,
  AlertChannel,
  AuthProvider,
  Member,
  Organization,
  OrganizationAccessScope,
  OrganizationBilling,
  OrganizationInvitation,
  OrganizationType,
  PersistedOperation,
  Project,
  ProjectAccessScope,
  ProjectType,
  Schema,
  SchemaVersion,
  Storage,
  Target,
  TargetAccessScope,
  TargetSettings,
  User,
} from '@hive/api';
import { batch } from '@theguild/buddy';
import { paramCase } from 'param-case';
import {
  DatabasePool,
  DatabasePoolConnection,
  DatabaseTransactionConnection,
  sql,
  TaggedTemplateLiteralInvocation,
  UniqueIntegrityConstraintViolationError,
} from 'slonik';
import { update } from 'slonik-utilities';
import zod from 'zod';
import type { OIDCIntegration, SchemaLog } from '../../api/src/shared/entities';
import {
  activities,
  alert_channels,
  alerts,
  getPool,
  objectToParams,
  organization_invitations,
  organization_member,
  organizations,
  organizations_billing,
  persisted_operations,
  projects,
  schema_log,
  schema_versions,
  target_validation,
  targets,
  users,
} from './db';
import type { Slonik } from './shared';

export { createConnectionString } from './db/utils';
export { createTokenStorage } from './tokens';
export type { tokens } from './db/types';

type Connection = DatabasePool | DatabaseTransactionConnection;

type OverrideProp<T extends {}, K extends keyof T, V extends T[K]> = Omit<T, K> & { [P in K]: V };

const organizationGetStartedMapping: Record<
  Exclude<keyof Organization['getStarted'], 'id'>,
  keyof organizations
> = {
  creatingProject: 'get_started_creating_project',
  publishingSchema: 'get_started_publishing_schema',
  checkingSchema: 'get_started_checking_schema',
  invitingMembers: 'get_started_inviting_members',
  reportingOperations: 'get_started_reporting_operations',
  enablingUsageBasedBreakingChanges: 'get_started_usage_breaking',
};

function ensureDefined<T>(value: T | null | undefined, propertyName: string): T {
  if (value == null) {
    throw new Error(`${propertyName} is null or undefined`);
  }

  return value;
}

function getProviderBasedOnExternalId(externalId: string): AuthProvider {
  if (externalId.startsWith('github')) {
    return 'GITHUB';
  }

  if (externalId.startsWith('google')) {
    return 'GOOGLE';
  }

  return 'AUTH0';
}

export async function createStorage(connection: string, maximumPoolSize: number): Promise<Storage> {
  const pool = await getPool(connection, maximumPoolSize);

  // use a single connection for locks because postgres advisory locks are bound
  // to sessions and if the session is disposed, so will be the lock. by using
  // a single connection for locks always, we guarantee the locks database
  // persistance throughout its whole lifecycle
  const getLockConn = (() => {
    let lockConn: DatabasePoolConnection | null;
    return () =>
      new Promise<DatabasePoolConnection>((resolve, reject) => {
        if (lockConn) {
          return resolve(lockConn);
        }
        pool
          .connect(conn => {
            lockConn = conn;
            resolve(lockConn);
            return new Promise(() => {
              // keep the connection alive indefinitely
            });
          })
          .then(() => {
            lockConn = null;
            reject(new Error('Lock connection ended'));
          })
          .catch(err => {
            lockConn = null;
            reject(err);
          });
      });
  })();

  function transformUser(user: users): User {
    return {
      id: user.id,
      email: user.email,
      superTokensUserId: user.supertoken_user_id,
      provider: getProviderBasedOnExternalId(user.external_auth_user_id ?? ''),
      fullName: user.full_name,
      displayName: user.display_name,
      isAdmin: user.is_admin ?? false,
      externalAuthUserId: user.external_auth_user_id ?? null,
      oidcIntegrationId: user.oidc_integration_id ?? null,
    };
  }

  function transformMember(
    user: users & Pick<organization_member, 'scopes' | 'organization_id'> & { is_owner: boolean },
  ): Member {
    return {
      id: user.id,
      isOwner: user.is_owner,
      user: transformUser(user),
      scopes: (user.scopes as Member['scopes']) || [],
      organization: user.organization_id,
    };
  }

  function transformOrganization(organization: organizations): Organization {
    return {
      id: organization.id,
      cleanId: organization.clean_id,
      name: organization.name,
      monthlyRateLimit: {
        retentionInDays: parseInt(organization.limit_retention_days),
        operations: parseInt(organization.limit_operations_monthly),
      },
      billingPlan: organization.plan_name,
      type: (organization.type === 'PERSONAL' ? 'PERSONAL' : 'REGULAR') as OrganizationType,
      getStarted: {
        id: organization.id,
        creatingProject: organization.get_started_creating_project,
        publishingSchema: organization.get_started_publishing_schema,
        checkingSchema: organization.get_started_checking_schema,
        invitingMembers: organization.get_started_inviting_members,
        reportingOperations: organization.get_started_reporting_operations,
        enablingUsageBasedBreakingChanges: organization.get_started_usage_breaking,
      },
    };
  }

  function transformOrganizationInvitation(
    invitation: organization_invitations,
  ): OrganizationInvitation {
    return {
      email: invitation.email,
      organization_id: invitation.organization_id,
      code: invitation.code,
      created_at: invitation.created_at as any,
      expires_at: invitation.expires_at as any,
    };
  }

  function transformProject(project: projects): Project {
    return {
      id: project.id,
      cleanId: project.clean_id,
      orgId: project.org_id,
      name: project.name,
      type: project.type as ProjectType,
      buildUrl: project.build_url,
      validationUrl: project.validation_url,
      gitRepository: project.git_repository,
      legacyRegistryModel: project.legacy_registry_model,
      externalComposition: {
        enabled: project.external_composition_enabled,
        endpoint: project.external_composition_endpoint,
        encryptedSecret: project.external_composition_secret,
      },
    };
  }

  function transformTarget(target: targets, orgId: string): Target {
    return {
      id: target.id,
      cleanId: target.clean_id,
      name: target.name,
      projectId: target.project_id,
      orgId,
    };
  }

  function transformSchema(
    schema: Pick<
      OverrideProp<schema_log, 'action', 'PUSH'>,
      | 'id'
      | 'action'
      | 'commit'
      | 'author'
      | 'sdl'
      | 'created_at'
      | 'project_id'
      | 'service_name'
      | 'service_url'
      | 'target_id'
      | 'metadata'
    > &
      Pick<projects, 'type'>,
  ): Schema {
    const isSingleProject = (schema.type as ProjectType) === ProjectType.SINGLE;
    const record: Schema = isSingleProject
      ? {
          kind: 'single',
          id: schema.id,
          author: schema.author,
          sdl: ensureDefined(schema.sdl, 'sdl'),
          commit: schema.commit,
          date: schema.created_at as any,
          target: schema.target_id,
          metadata: schema.metadata ?? null,
        }
      : {
          kind: 'composite',
          id: schema.id,
          author: schema.author,
          sdl: ensureDefined(schema.sdl, 'sdl'),
          commit: schema.commit,
          date: schema.created_at as any,
          service_name: schema.service_name!,
          service_url: schema.service_url,
          target: schema.target_id,
          action: 'PUSH',
          metadata: schema.metadata ?? null,
        };

    return record;
  }

  function transformSchemaLog(
    schema: Pick<
      schema_log,
      | 'id'
      | 'action'
      | 'commit'
      | 'author'
      | 'sdl'
      | 'created_at'
      | 'project_id'
      | 'service_name'
      | 'service_url'
      | 'target_id'
      | 'metadata'
    > &
      Pick<projects, 'type'>,
  ): SchemaLog {
    const isSingleProject = (schema.type as ProjectType) === ProjectType.SINGLE;
    const record: SchemaLog = isSingleProject
      ? {
          kind: 'single',
          id: schema.id,
          author: schema.author,
          sdl: ensureDefined(schema.sdl, 'sdl'),
          commit: schema.commit,
          date: schema.created_at as any,
          target: schema.target_id,
          metadata: schema.metadata ?? null,
        }
      : schema.action === 'PUSH'
      ? {
          kind: 'composite',
          id: schema.id,
          author: schema.author,
          sdl: ensureDefined(schema.sdl, 'sdl'),
          commit: schema.commit,
          date: schema.created_at as any,
          service_name: schema.service_name!,
          service_url: schema.service_url,
          target: schema.target_id,
          action: 'PUSH',
          metadata: schema.metadata ?? null,
        }
      : {
          kind: 'composite',
          id: schema.id,
          date: schema.created_at as any,
          service_name: schema.service_name!,
          target: schema.target_id,
          action: 'DELETE',
        };

    return record;
  }

  function transformSchemaVersion(version: schema_versions): SchemaVersion {
    return {
      id: version.id,
      valid: version.is_composable,
      date: version.created_at as any,
      commit: version.action_id,
      base_schema: version.base_schema,
    };
  }

  function transformActivity(row: {
    activity: [activities];
    target: [targets];
    project: [projects];
    organization: [organizations];
    user: [users];
  }): ActivityObject {
    const activity = row.activity[0];
    const target = row.target[0];
    const project = row.project[0];
    const organization = row.organization[0];
    const user = row.user[0];

    return {
      id: activity.id,
      type: activity.activity_type,
      meta: activity.activity_metadata,
      createdAt: activity.created_at,
      target: target ? transformTarget(target, organization.id) : undefined,
      project: project ? transformProject(project) : undefined,
      organization: transformOrganization(organization),
      user: user ? transformUser(user) : undefined,
    };
  }

  function transformTargetSettings(
    row: Pick<
      targets,
      | 'validation_enabled'
      | 'validation_percentage'
      | 'validation_period'
      | 'validation_excluded_clients'
    > & {
      targets: target_validation['destination_target_id'][] | null;
    },
  ): TargetSettings {
    return {
      validation: {
        enabled: row.validation_enabled,
        percentage: row.validation_percentage,
        period: row.validation_period,
        targets: Array.isArray(row.targets) ? row.targets.filter(isDefined) : [],
        excludedClients: Array.isArray(row.validation_excluded_clients)
          ? row.validation_excluded_clients.filter(isDefined)
          : [],
      },
    };
  }

  function transformPersistedOperation(operation: persisted_operations): PersistedOperation {
    return {
      id: operation.id,
      operationHash: operation.operation_hash,
      name: operation.operation_name,
      kind: operation.operation_kind as any,
      project: operation.project_id,
      content: operation.content,
      date: operation.created_at as any,
    };
  }

  function transformOrganizationBilling(orgBilling: organizations_billing): OrganizationBilling {
    return {
      organizationId: orgBilling.organization_id,
      externalBillingReference: orgBilling.external_billing_reference_id,
      billingEmailAddress: orgBilling.billing_email_address,
    };
  }

  function transformAlertChannel(channel: alert_channels): AlertChannel {
    return {
      id: channel.id,
      projectId: channel.project_id,
      name: channel.name,
      type: channel.type,
      createdAt: channel.created_at as any,
      slackChannel: channel.slack_channel,
      webhookEndpoint: channel.webhook_endpoint,
    };
  }

  function transformAlert(alert: alerts, organization: string): Alert {
    return {
      id: alert.id,
      type: alert.type,
      createdAt: alert.created_at as any,
      channelId: alert.alert_channel_id,
      organizationId: organization,
      projectId: alert.project_id,
      targetId: alert.target_id,
    };
  }

  const shared = {
    async getUserBySuperTokenId(
      { superTokensUserId }: { superTokensUserId: string },
      connection: Connection,
    ) {
      const user = await connection.maybeOne<Slonik<users>>(sql`
        SELECT
          *
        FROM
          public."users"
        WHERE
          "supertoken_user_id" = ${superTokensUserId}
        LIMIT 1
      `);

      if (user) {
        return transformUser(user);
      }

      return null;
    },
    async createUser(
      {
        superTokensUserId,
        email,
        fullName,
        displayName,
        externalAuthUserId,
        oidcIntegrationId,
      }: {
        superTokensUserId: string;
        email: string;
        fullName: string;
        displayName: string;
        externalAuthUserId: string | null;
        oidcIntegrationId: string | null;
      },
      connection: Connection,
    ) {
      return transformUser(
        await connection.one<Slonik<users>>(
          sql`
            INSERT INTO public.users
              ("email", "supertoken_user_id", "full_name", "display_name", "external_auth_user_id", "oidc_integration_id")
            VALUES
              (${email}, ${superTokensUserId}, ${fullName}, ${displayName}, ${externalAuthUserId}, ${oidcIntegrationId})
            RETURNING *
          `,
        ),
      );
    },
    async getOrganization(userId: string, connection: Connection) {
      const org = await connection.maybeOne<Slonik<organizations>>(
        sql`SELECT * FROM public.organizations WHERE user_id = ${userId} AND type = ${'PERSONAL'} LIMIT 1`,
      );

      return org ? transformOrganization(org) : null;
    },
    async createOrganization(
      {
        name,
        user,
        cleanId,
        type,
        scopes,
        reservedNames,
      }: Parameters<Storage['createOrganization']>[0] & {
        reservedNames: string[];
      },
      connection: Connection,
    ) {
      function addRandomHashToId(id: string) {
        return `${id}-${Math.random().toString(16).substring(2, 6)}`;
      }

      async function ensureFreeCleanId(id: string, originalId: string | null): Promise<string> {
        if (reservedNames.includes(id)) {
          return ensureFreeCleanId(addRandomHashToId(id), originalId);
        }

        const orgCleanIdExists = await connection.exists(
          sql`SELECT 1 FROM public.organizations WHERE clean_id = ${id} LIMIT 1`,
        );

        if (orgCleanIdExists) {
          return ensureFreeCleanId(addRandomHashToId(id), originalId);
        }

        return id;
      }
      const availableCleanId = await ensureFreeCleanId(cleanId, null);

      const org = await connection.one<Slonik<organizations>>(
        sql`
          INSERT INTO public.organizations
            ("name", "clean_id", "type", "user_id")
          VALUES
            (${name}, ${availableCleanId}, ${type}, ${user})
          RETURNING *
        `,
      );

      await connection.query<Slonik<organization_member>>(
        sql`
          INSERT INTO public.organization_member
            ("organization_id", "user_id", "scopes")
          VALUES
            (${org.id}, ${user}, ${sql.array(scopes, 'text')})
        `,
      );

      return transformOrganization(org);
    },
    async addOrganizationMemberViaOIDCIntegrationId(
      args: {
        oidcIntegrationId: string;
        userId: string;
        defaultScopes: Array<OrganizationAccessScope | ProjectAccessScope | TargetAccessScope>;
      },
      connection: Connection,
    ) {
      const linkedOrganizationId = await connection.maybeOneFirst<string>(sql`
          SELECT
            "linked_organization_id"
          FROM
            "public"."oidc_integrations"
          WHERE
            "id" = ${args.oidcIntegrationId}
        `);

      if (linkedOrganizationId === null) {
        return;
      }

      await connection.query(
        sql`
          INSERT INTO public.organization_member
            (organization_id, user_id, scopes)
          VALUES
            (${linkedOrganizationId}, ${args.userId}, ${sql.array(args.defaultScopes, 'text')})
          ON CONFLICT DO NOTHING
          RETURNING *
        `,
      );
    },
  };

  function buildUserData(input: {
    superTokensUserId: string;
    email: string;
    externalAuthUserId: string | null;
    oidcIntegrationId: string | null;
  }) {
    const displayName = input.email.split('@')[0].slice(0, 25).padEnd(2, '1');
    const fullName = input.email.split('@')[0].slice(0, 25).padEnd(2, '1');

    return {
      superTokensUserId: input.superTokensUserId,
      email: input.email,
      displayName,
      fullName,
      externalAuthUserId: input.externalAuthUserId,
      oidcIntegrationId: input.oidcIntegrationId,
    };
  }

  type Lock = {
    p: Promise<void>;
    release: () => void;
  };
  const locks = new Map<string, Lock>();

  const storage: Storage = {
    destroy() {
      return pool.end();
    },
    async ensureUserExists({
      superTokensUserId,
      externalAuthUserId,
      email,
      scopes,
      reservedOrgNames,
      oidcIntegration,
    }: {
      superTokensUserId: string;
      externalAuthUserId?: string | null;
      email: string;
      reservedOrgNames: string[];
      scopes: Parameters<Storage['createOrganization']>[0]['scopes'];
      oidcIntegration: null | {
        id: string;
        defaultScopes: Array<OrganizationAccessScope | ProjectAccessScope | TargetAccessScope>;
      };
    }) {
      return pool.transaction(async t => {
        let action: 'created' | 'no_action' = 'no_action';
        let internalUser = await shared.getUserBySuperTokenId({ superTokensUserId }, t);

        if (!internalUser) {
          internalUser = await shared.createUser(
            buildUserData({
              superTokensUserId,
              email,
              externalAuthUserId: externalAuthUserId ?? null,
              oidcIntegrationId: oidcIntegration?.id ?? null,
            }),
            t,
          );
          action = 'created';
        }

        if (oidcIntegration === null) {
          const personalOrg = await shared.getOrganization(internalUser.id, t);

          if (!personalOrg) {
            await shared.createOrganization(
              {
                name: internalUser.displayName,
                user: internalUser.id,
                cleanId: paramCase(internalUser.displayName),
                type: 'PERSONAL' as OrganizationType,
                scopes,
                reservedNames: reservedOrgNames,
              },
              t,
            );
            action = 'created';
          }
        } else {
          // Add user to OIDC linked integration
          await shared.addOrganizationMemberViaOIDCIntegrationId(
            {
              oidcIntegrationId: oidcIntegration.id,
              userId: internalUser.id,
              defaultScopes: oidcIntegration.defaultScopes,
            },
            t,
          );
        }

        return action;
      });
    },
    async getUserBySuperTokenId({ superTokensUserId }) {
      return shared.getUserBySuperTokenId({ superTokensUserId }, pool);
    },
    async getUserWithoutAssociatedSuperTokenIdByAuth0Email({ email }) {
      const user = await pool.maybeOne<Slonik<users>>(sql`
        SELECT
          *
        FROM
          public."users"
        WHERE
          "email" = ${email}
          AND "supertoken_user_id" IS NULL
          AND "external_auth_user_id" LIKE 'auth0|%'
        LIMIT 1
      `);

      if (user) {
        return transformUser(user);
      }

      return null;
    },
    async setSuperTokensUserId({ auth0UserId, superTokensUserId, externalUserId }) {
      await pool.query(sql`
        UPDATE
          public."users"
        SET
          "supertoken_user_id" = ${superTokensUserId},
          "external_auth_user_id" = ${externalUserId}
        WHERE
          "external_auth_user_id" = ${auth0UserId}
      `);
    },
    async getUserById({ id }) {
      const user = await pool.maybeOne<Slonik<users>>(
        sql`SELECT * FROM public.users WHERE id = ${id} LIMIT 1`,
      );

      if (user) {
        return transformUser(user);
      }

      return null;
    },
    async updateUser({ id, displayName, fullName }) {
      return transformUser(
        await pool.one<Slonik<users>>(sql`
          UPDATE public.users
          SET display_name = ${displayName}, full_name = ${fullName}
          WHERE id = ${id}
          RETURNING *
        `),
      );
    },
    createOrganization(input) {
      return pool.transaction(t => shared.createOrganization(input, t));
    },
    async deleteOrganization({ organization }) {
      const result = transformOrganization(
        await pool.one<Slonik<organizations>>(
          sql`
            DELETE FROM public.organizations
            WHERE id = ${organization}
            RETURNING *
          `,
        ),
      );

      return result;
    },
    async createProject({ name, organization, cleanId, type }) {
      return transformProject(
        await pool.one<Slonik<projects>>(
          sql`
            INSERT INTO public.projects
              ("name", "clean_id", "type", "org_id")
            VALUES
              (${name}, ${cleanId}, ${type}, ${organization})
            RETURNING *
          `,
        ),
      );
    },
    async getOrganizationId({ organization }) {
      // Based on clean_id, resolve id
      const result = await pool.one<Pick<organizations, 'id'>>(
        sql`SELECT id FROM public.organizations WHERE clean_id = ${organization} LIMIT 1`,
      );

      return result.id as string;
    },
    getOrganizationOwnerId: batch(async selectors => {
      const organizations = selectors.map(s => s.organization);
      const owners = await pool.query<Slonik<Pick<organizations, 'user_id' | 'id'>>>(
        sql`
        SELECT id, user_id
        FROM public.organizations
        WHERE id IN (${sql.join(organizations, sql`, `)})`,
      );

      return organizations.map(async organization => {
        const owner = owners.rows.find(row => row.id === organization);

        if (owner) {
          return owner.user_id;
        }

        return null;
      });
    }),
    getOrganizationOwner: batch(async selectors => {
      const organizations = selectors.map(s => s.organization);
      const owners = await pool.query<
        Slonik<users & Pick<organization_member, 'scopes' | 'organization_id'>>
      >(
        sql`
        SELECT u.*, om.scopes, om.organization_id FROM public.organizations as o
        LEFT JOIN public.users as u ON (u.id = o.user_id)
        LEFT JOIN public.organization_member as om ON (om.user_id = u.id AND om.organization_id = o.id)
        WHERE o.id IN (${sql.join(organizations, sql`, `)})`,
      );

      return organizations.map(organization => {
        const owner = owners.rows.find(row => row.organization_id === organization);

        if (owner) {
          return Promise.resolve(
            transformMember({
              ...owner,
              is_owner: true,
            }),
          );
        }

        return Promise.reject(new Error(`Owner not found (organization=${organization})`));
      });
    }),
    getOrganizationMembers: batch(async selectors => {
      const organizations = selectors.map(s => s.organization);
      const allMembers = await pool.query<
        Slonik<
          users &
            Pick<organization_member, 'scopes' | 'organization_id'> & {
              is_owner: boolean;
            }
        >
      >(
        sql`
        SELECT
          u.*,
          om.scopes,
          om.organization_id,
          CASE WHEN o.user_id = om.user_id THEN true ELSE false END AS is_owner
        FROM public.organization_member as om
        LEFT JOIN public.organizations as o ON (o.id = om.organization_id)
        LEFT JOIN public.users as u ON (u.id = om.user_id)
        WHERE om.organization_id IN (${sql.join(
          organizations,
          sql`, `,
        )}) ORDER BY u.created_at DESC`,
      );

      return organizations.map(organization => {
        const members = allMembers.rows.filter(row => row.organization_id === organization);

        if (members) {
          return Promise.resolve(members.map(transformMember));
        }

        return Promise.reject(new Error(`Members not found (organization=${organization})`));
      });
    }),
    async getOrganizationMember({ organization, user }) {
      const member = await pool.maybeOne<
        Slonik<
          users &
            Pick<organization_member, 'organization_id' | 'scopes'> & {
              is_owner: boolean;
            }
        >
      >(
        sql`
          SELECT
            u.*,
            om.scopes,
            om.organization_id,
            CASE WHEN o.user_id = om.user_id THEN true ELSE false END AS is_owner
          FROM public.organization_member as om
          LEFT JOIN public.organizations as o ON (o.id = om.organization_id)
          LEFT JOIN public.users as u ON (u.id = om.user_id)
          WHERE om.organization_id = ${organization} AND om.user_id = ${user} ORDER BY u.created_at DESC LIMIT 1`,
      );

      if (!member) {
        return null;
      }

      return transformMember(member);
    },
    getOrganizationInvitations: batch(async selectors => {
      const organizations = selectors.map(s => s.organization);
      const allInvitations = await pool.query<Slonik<organization_invitations>>(
        sql`
          SELECT * FROM public.organization_invitations
          WHERE organization_id IN (${sql.join(
            organizations,
            sql`, `,
          )}) AND expires_at > NOW() ORDER BY created_at DESC
        `,
      );

      return organizations.map(organization => {
        return Promise.resolve(
          allInvitations.rows
            .filter(row => row.organization_id === organization)
            .map(transformOrganizationInvitation) ?? [],
        );
      });
    }),
    async getOrganizationMemberAccessPairs(pairs) {
      const results = await pool.query<
        Slonik<Pick<organization_member, 'organization_id' | 'user_id' | 'scopes'>>
      >(
        sql`
          SELECT organization_id, user_id, scopes
          FROM public.organization_member
          WHERE (organization_id, user_id) IN ((${sql.join(
            pairs.map(p => sql`${p.organization}, ${p.user}`),
            sql`), (`,
          )}))
        `,
      );

      return pairs.map(({ organization, user }) => {
        return (results.rows.find(
          row => row.organization_id === organization && row.user_id === user,
        )?.scopes || []) as Member['scopes'];
      });
    },
    async hasOrganizationMemberPairs(pairs) {
      const results = await pool.query<Slonik<organization_member>>(
        sql`
          SELECT organization_id, user_id
          FROM public.organization_member
          WHERE (organization_id, user_id) IN ((${sql.join(
            pairs.map(p => sql`${p.organization}, ${p.user}`),
            sql`), (`,
          )}))
        `,
      );

      return pairs.map(({ organization, user }) =>
        results.rows.some(row => row.organization_id === organization && row.user_id === user),
      );
    },
    async hasOrganizationProjectMemberPairs(pairs) {
      const results = await pool.query<Slonik<organization_member & { project_id: string }>>(
        sql`
          SELECT om.organization_id, om.user_id, p.id AS project_id
          FROM public.projects as p
          LEFT JOIN public.organization_member as om ON (p.org_id = om.organization_id)
          WHERE (om.organization_id, om.user_id, p.id) IN ((${sql.join(
            pairs.map(p => sql`${p.organization}, ${p.user}, ${p.project}`),
            sql`), (`,
          )}))
        `,
      );

      return pairs.map(({ organization, user, project }) =>
        results.rows.some(
          row =>
            row.organization_id === organization &&
            row.project_id === project &&
            row.user_id === user,
        ),
      );
    },
    async updateOrganizationName({ name, cleanId, organization }) {
      return transformOrganization(
        await pool.one<Slonik<organizations>>(sql`
          UPDATE public.organizations
          SET name = ${name}, clean_id = ${cleanId}
          WHERE id = ${organization}
          RETURNING *
        `),
      );
    },
    async updateOrganizationPlan({ billingPlan, organization }) {
      return transformOrganization(
        await pool.one<Slonik<organizations>>(sql`
          UPDATE public.organizations
          SET plan_name = ${billingPlan}
          WHERE id = ${organization}
          RETURNING *
        `),
      );
    },
    async updateOrganizationRateLimits({ monthlyRateLimit, organization }) {
      return transformOrganization(
        await pool.one<Slonik<organizations>>(sql`
          UPDATE public.organizations
          SET limit_operations_monthly = ${monthlyRateLimit.operations}, limit_retention_days = ${monthlyRateLimit.retentionInDays}
          WHERE id = ${organization}
          RETURNING *
        `),
      );
    },
    async createOrganizationInvitation({ organization, email }) {
      return transformOrganizationInvitation(
        await pool.one<Slonik<organization_invitations>>(sql`
          INSERT INTO public.organization_invitations (organization_id, email)
          VALUES (${organization}, ${email})
          RETURNING *
        `),
      );
    },
    async deleteOrganizationInvitationByEmail({ organization, email }) {
      const deleted = await pool.maybeOne<Slonik<organization_invitations>>(sql`
        DELETE FROM public.organization_invitations
        WHERE organization_id = ${organization} AND email = ${email}
        RETURNING *
      `);
      return deleted ? transformOrganizationInvitation(deleted) : null;
    },
    async addOrganizationMemberViaInvitationCode({ code, user, organization, scopes }) {
      await pool.transaction(async trx => {
        await trx.query(sql`
          DELETE FROM public.organization_invitations
          WHERE organization_id = ${organization} AND code = ${code}
        `);

        await pool.one<Slonik<organization_member>>(
          sql`
            INSERT INTO public.organization_member
              (organization_id, user_id, scopes)
            VALUES
              (${organization}, ${user}, ${sql.array(scopes, 'text')})
            RETURNING *
          `,
        );
      });
    },
    async createOrganizationTransferRequest({ organization, user }) {
      const code = Math.random().toString(16).substring(2, 12);

      await pool.query<Slonik<Pick<organizations, 'ownership_transfer_code'>>>(
        sql`
          UPDATE public.organizations
          SET
            ownership_transfer_user_id = ${user},
            ownership_transfer_code = ${code},
            ownership_transfer_expires_at = NOW() + INTERVAL '1 day'
          WHERE id = ${organization}
        `,
      );

      return {
        code,
      };
    },
    async getOrganizationTransferRequest({ code, user, organization }) {
      return pool.maybeOne<{
        code: string;
      }>(sql`
        SELECT ownership_transfer_code as code FROM public.organizations
        WHERE
          ownership_transfer_user_id = ${user}
          AND id = ${organization}
          AND ownership_transfer_code = ${code}
          AND ownership_transfer_expires_at > NOW()
      `);
    },
    async answerOrganizationTransferRequest({
      organization,
      user,
      code,
      accept,
      oldAdminAccessScopes,
    }) {
      await pool.transaction(async tsx => {
        const owner = await tsx.maybeOne<Slonik<Pick<organizations, 'user_id'>>>(sql`
          SELECT user_id
          FROM public.organizations
          WHERE
            id = ${organization}
            AND ownership_transfer_user_id = ${user}
            AND ownership_transfer_code = ${code}
            AND ownership_transfer_expires_at > NOW()
        `);

        if (!owner) {
          throw new Error('No organization transfer request found');
        }

        if (!accept) {
          // NULL out the transfer request
          await tsx.query(sql`
            UPDATE public.organizations
            SET
              ownership_transfer_user_id = NULL,
              ownership_transfer_code = NULL,
              ownership_transfer_expires_at = NULL
            WHERE id = ${organization}
          `);

          // because it's a rejection, we don't need to do anything else other than null out the transfer request
          return;
        }

        // copy access scopes from the new owner
        await tsx.query(sql`
          UPDATE public.organization_member
          SET scopes = (
            SELECT scopes
            FROM public.organization_member
            WHERE organization_id = ${organization} AND user_id = ${owner.user_id}
            LIMIT 1
          )
          WHERE organization_id = ${organization} AND user_id = ${user}
        `);

        // assign new access scopes to the old owner
        await pool.query<Slonik<organization_member>>(
          sql`
            UPDATE public.organization_member
            SET scopes = ${sql.array(oldAdminAccessScopes, 'text')}
            WHERE organization_id = ${organization} AND user_id = ${owner.user_id}
          `,
        );

        // NULL out the transfer request
        // assign the new owner
        await tsx.query(sql`
          UPDATE public.organizations
          SET
            ownership_transfer_user_id = NULL,
            ownership_transfer_code = NULL,
            ownership_transfer_expires_at = NULL,
            user_id = ${user}
          WHERE id = ${organization}
        `);
      });
    },
    async deleteOrganizationMembers({ users, organization }) {
      await pool.query<Slonik<organization_member>>(
        sql`
          DELETE FROM public.organization_member
          WHERE organization_id = ${organization} AND user_id IN (${sql.join(users, sql`, `)})
        `,
      );
    },
    async updateOrganizationMemberAccess({ user, organization, scopes }) {
      await pool.query<Slonik<organization_member>>(
        sql`
          UPDATE public.organization_member
          SET scopes = ${sql.array(scopes, 'text')}
          WHERE organization_id = ${organization} AND user_id = ${user}
        `,
      );
    },
    async getProjectId({ project, organization }) {
      // Based on project's clean_id and organization's clean_id, resolve the actual uuid of the project
      const result = await pool.one<Pick<projects, 'id'>>(
        sql`SELECT p.id as id
        FROM public.projects as p
        LEFT JOIN public.organizations as org ON (p.org_id = org.id)
        WHERE p.clean_id = ${project} AND org.clean_id = ${organization} LIMIT 1`,
      );

      return result.id as string;
    },
    async getTargetId({ project, target, organization, useIds }) {
      if (useIds) {
        const result = await pool.one<Pick<targets, 'id'>>(
          sql`
          SELECT t.id FROM public.targets as t
          LEFT JOIN public.projects AS p ON (p.id = t.project_id)
          LEFT JOIN public.organizations AS o ON (o.id = p.org_id)
          WHERE t.clean_id = ${target} AND p.id = ${project} AND o.id = ${organization}
          LIMIT 1`,
        );

        return result.id as string;
      }

      // Based on clean_id, resolve id
      const result = await pool.one<Pick<targets, 'id'>>(
        sql`
          SELECT t.id FROM public.targets as t
          LEFT JOIN public.projects AS p ON (p.id = t.project_id)
          LEFT JOIN public.organizations AS o ON (o.id = p.org_id)
          WHERE t.clean_id = ${target} AND p.clean_id = ${project} AND o.clean_id = ${organization}
          LIMIT 1`,
      );

      return result.id as string;
    },
    async getPersistedOperationId({ project, operation }) {
      const result = await pool.one<Pick<persisted_operations, 'id'>>(
        sql`
          SELECT po.id FROM public.persisted_operations as po
          LEFT JOIN public.projects AS p ON (p.id = po.project_id)
          WHERE po.operation_hash = ${operation} AND p.clean_id = ${project}
          LIMIT 1`,
      );

      return result.id;
    },
    async getOrganization({ organization }) {
      return transformOrganization(
        await pool.one<Slonik<organizations>>(
          sql`SELECT * FROM public.organizations WHERE id = ${organization} LIMIT 1`,
        ),
      );
    },
    async getMyOrganization({ user }) {
      const org = await pool.maybeOne<Slonik<organizations>>(
        sql`SELECT * FROM public.organizations WHERE user_id = ${user} AND type = ${'PERSONAL'} LIMIT 1`,
      );

      return org ? transformOrganization(org) : null;
    },
    async getOrganizations({ user }) {
      const results = await pool.many<Slonik<organizations>>(
        sql`
          SELECT o.*
          FROM public.organizations as o
          LEFT JOIN public.organization_member as om ON (om.organization_id = o.id)
          WHERE om.user_id = ${user}
          ORDER BY o.created_at DESC
        `,
      );
      return results.map(transformOrganization);
    },
    async getOrganizationByInviteCode({ inviteCode }) {
      const result = await pool.maybeOne<Slonik<organizations>>(
        sql`
          SELECT o.* FROM public.organizations as o
          LEFT JOIN public.organization_invitations as i ON (i.organization_id = o.id)
          WHERE i.code = ${inviteCode} AND i.expires_at > NOW()
          GROUP BY o.id
          LIMIT 1
        `,
      );

      if (result) {
        return transformOrganization(result);
      }

      return null;
    },
    async getOrganizationByCleanId({ cleanId }) {
      const result = await pool.maybeOne<Slonik<organizations>>(
        sql`SELECT * FROM public.organizations WHERE clean_id = ${cleanId} LIMIT 1`,
      );

      if (!result) {
        return null;
      }

      return transformOrganization(result);
    },
    async getOrganizationByGitHubInstallationId({ installationId }) {
      const result = await pool.maybeOne<Slonik<organizations>>(
        sql`
          SELECT * FROM public.organizations
          WHERE github_app_installation_id = ${installationId}
          LIMIT 1
        `,
      );

      if (result) {
        return transformOrganization(result);
      }

      return null;
    },
    async getProject({ project }) {
      return transformProject(
        await pool.one<Slonik<projects>>(
          sql`SELECT * FROM public.projects WHERE id = ${project} LIMIT 1`,
        ),
      );
    },
    async getProjectByCleanId({ cleanId, organization }) {
      const result = await pool.maybeOne<Slonik<projects>>(
        sql`SELECT * FROM public.projects WHERE clean_id = ${cleanId} AND org_id = ${organization} LIMIT 1`,
      );

      if (!result) {
        return null;
      }

      return transformProject(result);
    },
    async getProjects({ organization }) {
      const result = await pool.query<Slonik<projects>>(
        sql`SELECT * FROM public.projects WHERE org_id = ${organization} ORDER BY created_at DESC`,
      );

      return result.rows.map(transformProject);
    },
    async updateProjectName({ name, cleanId, organization, project }) {
      return transformProject(
        await pool.one<Slonik<projects>>(sql`
          UPDATE public.projects
          SET name = ${name}, clean_id = ${cleanId}
          WHERE id = ${project} AND org_id = ${organization}
          RETURNING *
        `),
      );
    },
    async updateProjectGitRepository({ gitRepository, organization, project }) {
      return transformProject(
        await pool.one<Slonik<projects>>(sql`
          UPDATE public.projects
          SET git_repository = ${gitRepository ?? null}
          WHERE id = ${project} AND org_id = ${organization}
          RETURNING *
        `),
      );
    },
    async enableExternalSchemaComposition({ project, endpoint, encryptedSecret }) {
      return transformProject(
        await pool.one<Slonik<projects>>(sql`
          UPDATE public.projects
          SET
            external_composition_enabled = TRUE,
            external_composition_endpoint = ${endpoint},
            external_composition_secret = ${encryptedSecret}
          WHERE id = ${project}
          RETURNING *
        `),
      );
    },
    async disableExternalSchemaComposition({ project }) {
      return transformProject(
        await pool.one<Slonik<projects>>(sql`
          UPDATE public.projects
          SET
            external_composition_enabled = FALSE,
            external_composition_endpoint = NULL,
            external_composition_secret = NULL
          WHERE id = ${project}
          RETURNING *
        `),
      );
    },
    async updateProjectRegistryModel({ project, model }) {
      const isLegacyModel = model === 'LEGACY';

      return transformProject(
        await pool.one<projects>(sql`
          UPDATE public.projects
          SET legacy_registry_model = ${isLegacyModel}
          WHERE id = ${project}
          RETURNING *
        `),
      );
    },

    async deleteProject({ organization, project }) {
      const result = transformProject(
        await pool.one<Slonik<projects>>(
          sql`
            DELETE FROM public.projects
            WHERE id = ${project} AND org_id = ${organization}
            RETURNING *
          `,
        ),
      );

      return result;
    },
    async createTarget({ organization, project, name, cleanId }) {
      return transformTarget(
        await pool.one<Slonik<targets>>(
          sql`
            INSERT INTO public.targets
              (name, clean_id, project_id)
            VALUES
              (${name}, ${cleanId}, ${project})
            RETURNING *
          `,
        ),
        organization,
      );
    },
    async updateTargetName({ organization, project, target, name, cleanId }) {
      return transformTarget(
        await pool.one<Slonik<targets>>(sql`
          UPDATE public.targets
          SET name = ${name}, clean_id = ${cleanId}
          WHERE id = ${target} AND project_id = ${project}
          RETURNING *
        `),
        organization,
      );
    },
    async deleteTarget({ organization, project, target }) {
      const result = transformTarget(
        await pool.one<Slonik<targets>>(
          sql`
            DELETE FROM public.targets
            WHERE id = ${target} AND project_id = ${project}
            RETURNING *
          `,
        ),
        organization,
      );

      await pool.query(sql`DELETE FROM public.schema_versions WHERE target_id = ${target}`);

      return result;
    },
    getTarget: batch(
      async (
        selectors: Array<{
          organization: string;
          project: string;
          target: string;
        }>,
      ) => {
        const uniqueSelectorsMap = new Map<string, typeof selectors[0]>();

        for (const selector of selectors) {
          const key = JSON.stringify({
            organization: selector.organization,
            project: selector.project,
            target: selector.target,
          });

          uniqueSelectorsMap.set(key, selector);
        }

        const uniqueSelectors = Array.from(uniqueSelectorsMap.values());

        const rows = await pool.many<Slonik<targets>>(
          sql`
            SELECT * FROM public.targets
            WHERE (id, project_id) IN ((${sql.join(
              uniqueSelectors.map(s => sql`${s.target}, ${s.project}`),
              sql`), (`,
            )}))
          `,
        );

        return selectors.map(selector => {
          const row = rows.find(
            row => row.id === selector.target && row.project_id === selector.project,
          );

          if (!row) {
            return Promise.reject(
              new Error(
                `Target not found (target=${selector.target}, project=${selector.project})`,
              ),
            );
          }

          return Promise.resolve(transformTarget(row, selector.organization));
        });
      },
    ),
    async getTargetByCleanId({ organization, project, cleanId }) {
      const result = await pool.maybeOne<Slonik<targets>>(
        sql`SELECT * FROM public.targets WHERE clean_id = ${cleanId} AND project_id = ${project} LIMIT 1`,
      );

      if (!result) {
        return null;
      }

      return transformTarget(result, organization);
    },
    async getTargets({ organization, project }) {
      const results = await pool.query<Slonik<targets>>(
        sql`SELECT * FROM public.targets WHERE project_id = ${project} ORDER BY created_at DESC`,
      );

      return results.rows.map(r => transformTarget(r, organization));
    },
    async getTargetIdsOfOrganization({ organization }) {
      const results = await pool.query<Slonik<Pick<targets, 'id'>>>(
        sql`
          SELECT t.id as id FROM public.targets as t
          LEFT JOIN public.projects as p ON (p.id = t.project_id)
          WHERE p.org_id = ${organization}
          GROUP BY t.id
        `,
      );

      return results.rows.map(r => r.id);
    },
    async getTargetSettings({ target, project }) {
      const row = await pool.one<
        Pick<
          targets,
          | 'validation_enabled'
          | 'validation_percentage'
          | 'validation_period'
          | 'validation_excluded_clients'
        > & {
          targets: target_validation['destination_target_id'][];
        }
      >(sql`
        SELECT
          t.validation_enabled,
          t.validation_percentage,
          t.validation_period,
          t.validation_excluded_clients,
          array_agg(tv.destination_target_id) as targets
        FROM public.targets AS t
        LEFT JOIN public.target_validation AS tv ON (tv.target_id = t.id)
        WHERE t.id = ${target} AND t.project_id = ${project}
        GROUP BY t.id
        LIMIT 1
      `);

      return transformTargetSettings(row);
    },
    async setTargetValidation({ target, project, enabled }) {
      return transformTargetSettings(
        await pool.transaction(async trx => {
          const targetValidationRowExists = await trx.exists(sql`
            SELECT 1 FROM target_validation WHERE target_id = ${target}
          `);

          if (!targetValidationRowExists) {
            await trx.query(sql`
              INSERT INTO target_validation (target_id, destination_target_id) VALUES (${target}, ${target})
            `);
          }

          return trx.one<
            Pick<
              targets,
              | 'validation_enabled'
              | 'validation_percentage'
              | 'validation_period'
              | 'validation_excluded_clients'
            > & {
              targets: target_validation['destination_target_id'][];
            }
          >(sql`
          UPDATE public.targets as t
          SET validation_enabled = ${enabled}
          FROM
            (
              SELECT
                  it.id,
                  array_agg(tv.destination_target_id) as targets
              FROM public.targets AS it
              LEFT JOIN public.target_validation AS tv ON (tv.target_id = it.id)
              WHERE it.id = ${target} AND it.project_id = ${project}
              GROUP BY it.id
              LIMIT 1
            ) ret
          WHERE t.id = ret.id
          RETURNING ret.id, t.validation_enabled, t.validation_percentage, t.validation_period, t.validation_excluded_clients, ret.targets
        `);
        }),
      ).validation;
    },
    async updateTargetValidationSettings({
      target,
      project,
      percentage,
      period,
      targets,
      excludedClients,
    }) {
      return transformTargetSettings(
        await pool.transaction(async trx => {
          await trx.query(sql`
            DELETE
            FROM public.target_validation
            WHERE destination_target_id NOT IN (${sql.join(targets, sql`, `)})
              AND target_id = ${target}
          `);

          await trx.query(sql`
            INSERT INTO public.target_validation
              (target_id, destination_target_id)
            VALUES
            (
              ${sql.join(
                targets.map(dest => sql.join([target, dest], sql`, `)),
                sql`), (`,
              )}
            )
            ON CONFLICT (target_id, destination_target_id) DO NOTHING
          `);

          return trx.one(sql`
            UPDATE public.targets as t
            SET validation_percentage = ${percentage}, validation_period = ${period}, validation_excluded_clients = ${sql.array(
            excludedClients,
            'text',
          )}
            FROM (
              SELECT
                it.id,
                array_agg(tv.destination_target_id) as targets
              FROM public.targets AS it
              LEFT JOIN public.target_validation AS tv ON (tv.target_id = it.id)
              WHERE it.id = ${target} AND it.project_id = ${project}
              GROUP BY it.id
              LIMIT 1
            ) ret
            WHERE t.id = ret.id
            RETURNING t.id, t.validation_enabled, t.validation_percentage, t.validation_period, t.validation_excluded_clients, ret.targets;
          `);
        }),
      ).validation;
    },
    async hasSchema({ target }) {
      return pool.exists(
        sql`
          SELECT 1 FROM public.schema_versions as v WHERE v.target_id = ${target} LIMIT 1
        `,
      );
    },
    async getMaybeLatestValidVersion({ target }) {
      const version = await pool.maybeOne<
        Slonik<
          Pick<schema_versions, 'id' | 'is_composable' | 'created_at' | 'action_id' | 'base_schema'>
        >
      >(
        sql`
          SELECT sv.id, sv.is_composable, sv.created_at, sv.action_id, sv.base_schema
          FROM public.schema_versions as sv
          WHERE sv.target_id = ${target} AND sv.is_composable IS TRUE
          ORDER BY sv.created_at DESC
          LIMIT 1
        `,
      );

      if (!version) {
        return null;
      }

      return {
        id: version.id,
        valid: version.is_composable,
        date: version.created_at as any,
        commit: version.action_id,
        base_schema: version.base_schema,
      };
    },
    async getLatestValidVersion({ target }) {
      const version = await pool.one<
        Slonik<
          Pick<schema_versions, 'id' | 'is_composable' | 'created_at' | 'action_id' | 'base_schema'>
        >
      >(
        sql`
          SELECT sv.id, sv.is_composable, sv.created_at, sv.action_id, sv.base_schema
          FROM public.schema_versions as sv
          WHERE sv.target_id = ${target} AND sv.is_composable IS TRUE
          ORDER BY sv.created_at DESC
          LIMIT 1
        `,
      );

      return {
        id: version.id,
        valid: version.is_composable,
        date: version.created_at as any,
        commit: version.action_id,
        base_schema: version.base_schema,
      };
    },
    async getLatestVersion({ project, target }) {
      const version = await pool.one<
        Slonik<
          Pick<schema_versions, 'id' | 'is_composable' | 'created_at' | 'action_id' | 'base_schema'>
        >
      >(
        sql`
          SELECT sv.id, sv.is_composable, sv.created_at, sv.action_id, sv.base_schema
          FROM public.schema_versions as sv
          LEFT JOIN public.targets as t ON (t.id = sv.target_id)
          WHERE sv.target_id = ${target} AND t.project_id = ${project}
          ORDER BY sv.created_at DESC
          LIMIT 1
        `,
      );

      return {
        id: version.id,
        valid: version.is_composable,
        date: version.created_at as any,
        commit: version.action_id,
        base_schema: version.base_schema,
      };
    },

    async getMaybeLatestVersion({ project, target }) {
      const version = await pool.maybeOne<
        Slonik<
          Pick<schema_versions, 'id' | 'is_composable' | 'created_at' | 'action_id' | 'base_schema'>
        >
      >(
        sql`
          SELECT sv.id, sv.is_composable, sv.created_at, sv.action_id, sv.base_schema
          FROM public.schema_versions as sv
          LEFT JOIN public.targets as t ON (t.id = sv.target_id)
          WHERE sv.target_id = ${target} AND t.project_id = ${project}
          ORDER BY sv.created_at DESC
          LIMIT 1
        `,
      );

      if (!version) {
        return null;
      }

      return {
        id: version.id,
        valid: version.is_composable,
        date: version.created_at as any,
        commit: version.action_id,
        base_schema: version.base_schema,
      };
    },
    async getLatestSchemas({ organization, project, target }) {
      const latest = await pool.maybeOne<Pick<schema_versions, 'id' | 'is_composable'>>(sql`
        SELECT sv.id, sv.is_composable
        FROM public.schema_versions as sv
        LEFT JOIN public.targets as t ON (t.id = sv.target_id)
        LEFT JOIN public.schema_log as sl ON (sl.id = sv.action_id)
        WHERE t.id = ${target} AND t.project_id = ${project} AND sl.action = 'PUSH'
        ORDER BY sv.created_at DESC
        LIMIT 1
      `);

      if (!latest) {
        return null;
      }

      const schemas = await storage.getSchemasOfVersion({
        version: latest.id,
        organization,
        project,
        target,
      });

      return {
        version: latest.id,
        valid: latest.is_composable,
        schemas,
      };
    },
    async getSchemasOfVersion({ version, includeMetadata = false }) {
      const results = await pool.many<
        Pick<
          OverrideProp<schema_log, 'action', 'PUSH'>,
          | 'id'
          | 'commit'
          | 'action'
          | 'author'
          | 'sdl'
          | 'created_at'
          | 'project_id'
          | 'service_name'
          | 'service_url'
          | 'target_id'
          | 'metadata'
        > &
          Pick<projects, 'type'>
      >(
        sql`
          SELECT
            sl.id,
            sl.commit,
            sl.author,
            sl.action,
            sl.sdl,
            sl.created_at,
            sl.project_id,
            sl.service_name,
            sl.service_url,
            ${includeMetadata ? sql`sl.metadata,` : sql``}
            sl.target_id,
            p.type
          FROM public.schema_version_to_log AS svl
          LEFT JOIN public.schema_log AS sl ON (sl.id = svl.action_id)
          LEFT JOIN public.projects as p ON (p.id = sl.project_id)
          WHERE
            svl.version_id = ${version}
            AND sl.action = 'PUSH'
          ORDER BY
            sl.created_at DESC
        `,
      );

      return results.map(transformSchema);
    },
    async getSchemasOfPreviousVersion({ version, target }) {
      const results = await pool.query<
        OverrideProp<schema_log, 'action', 'PUSH'> & Pick<projects, 'type'>
      >(
        sql`
          SELECT sl.*, p.type FROM public.schema_version_to_log as svl
          LEFT JOIN public.schema_log as sl ON (sl.id = svl.action_id)
          LEFT JOIN public.projects as p ON (p.id = sl.project_id)
          WHERE svl.version_id = (
            SELECT sv.id FROM public.schema_versions as sv WHERE sv.created_at < (
              SELECT svi.created_at FROM public.schema_versions as svi WHERE svi.id = ${version}
            ) AND sv.target_id = ${target} ORDER BY sv.created_at DESC LIMIT 1
          ) AND sl.action = 'PUSH'
          ORDER BY c.created_at DESC
        `,
      );

      return results.rows.map(transformSchema);
    },
    async updateSchemaUrlOfVersion({ commit, url }) {
      // TODO: new registry should create a new version
      await pool.query(
        sql`
          UPDATE public.schema_log
          SET service_url = ${url ?? null}
          WHERE id = ${commit}
        `,
      );
    },

    async updateServiceName({ commit, name }) {
      await pool.query(
        sql`
          UPDATE public.schema_log
          SET service_name = ${name ?? null}
          WHERE id = ${commit}
        `,
      );
    },

    async getVersion({ project, target, version }) {
      const result = await pool.one<
        Slonik<
          Pick<
            schema_versions,
            'id' | 'is_composable' | 'created_at' | 'base_schema' | 'action_id'
          > &
            Pick<schema_log, 'author' | 'service_name'>
        >
      >(sql`
        SELECT 
          sv.id, sv.is_composable, sv.created_at, sv.base_schema, sv.action_id,
          sl.author, sl.service_name
        FROM public.schema_versions as sv
        LEFT JOIN public.schema_log as sl ON (sl.id = sv.action_id)
        LEFT JOIN public.targets as t ON (t.id = sv.target_id)
        WHERE sv.target_id = ${target} AND t.project_id = ${project} AND sv.id = ${version} LIMIT 1
      `);

      return {
        id: result.id,
        valid: result.is_composable,
        date: result.created_at as any,
        commit: result.action_id,
        base_schema: result.base_schema,
        author: result.author,
        service: result.service_name,
      };
    },

    async getVersions({ project, target, after, limit }) {
      const query = sql`
      SELECT 
        sv.id, sv.is_composable, sv.created_at, sv.base_schema, sv.action_id,
        sl.author, sl.service_name
      FROM public.schema_versions as sv
      LEFT JOIN public.schema_log as sl ON (sl.id = sv.action_id)
      LEFT JOIN public.targets as t ON (t.id = sv.target_id)
      WHERE sv.target_id = ${target} AND t.project_id = ${project} AND sv.created_at < ${
        after
          ? sql`(SELECT svi.created_at FROM public.schema_versions as svi WHERE svi.id = ${after})`
          : sql`NOW()`
      }
      ORDER BY sv.created_at DESC
      LIMIT ${limit + 1}
    `;
      const result = await pool.query<
        Pick<schema_versions, 'id' | 'is_composable' | 'created_at' | 'base_schema' | 'action_id'> &
          Pick<schema_log, 'author' | 'service_name'>
      >(query);

      const hasMore = result.rows.length > limit;

      const versions = result.rows.slice(0, limit).map(version => ({
        id: version.id,
        valid: version.is_composable,
        date: version.created_at as any,
        commit: version.action_id,
        base_schema: version.base_schema,
      }));

      return {
        versions,
        hasMore,
      };
    },
    async insertSchema({
      schema,
      commit,
      author,
      project,
      projectType,
      target,
      service = null,
      url = null,
      metadata,
    }) {
      const result = await pool.one<OverrideProp<schema_log, 'action', 'PUSH'>>(sql`
        INSERT INTO public.schema_log
          (
            author,
            service_name,
            service_url,
            commit,
            sdl,
            project_id,
            target_id,
            metadata,
            action
          )
        VALUES
          (
            ${author},
            ${service}::text,
            ${url}::text,
            ${commit}::text,
            ${schema}::text,
            ${project},
            ${target},
            ${metadata},
            'PUSH'
          )
        RETURNING *
      `);

      return transformSchema({ ...result, type: projectType });
    },
    async deleteSchema({ project, target, serviceName, composable }) {
      return pool.transaction(async trx => {
        // fetch the latest version
        const latestVersion = await trx.one<Pick<schema_versions, 'id' | 'base_schema'>>(
          sql`
          SELECT sv.id, sv.base_schema
          FROM public.schema_versions as sv
          WHERE sv.target_id = ${target}
          ORDER BY sv.created_at DESC
          LIMIT 1
        `,
        );

        // create a new action
        const deleteActionResult = await trx.one<schema_log>(sql`
          INSERT INTO public.schema_log
            (
              author,
              commit,
              service_name,
              project_id,
              target_id,
              action
            )
          VALUES
            (
              ${'system'}::text,
              ${'system'}::text,
              ${serviceName}::text,
              ${project},
              ${target},
              'DELETE'
            )
          RETURNING *
        `);

        // creates a new version
        const newVersion = await trx.one<Pick<schema_versions, 'id' | 'created_at'>>(sql`
          INSERT INTO public.schema_versions
            (
              is_composable,
              target_id,
              action_id,
              base_schema
            )
          VALUES
            (
              ${composable},
              ${target},
              ${deleteActionResult.id},
              ${latestVersion.base_schema}
            )
          RETURNING
            id,
            created_at
        `);

        // Move all the schema_version_to_log entries of the previous version to the new version
        await trx.query(sql`
          INSERT INTO public.schema_version_to_log
            (version_id, action_id)
          SELECT ${newVersion.id}::uuid as version_id, svl.action_id
          FROM public.schema_version_to_log svl
          LEFT JOIN public.schema_log sl ON (sl.id = svl.action_id)
          WHERE svl.version_id = ${latestVersion.id} AND sl.action = 'PUSH' AND sl.service_name != ${serviceName}
        `);

        await trx.query(sql`
          INSERT INTO public.schema_version_to_log
            (version_id, action_id)
          VALUES
            (${newVersion.id}, ${deleteActionResult.id})
        `);

        return {
          kind: 'composite',
          id: deleteActionResult.id,
          date: deleteActionResult.created_at as any,
          service_name: deleteActionResult.service_name!,
          target: deleteActionResult.target_id,
          action: 'DELETE',
        };
      });
    },
    async createVersion(input) {
      const newVersion = await pool.transaction(async trx => {
        // creates a new version
        const newVersion = await trx.one<Slonik<Pick<schema_versions, 'id' | 'created_at'>>>(sql`
          INSERT INTO public.schema_versions
            (
              is_composable,
              target_id,
              action_id,
              base_schema
            )
          VALUES
            (
              ${input.valid},
              ${input.target},
              ${input.commit},
              ${input.base_schema}
            )
          RETURNING
            id,
            created_at
        `);

        await Promise.all(
          input.commits.map(async cid => {
            await trx.query(sql`
              INSERT INTO public.schema_version_to_log
                (version_id, action_id)
              VALUES
              (${newVersion.id}, ${cid})
            `);
          }),
        );

        return newVersion;
      });

      return {
        id: newVersion.id,
        date: newVersion.created_at as any,
        url: input.url,
        valid: input.valid,
        commit: input.commit,
        base_schema: input.base_schema,
      };
    },

    async updateVersionStatus({ version, valid }) {
      return transformSchemaVersion(
        await pool.one<Slonik<schema_versions>>(sql`
          UPDATE public.schema_versions
          SET is_composable = ${valid}
          WHERE id = ${version}
          RETURNING *
        `),
      );
    },

    getSchemaLog: batch(async selectors => {
      const rows = await pool.many<schema_log & Pick<projects, 'type'>>(
        sql`
            SELECT sl.*, p.type
            FROM public.schema_log as sl
            LEFT JOIN public.projects as p ON (p.id = sl.project_id)
            WHERE (sl.id, sl.target_id) IN ((${sql.join(
              selectors.map(s => sql`${s.commit}, ${s.target}`),
              sql`), (`,
            )}))
        `,
      );
      const schemas = rows.map(transformSchemaLog);

      return selectors.map(selector => {
        const schema = schemas.find(
          row => row.id === selector.commit && row.target === selector.target,
        );

        if (schema) {
          return Promise.resolve(schema);
        }

        return Promise.reject(
          new Error(`Schema log not found (commit=${selector.commit}, target=${selector.target})`),
        );
      });
    }),
    async createActivity({ organization, project, target, user, type, meta }) {
      const { identifiers, values } = objectToParams<Omit<activities, 'id' | 'created_at'>>({
        activity_metadata: meta,
        activity_type: type,
        organization_id: organization,
        project_id: project ?? null,
        target_id: target ?? null,
        user_id: user ?? null,
      });

      await pool.query<Slonik<activities>>(
        sql`INSERT INTO public.activities (${identifiers}) VALUES (${values}) RETURNING *;`,
      );
    },
    async getActivities(selector) {
      let query: TaggedTemplateLiteralInvocation;
      if ('target' in selector) {
        query = sql`
          SELECT
            jsonb_agg(a.*) as activity,
            jsonb_agg(t.*) as target,
            jsonb_agg(p.*) as project,
            jsonb_agg(o.*) as organization,
            jsonb_agg(u.*) as user
          FROM public.activities as a
          LEFT JOIN public.targets as t ON (t.id = a.target_id)
          LEFT JOIN public.projects as p ON (p.id = a.project_id)
          LEFT JOIN public.organizations as o ON (o.id = a.organization_id)
          LEFT JOIN public.users as u ON (u.id = a.user_id)
          WHERE
            a.target_id = ${selector.target}
            AND a.project_id = ${selector.project}
            AND a.organization_id = ${selector.organization}
          GROUP BY a.created_at
          ORDER BY a.created_at DESC LIMIT ${selector.limit}
        `;
      } else if ('project' in selector) {
        query = sql`
          SELECT
            jsonb_agg(a.*) as activity,
            jsonb_agg(t.*) as target,
            jsonb_agg(p.*) as project,
            jsonb_agg(o.*) as organization,
            jsonb_agg(u.*) as user
          FROM public.activities as a
          LEFT JOIN public.targets as t ON (t.id = a.target_id)
          LEFT JOIN public.projects as p ON (p.id = a.project_id)
          LEFT JOIN public.organizations as o ON (o.id = a.organization_id)
          LEFT JOIN public.users as u ON (u.id = a.user_id)
          WHERE
            a.project_id = ${selector.project}
            AND a.organization_id = ${selector.organization}
          GROUP BY a.created_at
          ORDER BY a.created_at DESC LIMIT ${selector.limit}
        `;
      } else {
        query = sql`
          SELECT
            jsonb_agg(a.*) as activity,
            jsonb_agg(t.*) as target,
            jsonb_agg(p.*) as project,
            jsonb_agg(o.*) as organization,
            jsonb_agg(u.*) as user
          FROM public.activities as a
          LEFT JOIN public.targets as t ON (t.id = a.target_id)
          LEFT JOIN public.projects as p ON (p.id = a.project_id)
          LEFT JOIN public.organizations as o ON (o.id = a.organization_id)
          LEFT JOIN public.users as u ON (u.id = a.user_id)
          WHERE a.organization_id = ${selector.organization}
          GROUP BY a.created_at
          ORDER BY a.created_at DESC LIMIT ${selector.limit}
        `;
      }

      const result = await pool.query<
        Slonik<{
          activity: [activities];
          target: [targets];
          project: [projects];
          organization: [organizations];
          user: [users];
        }>
      >(query);

      return result.rows.map(transformActivity);
    },
    async insertPersistedOperation({ operationHash, project, name, kind, content }) {
      return transformPersistedOperation(
        await pool.one<Slonik<persisted_operations>>(sql`
          INSERT INTO public.persisted_operations
            (operation_hash, operation_name, operation_kind, content, project_id)
          VALUES
            (${operationHash}, ${name}, ${kind}, ${content}, ${project})
          RETURNING *
        `),
      );
    },
    async getPersistedOperations({ project }) {
      const results = await pool.query<Slonik<persisted_operations>>(
        sql`
          SELECT * FROM public.persisted_operations
          WHERE project_id = ${project}
          ORDER BY created_at DESC`,
      );

      return results.rows.map(transformPersistedOperation);
    },
    async getSelectedPersistedOperations({ project, hashes }) {
      const results = await pool.query<Slonik<persisted_operations>>(
        sql`
          SELECT * FROM public.persisted_operations
          WHERE project_id = ${project} AND operation_hash IN (${sql.join(hashes, sql`, `)})
          ORDER BY created_at DESC`,
      );

      return results.rows.map(transformPersistedOperation);
    },
    async getPersistedOperation({ operation, project }) {
      return transformPersistedOperation(
        await pool.one<Slonik<persisted_operations>>(
          sql`
            SELECT c.* FROM public.persisted_operations as c
            WHERE c.id = ${operation} AND project_id = ${project}`,
        ),
      );
    },
    async comparePersistedOperations({ project, hashes }) {
      const results = await pool.query<Pick<persisted_operations, 'operation_hash'>>(
        sql`
          SELECT operation_hash FROM public.persisted_operations
          WHERE project_id = ${project} AND operation_hash IN (${sql.join(hashes, sql`, `)})
          ORDER BY created_at DESC`,
      );

      return hashes.filter(hash => !results.rows.some(row => row.operation_hash === hash));
    },
    async deletePersistedOperation({ project, operation }) {
      const result = transformPersistedOperation(
        await pool.one<Slonik<persisted_operations>>(
          sql`
            DELETE FROM public.persisted_operations
            WHERE id = ${operation} AND project_id = ${project}
            RETURNING *
          `,
        ),
      );

      return result;
    },
    async addSlackIntegration({ organization, token }) {
      await pool.query<Slonik<organizations>>(
        sql`
          UPDATE public.organizations
          SET slack_token = ${token}
          WHERE id = ${organization}
        `,
      );
    },
    async deleteSlackIntegration({ organization }) {
      await pool.query<Slonik<organizations>>(
        sql`
          UPDATE public.organizations
          SET slack_token = NULL
          WHERE id = ${organization}
        `,
      );
    },
    async getSlackIntegrationToken({ organization }) {
      const result = await pool.maybeOne<Pick<organizations, 'slack_token'>>(
        sql`
          SELECT slack_token
          FROM public.organizations
          WHERE id = ${organization}
        `,
      );

      return result?.slack_token;
    },
    async addGitHubIntegration({ organization, installationId }) {
      await pool.query<Slonik<organizations>>(
        sql`
          UPDATE public.organizations
          SET github_app_installation_id = ${installationId}
          WHERE id = ${organization}
        `,
      );
    },
    async deleteGitHubIntegration({ organization }) {
      await pool.query<Slonik<organizations>>(
        sql`
          UPDATE public.organizations
          SET github_app_installation_id = NULL
          WHERE id = ${organization}
        `,
      );
      await pool.query<Slonik<projects>>(
        sql`
          UPDATE public.projects
          SET git_repository = NULL
          WHERE org_id = ${organization}
        `,
      );
    },
    async getGitHubIntegrationInstallationId({ organization }) {
      const result = await pool.maybeOne<Pick<organizations, 'github_app_installation_id'>>(
        sql`
          SELECT github_app_installation_id
          FROM public.organizations
          WHERE id = ${organization}
        `,
      );

      return result?.github_app_installation_id;
    },
    async addAlertChannel({ project, name, type, slack, webhook }) {
      return transformAlertChannel(
        await pool.one<Slonik<alert_channels>>(
          sql`
            INSERT INTO public.alert_channels
              ("name", "type", "project_id", "slack_channel", "webhook_endpoint")
            VALUES
              (${name}, ${type}, ${project}, ${slack?.channel ?? null}, ${
            webhook?.endpoint ?? null
          })
            RETURNING *
          `,
        ),
      );
    },
    async deleteAlertChannels({ project, channels }) {
      const result = await pool.query<Slonik<alert_channels>>(
        sql`
          DELETE FROM public.alert_channels
          WHERE
            project_id = ${project} AND
            id IN (${sql.join(channels, sql`, `)})
          RETURNING *
        `,
      );

      return result.rows.map(transformAlertChannel);
    },
    async getAlertChannels({ project }) {
      const result = await pool.query<Slonik<alert_channels>>(
        sql`SELECT * FROM public.alert_channels WHERE project_id = ${project} ORDER BY created_at DESC`,
      );

      return result.rows.map(transformAlertChannel);
    },

    async addAlert({ organization, project, target, channel, type }) {
      return transformAlert(
        await pool.one<Slonik<alerts>>(
          sql`
            INSERT INTO public.alerts
              ("type", "alert_channel_id", "target_id", "project_id")
            VALUES
              (${type}, ${channel}, ${target}, ${project})
            RETURNING *
          `,
        ),
        organization,
      );
    },
    async deleteAlerts({ organization, project, alerts }) {
      const result = await pool.query<Slonik<alerts>>(
        sql`
          DELETE FROM public.alerts
          WHERE
            project_id = ${project} AND
            id IN (${sql.join(alerts, sql`, `)})
          RETURNING *
        `,
      );

      return result.rows.map(row => transformAlert(row, organization));
    },
    async getAlerts({ organization, project }) {
      const result = await pool.query<Slonik<alerts>>(
        sql`SELECT * FROM public.alerts WHERE project_id = ${project} ORDER BY created_at DESC`,
      );

      return result.rows.map(row => transformAlert(row, organization));
    },
    async adminGetOrganizationsTargetPairs() {
      const results = await pool.query<
        Slonik<{
          organization: string;
          target: string;
        }>
      >(
        sql`
          SELECT
            o.id as organization,
            t.id as target
          FROM public.targets AS t
          LEFT JOIN public.projects AS p ON (p.id = t.project_id)
          LEFT JOIN public.organizations AS o ON (o.id = p.org_id)
        `,
      );
      return results.rows;
    },
    async getGetOrganizationsAndTargetPairsWithLimitInfo() {
      const results = await pool.query<
        Slonik<{
          organization: string;
          org_name: string;
          org_clean_id: string;
          owner_email: string;
          target: string;
          limit_operations_monthly: number;
          limit_retention_days: number;
        }>
      >(
        sql`
          SELECT
            o.id as organization,
            o.clean_id as org_clean_id,
            o.name as org_name,
            o.limit_operations_monthly,
            o.limit_retention_days,
            t.id as target,
            u.email as owner_email
          FROM public.targets AS t
          LEFT JOIN public.projects AS p ON (p.id = t.project_id)
          LEFT JOIN public.organizations AS o ON (o.id = p.org_id)
          LEFT JOIN public.users AS u ON (u.id = o.user_id)
        `,
      );
      return results.rows;
    },
    async adminGetStats(period: { from: Date; to: Date }) {
      // count schema versions by organization
      const versionsResult = pool.query<
        Slonik<
          Pick<organizations, 'id'> & {
            total: number;
          }
        >
      >(sql`
        SELECT
          COUNT(*) as total,
          o.id
        FROM versions AS v
        LEFT JOIN targets AS t ON (t.id = v.target_id)
        LEFT JOIN projects AS p ON (p.id = t.project_id)
        LEFT JOIN organizations AS o ON (o.id = p.org_id)
        WHERE
          v.created_at >= ${period.from.toISOString()}
          AND
          v.created_at < ${period.to.toISOString()}
        GROUP by o.id
      `);

      // count users by organization
      const usersResult = pool.query<
        Slonik<
          Pick<organizations, 'id'> & {
            total: number;
          }
        >
      >(sql`
        SELECT
          COUNT(*) as total,
          o.id
        FROM organization_member AS om
        LEFT JOIN organizations AS o ON (o.id = om.organization_id)
        GROUP by o.id
      `);

      // count projects by organization
      const projectsResult = pool.query<
        Slonik<
          Pick<organizations, 'id'> & {
            total: number;
          }
        >
      >(sql`
        SELECT
          COUNT(*) as total,
          o.id
        FROM projects AS p
        LEFT JOIN organizations AS o ON (o.id = p.org_id)
        GROUP by o.id
      `);

      // count targets by organization
      const targetsResult = pool.query<
        Slonik<
          Pick<organizations, 'id'> & {
            total: number;
          }
        >
      >(sql`
        SELECT
          COUNT(*) as total,
          o.id
        FROM targets AS t
        LEFT JOIN projects AS p ON (p.id = t.project_id)
        LEFT JOIN organizations AS o ON (o.id = p.org_id)
        GROUP by o.id
      `);

      // get organizations data
      const organizationsResult = pool.query<Slonik<organizations>>(sql`
        SELECT * FROM organizations
      `);

      const [versions, users, projects, targets, organizations] = await Promise.all([
        versionsResult,
        usersResult,
        projectsResult,
        targetsResult,
        organizationsResult,
      ]);

      const rows: Array<{
        organization: Organization;
        versions: number;
        users: number;
        projects: number;
        targets: number;
        persistedOperations: number;
        period: {
          from: Date;
          to: Date;
        };
      }> = [];

      function extractTotal<
        T extends {
          total: number;
          id: string;
        },
      >(nodes: readonly T[], id: string) {
        return nodes.find(node => node.id === id)?.total ?? 0;
      }

      for (const organization of organizations.rows) {
        rows.push({
          organization: transformOrganization(organization),
          versions: extractTotal(versions.rows, organization.id),
          users: extractTotal(users.rows, organization.id),
          projects: extractTotal(projects.rows, organization.id),
          targets: extractTotal(targets.rows, organization.id),
          persistedOperations: 0,
          period,
        });
      }

      return rows;
    },
    async getBaseSchema({ project, target }) {
      const data = await pool.maybeOne<Record<string, string>>(
        sql`SELECT base_schema FROM public.targets WHERE id=${target} AND project_id=${project}`,
      );
      return data!.base_schema;
    },
    async updateBaseSchema({ project, target }, base) {
      if (base) {
        await pool.query(
          sql`UPDATE public.targets SET base_schema = ${base} WHERE id = ${target} AND project_id = ${project}`,
        );
      } else {
        await pool.query(
          sql`UPDATE public.targets SET base_schema = null WHERE id = ${target} AND project_id = ${project}`,
        );
      }
    },
    async getBillingParticipants() {
      const results = await pool.query<Slonik<organizations_billing>>(
        sql`SELECT * FROM public.organizations_billing`,
      );

      return results.rows.map(transformOrganizationBilling);
    },
    async getOrganizationBilling(selector) {
      const results = await pool.query<Slonik<organizations_billing>>(
        sql`SELECT * FROM public.organizations_billing WHERE organization_id = ${selector.organization}`,
      );

      const mapped = results.rows.map(transformOrganizationBilling);

      return mapped[0] || null;
    },
    async deleteOrganizationBilling(selector) {
      await pool.query<Slonik<organizations_billing>>(
        sql`DELETE FROM public.organizations_billing
        WHERE organization_id = ${selector.organization}`,
      );
    },
    async createOrganizationBilling({
      billingEmailAddress,
      organizationId,
      externalBillingReference,
    }) {
      return transformOrganizationBilling(
        await pool.one<Slonik<organizations_billing>>(
          sql`
            INSERT INTO public.organizations_billing
              ("organization_id", "external_billing_reference_id", "billing_email_address")
            VALUES
              (${organizationId}, ${externalBillingReference}, ${billingEmailAddress || null})
            RETURNING *
          `,
        ),
      );
    },
    async completeGetStartedStep({ organization, step }) {
      await update(
        pool,
        'organizations',
        {
          [organizationGetStartedMapping[step]]: true,
        },
        {
          id: organization,
        },
      );
    },

    async getOIDCIntegrationById({ oidcIntegrationId: integrationId }) {
      const result = await pool.maybeOne<unknown>(sql`
        SELECT
          "id"
          , "linked_organization_id"
          , "client_id"
          , "client_secret"
          , "oauth_api_url"
          , "token_endpoint"
          , "userinfo_endpoint"
          , "authorization_endpoint"
        FROM
          "public"."oidc_integrations"
        WHERE
          "id" = ${integrationId}
        LIMIT 1
      `);

      if (result === null) {
        return null;
      }

      return decodeOktaIntegrationRecord(result);
    },

    async getOIDCIntegrationForOrganization({ organizationId }) {
      const result = await pool.maybeOne<unknown>(sql`
        SELECT
          "id"
          , "linked_organization_id"
          , "client_id"
          , "client_secret"
          , "oauth_api_url"
          , "token_endpoint"
          , "userinfo_endpoint"
          , "authorization_endpoint"
        FROM
          "public"."oidc_integrations"
        WHERE
          "linked_organization_id" = ${organizationId}
        LIMIT 1
      `);

      if (result === null) {
        return null;
      }

      return decodeOktaIntegrationRecord(result);
    },

    async createOIDCIntegrationForOrganization(args) {
      try {
        const result = await pool.maybeOne<unknown>(sql`
          INSERT INTO "public"."oidc_integrations" (
            "linked_organization_id",
            "client_id",
            "client_secret",
            "token_endpoint",
            "userinfo_endpoint",
            "authorization_endpoint"
          )
          VALUES (
            ${args.organizationId},
            ${args.clientId},
            ${args.encryptedClientSecret},
            ${args.tokenEndpoint},
            ${args.userinfoEndpoint},
            ${args.authorizationEndpoint}
          )
          RETURNING
            "id"
            , "linked_organization_id"
            , "client_id"
            , "client_secret"
            , "oauth_api_url"
            , "token_endpoint"
            , "userinfo_endpoint"
            , "authorization_endpoint"
        `);

        return {
          type: 'ok',
          oidcIntegration: decodeOktaIntegrationRecord(result),
        };
      } catch (error) {
        if (
          error instanceof UniqueIntegrityConstraintViolationError &&
          error.constraint === 'oidc_integrations_linked_organization_id_key'
        ) {
          return {
            type: 'error',
            reason: 'An OIDC integration already exists for this organization.',
          };
        }
        throw error;
      }
    },

    async updateOIDCIntegration(args) {
      const result = await pool.maybeOne<unknown>(sql`
        UPDATE "public"."oidc_integrations"
        SET
          "client_id" = ${args.clientId ?? sql`"client_id"`}
          , "client_secret" = ${args.encryptedClientSecret ?? sql`"client_secret"`}
          , "token_endpoint" = ${
            args.tokenEndpoint ??
            /** update existing columns to the old legacy values if not yet stored */
            sql`COALESCE("token_endpoint", CONCAT("oauth_api_url", "/token"))`
          }
          , "userinfo_endpoint" = ${
            args.userinfoEndpoint ??
            /** update existing columns to the old legacy values if not yet stored */
            sql`COALESCE("userinfo_endpoint", CONCAT("oauth_api_url", "/userinfo"))`
          }
          , "authorization_endpoint" = ${
            args.authorizationEndpoint ??
            /** update existing columns to the old legacy values if not yet stored */
            sql`COALESCE("authorization_endpoint", CONCAT("oauth_api_url", "/authorize"))`
          }
          , "oauth_api_url" = NULL
        WHERE
          "id" = ${args.oidcIntegrationId}
        RETURNING
          "id"
          , "linked_organization_id"
          , "client_id"
          , "client_secret"
          , "oauth_api_url"
          , "token_endpoint"
          , "userinfo_endpoint"
          , "authorization_endpoint"
      `);

      return decodeOktaIntegrationRecord(result);
    },

    async deleteOIDCIntegration(args) {
      await pool.query<unknown>(sql`
        DELETE FROM "public"."oidc_integrations"
        WHERE
          "id" = ${args.oidcIntegrationId}
      `);
    },

    idMutex: {
      async lock(id, { signal }) {
        return Promise.race([
          new Promise<never>((_, reject) => {
            const listener = () => {
              signal.removeEventListener('abort', listener);
              reject(new Error('Locking aborted'));
            };
            signal.addEventListener('abort', listener);
          }),
          (async () => {
            const lockConn = await getLockConn();
            if (signal.aborted) {
              throw new Error('Locking aborted');
            }

            // postgres advisory locks uses bigints as lock keys,
            // we therefore hash the provided lock id and use the hash
            const idInt = hashFnv32a(id);

            // wait if there's a lock in the process
            let lock;
            while ((lock = locks.get(id))) {
              await lock.p;
              if (signal.aborted) {
                throw new Error('Locking aborted');
              }
            }

            // only one lock can be acquired per process
            let release!: () => void;
            const p = new Promise<void>(resolve => (release = resolve));
            locks.set(id, {
              p,
              release,
            });

            // wait and acquire lock on the database (intra-process sync)
            let advisoryLock = false;
            try {
              let i = 0;
              while (!advisoryLock) {
                i++;
                if (i > 30) {
                  // 30 seconds is already too much
                  throw new Error('Lock was never acquired');
                }
                advisoryLock = await lockConn.oneFirst<boolean>(
                  sql`select pg_try_advisory_lock(${idInt}) as advisoryLock`,
                );
                if (!advisoryLock) {
                  // only sleep if not locked so that the loop can resolve fast if locked
                  await new Promise(resolve => setTimeout(resolve, 1_000));
                }
                if (signal.aborted) {
                  throw new Error('Locking aborted');
                }
              }
            } catch (err) {
              locks.delete(id);
              release();
              if (advisoryLock) {
                lockConn.query(sql`select pg_advisory_unlock(${idInt})`).catch(err => {
                  // warn for now, we'll rethink if it happens to much
                  console.warn(
                    `Error while unlocking advisory lock ${idInt} with id ${id} after error`,
                    err,
                  );
                });
              }
              throw err;
            }

            const listener = () => {
              signal.removeEventListener('abort', listener);
              if (locks.get(id)) {
                // unlock if aborted because the lock _was_ acquired at this time
                locks.delete(id);
                release();
                lockConn.query(sql`select pg_advisory_unlock(${idInt})`).catch(err => {
                  // warn for now, we'll rethink if it happens to much
                  console.warn(
                    `Error while unlocking advisory lock ${idInt} with id ${id} after abort`,
                    err,
                  );
                });
              }
            };
            signal.addEventListener('abort', listener);

            return async function unlock() {
              signal.removeEventListener('abort', listener);
              if (locks.get(id)) {
                locks.delete(id); // delete the lock first so that the while loop in lock can break
                release(); // release the process first (guarantees unlock if query below fails)
                await lockConn.query(sql`select pg_advisory_unlock(${idInt})`); // finally release the advisory lock
              }
            };
          })(),
        ]);
      },
    },
  };

  return storage;
}

function isDefined<T>(val: T | undefined | null): val is T {
  return val !== undefined && val !== null;
}

const OktaIntegrationBaseModel = zod.object({
  id: zod.string(),
  linked_organization_id: zod.string(),
  client_id: zod.string(),
  client_secret: zod.string(),
});

const OktaIntegrationLegacyModel = zod.intersection(
  OktaIntegrationBaseModel,
  zod.object({
    oauth_api_url: zod.string().url(),
  }),
);

const OktaIntegrationModel = zod.intersection(
  OktaIntegrationBaseModel,
  zod.object({
    token_endpoint: zod.string().url(),
    userinfo_endpoint: zod.string().url(),
    authorization_endpoint: zod.string().url(),
  }),
);

const OktaIntegrationModelUnion = zod.union([OktaIntegrationLegacyModel, OktaIntegrationModel]);

const decodeOktaIntegrationRecord = (result: unknown): OIDCIntegration => {
  const rawRecord = OktaIntegrationModelUnion.parse(result);

  // handle legacy case
  if ('oauth_api_url' in rawRecord) {
    return {
      id: rawRecord.id,
      clientId: rawRecord.client_id,
      encryptedClientSecret: rawRecord.client_secret,
      linkedOrganizationId: rawRecord.linked_organization_id,
      tokenEndpoint: `${rawRecord.oauth_api_url}/token`,
      userinfoEndpoint: `${rawRecord.oauth_api_url}/userinfo`,
      authorizationEndpoint: `${rawRecord.oauth_api_url}/authorize`,
    };
  }

  return {
    id: rawRecord.id,
    clientId: rawRecord.client_id,
    encryptedClientSecret: rawRecord.client_secret,
    linkedOrganizationId: rawRecord.linked_organization_id,
    tokenEndpoint: rawRecord.token_endpoint,
    userinfoEndpoint: rawRecord.userinfo_endpoint,
    authorizationEndpoint: rawRecord.authorization_endpoint,
  };
};

/**
 * Calculate a 32 bit FNV-1a hash
 * Found here: https://gist.github.com/vaiorabbit/5657561
 * Ref.: http://isthe.com/chongo/tech/comp/fnv/
 *
 * @param str - The input string value to be hashed
 */
function hashFnv32a(str: string): number {
  let i,
    l,
    hval = 0x811c9dc5;
  for (i = 0, l = str.length; i < l; i++) {
    hval ^= str.charCodeAt(i);
    hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
  }
  return hval >>> 0;
}
