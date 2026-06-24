import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Shape of dashboard metrics response.
 */
export interface DashboardMetrics {
  usersCount: number;
  filesCount: number;
  storageBytesUsed: number;
  auditLogsCount: number;
  recentActivity: unknown[];
}

/**
 * Shape of storage statistics response.
 */
export interface StorageStats {
  totalBytes: number;
  byMimeType: Array<{ mimeType: string; count: number; totalBytes: number }>;
  byUser: Array<{ userId: string; userEmail: string | null; count: number; totalBytes: number }>;
}

/**
 * AdminService — dashboard metrics and administrative analytics.
 *
 * All queries are tenant-scoped for multi-tenant safety.
 */
@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns summary metrics for the admin dashboard.
   * Runs all queries in parallel for performance.
   */
  async getDashboardMetrics(tenantId: string): Promise<DashboardMetrics> {
    const [usersCount, filesResult, auditCount, recentActivity] =
      await Promise.all([
        // Total active users in tenant
        this.prisma.user.count({
          where: { tenantId, deletedAt: null },
        }),

        // File count and storage usage
        this.prisma.file.aggregate({
          where: { tenantId, deletedAt: null },
          _count: { id: true },
          _sum: { size: true },
        }),

        // Total audit log entries
        this.prisma.auditLog.count({
          where: { tenantId },
        }),

        // Recent audit activity (last 10 events)
        this.prisma.auditLog.findMany({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            userId: true,
            userEmail: true,
            action: true,
            resource: true,
            createdAt: true,
          },
        }),
      ]);

    return {
      usersCount,
      filesCount: filesResult._count.id,
      storageBytesUsed: Number(filesResult._sum.size ?? 0),
      auditLogsCount: auditCount,
      recentActivity,
    };
  }

  /**
   * Returns storage breakdown by MIME type and top users.
   * Useful for capacity planning and quota enforcement.
   */
  async getStorageStats(tenantId: string): Promise<StorageStats> {
    // Group by MIME type
    const byMimeTypeRaw = await this.prisma.file.groupBy({
      by: ['mimeType'],
      where: { tenantId, deletedAt: null },
      _count: { id: true },
      _sum: { size: true },
      orderBy: { _sum: { size: 'desc' } },
    });

    const byMimeType = byMimeTypeRaw.map((row) => ({
      mimeType: row.mimeType,
      count: row._count.id,
      totalBytes: Number(row._sum.size ?? 0),
    }));

    // Group by owner user (join with user table for email)
    const byUserRaw = await this.prisma.file.groupBy({
      by: ['ownerId'],
      where: { tenantId, deletedAt: null },
      _count: { id: true },
      _sum: { size: true },
      orderBy: { _sum: { size: 'desc' } },
      take: 20, // Top 20 users by storage
    });

    // Enrich with user emails
    const userIds = byUserRaw.map((r) => r.ownerId);
    const users = await this.prisma.user.findMany({
      where: { uid: { in: userIds } },
      select: { uid: true, email: true },
    });
    const userEmailMap = new Map(users.map((u) => [u.uid, u.email]));

    const byUser = byUserRaw.map((row) => ({
      userId: row.ownerId,
      userEmail: userEmailMap.get(row.ownerId) ?? null,
      count: row._count.id,
      totalBytes: Number(row._sum.size ?? 0),
    }));

    const totalBytes = byMimeType.reduce((sum, r) => sum + r.totalBytes, 0);

    return { totalBytes, byMimeType, byUser };
  }

  /**
   * Returns users who have been active in the last 30 days.
   * "Active" = has at least one audit log entry in the period.
   */
  async getActiveUsers(
    tenantId: string,
  ): Promise<Array<{ uid: string; email: string | null; lastActivity: Date; actionsCount: number }>> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get distinct users with activity count
    const activityByUser = await this.prisma.auditLog.groupBy({
      by: ['userId'],
      where: {
        tenantId,
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { id: true },
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: 'desc' } },
      take: 50,
    });

    // Enrich with user details
    const userIds = activityByUser.map((a) => a.userId);
    const users = await this.prisma.user.findMany({
      where: { uid: { in: userIds }, deletedAt: null },
      select: { uid: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.uid, u]));

    return activityByUser
      .filter((a) => userMap.has(a.userId))
      .map((a) => ({
        uid: a.userId,
        email: userMap.get(a.userId)?.email ?? null,
        lastActivity: a._max.createdAt as Date,
        actionsCount: a._count.id,
      }));
  }
}
