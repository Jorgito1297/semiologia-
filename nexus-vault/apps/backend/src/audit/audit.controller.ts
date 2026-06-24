import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  Version,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { AuditService } from './audit.service';
import { AuditLogQueryDto } from './dto/audit.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RbacGuard } from '../auth/rbac.guard';
import { Roles, Role, TenantId } from '../common/decorators/roles.decorator';

/**
 * AuditController — audit log access and export endpoints.
 *
 * Mounted at: /api/v1/audit
 *
 * GET /        → paginated audit logs  [ADMIN+]
 * GET /export  → CSV download          [SUPER_ADMIN]
 */
@ApiTags('audit')
@ApiBearerAuth('Firebase-JWT')
@UseGuards(FirebaseAuthGuard, RbacGuard)
@Controller({ path: 'audit', version: '1' })
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * GET /api/v1/audit
   * Returns paginated, filterable audit logs scoped to the tenant.
   * Supports filtering by userId, action, date range, and HTTP method.
   */
  @Get()
  @Version('1')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Get audit logs (paginated)',
    description: 'Returns tenant-scoped audit logs. Supports filters by user, action, and date range.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated audit log entries',
    schema: {
      example: {
        data: [
          {
            id: 'uuid',
            userId: 'firebase-uid',
            action: 'FILE_UPLOAD',
            resource: '/api/v1/files',
            method: 'POST',
            statusCode: 201,
            createdAt: '2024-01-15T10:30:00Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      },
    },
  })
  async getAuditLogs(
    @TenantId() tenantId: string,
    @Query() query: AuditLogQueryDto,
  ): Promise<unknown> {
    return this.auditService.getAuditLogs(tenantId, query);
  }

  /**
   * GET /api/v1/audit/export
   * Exports audit logs as a CSV file. SUPER_ADMIN only.
   * Returns Content-Disposition: attachment header.
   * Capped at 10,000 records.
   */
  @Get('export')
  @Version('1')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Export audit logs as CSV (SUPER_ADMIN only)',
    description: 'Downloads audit logs as CSV. Capped at 10,000 records.',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV file stream',
    content: { 'text/csv': {} },
  })
  async exportAuditLogs(
    @TenantId() tenantId: string,
    @Query() query: AuditLogQueryDto,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const logs = await this.auditService.exportAuditLogs(tenantId, query);

    // Build CSV manually — avoids requiring additional streaming deps
    const headers = [
      'id',
      'userId',
      'userEmail',
      'action',
      'resource',
      'method',
      'statusCode',
      'ipAddress',
      'durationMs',
      'createdAt',
    ];

    const csvRows = [
      headers.join(','),
      ...logs.map((log) => {
        const l = log as Record<string, unknown>;
        return headers
          .map((h) => {
            const val = l[h];
            if (val === null || val === undefined) return '';
            const str = String(val).replace(/"/g, '""'); // Escape double quotes
            return `"${str}"`;
          })
          .join(',');
      }),
    ];

    const csv = csvRows.join('\n');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `audit-logs-${timestamp}.csv`;

    await reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .header('Cache-Control', 'no-cache')
      .send(csv);
  }
}
