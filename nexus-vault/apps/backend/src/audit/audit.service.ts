import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuditLogDto, AuditLogQueryDto } from './dto/audit.dto';
import { PaginatedResult } from '../users/users.service';

/**
 * AuditService — persistent audit logging for compliance and security monitoring.
 *
 * Design principles:
 * - log() is intentionally non-async-blocking in the interceptor (fire-and-forget)
 * - All failed log writes are caught and logged to stdout; never rethrown
 * - Audit records are immutable — no update/delete operations exposed
 * - Tenant-scoped queries for all read operations
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persists an audit log entry to the audit_logs table.
   * Returns a Promise but callers typically don't await it.
   */
  async log(entry: CreateAuditLogDto): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId,
          userEmail: entry.userEmail ?? null,
          tenantId: entry.tenantId ?? null,
          action: entry.action,
          resource: entry.resource,
          method: entry.method,
          ipAddress: entry.ipAddress ?? null,
          userAgent: entry.userAgent ?? null,
          statusCode: entry.statusCode ?? null,
          durationMs: entry.durationMs ?? null,
          metadata: (entry.metadata as any) ?? {},
        },
      });
    } catch (err) {
      // CRITICAL: audit write failures must never propagate to the caller
      this.logger.error(
        `Failed to write audit log [${entry.action}] for user ${entry.userId}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Returns paginated audit logs filtered by tenant and optional query params.
   * ADMIN+ only (enforced in controller).
   */
  async getAuditLogs(
    tenantId: string,
    query: AuditLogQueryDto,
  ): Promise<PaginatedResult<unknown>> {
    const { page = 1, limit = 50, userId, action, startDate, endDate, method } =
      query;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      ...(userId && { userId }),
      ...(action && { action: { contains: action, mode: 'insensitive' as const } }),
      ...(method && { method: method.toUpperCase() }),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
    };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Returns all matching audit logs as an array for CSV export.
   * Capped at 10,000 records to prevent memory exhaustion.
   * SUPER_ADMIN only (enforced in controller).
   */
  async exportAuditLogs(
    tenantId: string,
    query: AuditLogQueryDto,
  ): Promise<unknown[]> {
    const { userId, action, startDate, endDate, method } = query;

    const where = {
      tenantId,
      ...(userId && { userId }),
      ...(action && { action: { contains: action, mode: 'insensitive' as const } }),
      ...(method && { method: method.toUpperCase() }),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
    };

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10_000, // Safety cap
    });
  }

  /**
   * Returns recent activity for a specific user.
   * Used by the admin dashboard.
   */
  async getUserActivity(
    userId: string,
    tenantId: string,
    limit = 20,
  ): Promise<unknown[]> {
    return this.prisma.auditLog.findMany({
      where: { userId, tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
