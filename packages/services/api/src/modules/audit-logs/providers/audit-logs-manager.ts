import { stringify } from 'csv-stringify';
import { endOfDay, startOfDay } from 'date-fns';
import { Inject, Injectable, Scope } from 'graphql-modules';
import { decodeCreatedAtAndUUIDIdBasedCursor } from '@hive/storage';
import { captureException } from '@sentry/node';
import { Session } from '../../auth/lib/authz';
import { ClickHouse, sql } from '../../operations/providers/clickhouse-client';
import { SqlValue } from '../../operations/providers/sql';
import { Emails, mjml } from '../../shared/providers/emails';
import { Logger } from '../../shared/providers/logger';
import { S3_CONFIG, type S3Config } from '../../shared/providers/s3-config';
import { Storage } from '../../shared/providers/storage';
import { formatToClickhouseDateTime } from './audit-log-recorder';
import { AuditLogClickhouseArrayModel, AuditLogType } from './audit-logs-types';

@Injectable({
  scope: Scope.Operation,
})
/**
 * Responsible for accessing audit logs.
 */
export class AuditLogManager {
  private logger: Logger;

  constructor(
    logger: Logger,
    private clickHouse: ClickHouse,
    @Inject(S3_CONFIG) private s3Config: S3Config,
    private emailProvider: Emails,
    private session: Session,
    private storage: Storage,
  ) {
    this.logger = logger.child({ source: 'AuditLogManager' });
  }

  async getPaginatedAuditLogs(
    organizationId: string,
    first?: number | null,
    after?: string | null,
  ): Promise<{ data: AuditLogType[] }> {
    await this.session.assertPerformAction({
      action: 'auditLog:export',
      organizationId,
      params: {
        organizationId,
      },
    });

    this.logger.info(
      'Getting audit logs (organizationId: %s, first: %s, after: %s)',
      organizationId,
      first,
      after,
    );
    const limit = first ? (first > 0 ? Math.min(first, 25) : 25) : 25;
    const cursor = after ? decodeCreatedAtAndUUIDIdBasedCursor(after) : null;

    const where: SqlValue[] = [];
    where.push(sql`organization_id = ${organizationId}`);

    if (cursor?.createdAt) {
      where.push(sql`timestamp >= ${cursor.createdAt}`);
    }
    if (cursor?.id) {
      where.push(sql`id > ${cursor.id}`);
    }

    const whereClause = where.length > 0 ? sql`WHERE ${sql.join(where, ' AND ')}` : sql``;

    const query = sql`
      SELECT
        id
        , "timestamp"
        , "organization_id" AS "organizationId"
        , "event_action" AS "eventAction"
        , "user_id" AS "userId"
        , "user_email" AS "userEmail"
        , "metadata"
      FROM audit_logs
      ${whereClause}
      ORDER BY timestamp DESC, id DESC
      ${limit ? sql`LIMIT toInt64(${String(limit)})` : sql``}
    `;

    const result = await this.clickHouse.query({
      query,
      queryId: 'get-audit-logs',
      timeout: 10000,
    });

    const data = AuditLogClickhouseArrayModel.parse(result.data);

    return {
      data,
    };
  }

  async getAuditLogsByDateRange(
    organizationId: string,
    filter: { startDate: Date; endDate: Date },
  ): Promise<{ data: AuditLogType[] }> {
    await this.session.assertPerformAction({
      action: 'auditLog:export',
      organizationId,
      params: {
        organizationId,
      },
    });

    this.logger.info('Getting audit logs (organizationId=%s, filter=%o)', organizationId, filter);
    const where: SqlValue[] = [];
    where.push(sql`organization_id = ${organizationId}`);

    const from = formatToClickhouseDateTime(startOfDay(filter.startDate));
    const to = formatToClickhouseDateTime(endOfDay(filter.endDate));
    where.push(sql`timestamp >= ${from} AND timestamp <= ${to}`);

    const whereClause = where.length > 0 ? sql`WHERE ${sql.join(where, ' AND ')}` : sql``;

    const query = sql`
      SELECT
        id
        , "timestamp"
        , "organization_id" AS "organizationId"
        , "event_action" AS "eventAction"
        , "user_id" AS "userId"
        , "user_email" AS "userEmail"
        , "metadata"
      FROM audit_logs
      ${whereClause}
      ORDER BY timestamp DESC, id DESC
    `;

    const result = await this.clickHouse.query({
      query,
      queryId: 'get-audit-logs',
      timeout: 10000,
    });

    const data = AuditLogClickhouseArrayModel.parse(result.data);

    return {
      data,
    };
  }

  async exportAndSendEmail(
    organizationId: string,
    filter: { startDate: Date; endDate: Date },
  ): Promise<{
    ok: {
      url: string;
    } | null;
    error: {
      message: string;
    } | null;
  }> {
    await this.session.assertPerformAction({
      action: 'auditLog:export',
      organizationId,
      params: {
        organizationId,
      },
    });

    const getAllAuditLogs = await this.getAuditLogsByDateRange(organizationId, filter);

    if (!getAllAuditLogs || !getAllAuditLogs.data || getAllAuditLogs.data.length === 0) {
      return {
        ok: null,
        error: {
          message: 'No audit logs found for the given date range',
        },
      };
    }

    try {
      const { email } = await this.session.getViewer();
      const csvData = await new Promise<string>((resolve, reject) => {
        stringify(
          getAllAuditLogs.data,
          {
            header: true,
            columns: {
              id: 'id',
              timestamp: 'created_at',
              eventAction: 'event_type',
              userId: 'user_id',
              userEmail: 'user_email',
              metadata: 'metadata',
            },
          },
          (err, output) => {
            if (err) {
              reject(err);
            } else {
              resolve(output);
            }
          },
        );
      });

      const s3Storage = this.s3Config[0];
      const { endpoint, bucket, client } = s3Storage;
      const cleanStartDate = filter.startDate.toISOString().split('T')[0];
      const cleanEndDate = filter.endDate.toISOString().split('T')[0];
      const unixTimestampInSeconds = Math.floor(Date.now() / 1000);
      const key = `audit-logs/${organizationId}/${unixTimestampInSeconds}-${cleanStartDate}-${cleanEndDate}.csv`;
      const uploadResult = await client.fetch([endpoint, bucket, key].join('/'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/csv',
        },
        body: csvData,
      });

      if (!uploadResult.ok) {
        this.logger.error(`Failed to upload the file: ${uploadResult.url}`);
        captureException('Audit log: Failed to upload the file', {
          extra: {
            organizationId,
            filter,
          },
        });
        return {
          error: {
            message: 'Failed to generate the audit logs CSV',
          },
          ok: null,
        };
      }

      const getPresignedUrl = await client.fetch([endpoint, bucket, key].join('/'), {
        method: 'GET',
        aws: {
          signQuery: true,
        },
      });

      if (!getPresignedUrl.ok) {
        this.logger.error(`Failed to get the pre-signed URL: ${getPresignedUrl.url}`);
        captureException('Audit log: Failed to get the pre-signed URL', {
          extra: {
            organizationId,
            filter,
          },
        });
        return {
          error: {
            message: 'Failed to generate the audit logs CSV',
          },
          ok: null,
        };
      }

      const organization = await this.storage.getOrganization({
        organizationId,
      });
      const title = `Audit Logs for your organization ${organization.name} from ${cleanStartDate} to ${cleanEndDate}`;
      await this.emailProvider.schedule({
        email: email,
        subject: 'Hive - Audit Log Report',
        body: mjml`
            <mjml>
              <mj-body>
                <mj-section>
                  <mj-column>
                    <mj-image width="150px" src="https://graphql-hive.com/logo.png"></mj-image>
                    <mj-divider border-color="#ca8a04"></mj-divider>
                    <mj-text>
                      ${title}
                    </mj-text>.
                    <mj-button href="${getPresignedUrl.url}" background-color="#ca8a04">
                      Download Audit Logs CSV
                    </mj-button>
                  </mj-column>
                </mj-section>
              </mj-body>
            </mjml>
          `,
      });

      return {
        error: null,
        ok: {
          url: getPresignedUrl.url,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to export and send audit logs: ${error}`);
      captureException(error, {
        extra: {
          organizationId,
          filter,
        },
      });
      return {
        error: {
          message: 'Failed to generate the audit logs CSV',
        },
        ok: null,
      };
    }
  }

  async maskTokenForAuditLog(token: string): Promise<string> {
    return token.substring(0, 3) + '*'.repeat(token.length - 6) + token.substring(token.length - 3);
  }
}
