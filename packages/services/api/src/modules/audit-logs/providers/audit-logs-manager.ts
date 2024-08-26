import { Injectable, Injector, Scope } from 'graphql-modules';
import { z } from 'zod';
import * as Sentry from '@sentry/node';
import { User } from '../../../shared/entities';
import { ClickHouse, sql } from '../../operations/providers/clickhouse-client';
import { SqlValue } from '../../operations/providers/sql';
import { OrganizationManager } from '../../organization/providers/organization-manager';
import { Logger } from '../../shared/providers/logger';
import { AuditLogEvent, auditLogSchema } from './audit-logs-types';

const auditLogEventTypes = auditLogSchema.options.map(option => option.shape.eventType.value);

export const AUDIT_LOG_CLICKHOUSE_OBJECT = z.object({
  id: z.string(),
  event_time: z.string(),
  user_id: z.string(),
  user_email: z.string(),
  organization_id: z.string(),
  event_action: z.enum(auditLogEventTypes as [string, ...string[]]),
  metadata:
    z.string().transform(x => auditLogSchema.parse(JSON.parse(x))) &&
    z.string().transform(x => JSON.parse(x)),
});

export type AuditLogType = z.infer<typeof AUDIT_LOG_CLICKHOUSE_OBJECT>;

const AuditLogClickhouseArrayModel = z.array(AUDIT_LOG_CLICKHOUSE_OBJECT);

type AuditLogsArgs = {
  selector: {
    organization: string;
  };
  filter: {
    userId: string;
    startDate: Date;
    endDate: Date;
  };
  pagination: {
    limit: number;
    offset: number;
  };
};

type AuditLogRecordEvent = {
  userId: string;
  userEmail: string;
  organizationId: string;
  user: (User & { isAdmin: boolean }) | null;
};

@Injectable({
  scope: Scope.Operation,
  global: true,
})
export class AuditLogManager {
  private logger: Logger;

  constructor(
    logger: Logger,
    private clickHouse: ClickHouse,
  ) {
    this.logger = logger.child({ source: 'AuditLogManager' });
  }

  createLogAuditEvent(event: AuditLogEvent, record: AuditLogRecordEvent): void {
    void this.internalCreateLogAuditEvent(event, record);
  }

  private async internalCreateLogAuditEvent(
    event: AuditLogEvent,
    record: AuditLogRecordEvent,
  ): Promise<void> {
    try {
      const { eventType } = event;
      const { organizationId, userEmail, userId } = record;
      this.logger.debug('Creating a log audit event (event=%o)', event);

      const parsedEvent = auditLogSchema.parse(event);
      const metadata = {
        user: record.user,
        ...parsedEvent,
      };

      const eventMetadata = JSON.stringify(metadata);
      const eventTime = new Date();

      const values = [eventTime, userId, userEmail, organizationId, eventType, eventMetadata];

      await this.clickHouse.insert({
        query: sql`
        INSERT INTO audit_log
        (event_time, user_id, user_email, organization_id, event_action, metadata)
        FORMAT CSV`,
        data: [values],
        timeout: 5000,
        queryId: 'create-audit-log',
      });
    } catch (error) {
      this.logger.error('Failed to create audit log event', error);
      Sentry.captureException(error, {
        extra: {
          event,
        },
      });
    }
  }

  async getPaginatedAuditLogs(
    props: AuditLogsArgs,
  ): Promise<{ total: number; data: AuditLogType[] }> {
    this.logger.info(
      'Getting paginated audit logs (organization=%s, filter=%o, pagination=%o)',
      props.selector.organization,
      props.filter,
      props.pagination,
    );

    if (!props.selector.organization) {
      throw new Error('Organization ID is required');
    }

    const sqlLimit = sql.raw(props.pagination.limit.toString());
    const sqlOffset = sql.raw(props.pagination.offset.toString());

    const where: SqlValue[] = [];
    where.push(sql`organization_id = ${props.selector.organization}`);

    if (props.filter?.userId) {
      where.push(sql`user_id = ${props.filter.userId}`);
    }

    if (props.filter?.startDate && props.filter?.endDate) {
      const from = this.formatToClickhouseDateTime(props.filter.startDate.toISOString());
      const to = this.formatToClickhouseDateTime(props.filter.endDate.toISOString());
      where.push(sql`event_time >= ${from} AND event_time <= ${to}`);
    }

    const whereClause = where.length > 0 ? sql`WHERE ${sql.join(where, ' AND ')}` : sql``;

    const result = await this.clickHouse.query({
      query: sql`
        SELECT *
        FROM audit_log
        ${whereClause}
        ORDER BY event_time DESC
        LIMIT ${sqlLimit}
        OFFSET ${sqlOffset}
      `,
      queryId: 'get-audit-logs',
      timeout: 5000,
    });

    const totalResult = await this.clickHouse.query({
      query: sql`
        SELECT COUNT(*)
        FROM audit_log
        ${whereClause}
      `,
      queryId: 'get-audit-logs-total',
      timeout: 5000,
    });

    return {
      total: totalResult.rows,
      data: AuditLogClickhouseArrayModel.parse(result.data),
    };
  }

  async resolveRecordAuditLog(event: AuditLogType, injector: Injector) {
    const currentOrganization = await injector.get(OrganizationManager).getOrganization({
      organization: event.organization_id,
    });
    console.log('event', event);
    return {
      userEmail: event.user_email,
      userId: event.user_id,
      organizationId: event.organization_id,
      user: event.metadata.user,
      organization: currentOrganization,
    };
  }

  formatToClickhouseDateTime(date: string): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  }
}
