import {
  Controller,
  Get,
  UseGuards,
  Version,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AdminService, DashboardMetrics, StorageStats } from './admin.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RbacGuard } from '../auth/rbac.guard';
import { Roles, Role, TenantId } from '../common/decorators/roles.decorator';

/**
 * AdminController — administrative metrics and management endpoints.
 *
 * Mounted at: /api/v1/admin
 *
 * GET /metrics        → dashboard metrics     [ADMIN+]
 * GET /storage        → storage statistics    [ADMIN+]
 * GET /users/active   → active users list     [ADMIN+]
 */
@ApiTags('admin')
@ApiBearerAuth('Firebase-JWT')
@UseGuards(FirebaseAuthGuard, RbacGuard)
@Roles(Role.ADMIN) // Default for all routes in this controller
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * GET /api/v1/admin/metrics
   * Returns KPI dashboard metrics: user count, file count, storage used,
   * audit log count, and the 10 most recent activity events.
   */
  @Get('metrics')
  @Version('1')
  @ApiOperation({
    summary: 'Get dashboard metrics',
    description: 'Returns aggregate KPIs for the tenant dashboard.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard metrics',
    schema: {
      example: {
        usersCount: 142,
        filesCount: 1893,
        storageBytesUsed: 10737418240,
        auditLogsCount: 45231,
        recentActivity: [],
      },
    },
  })
  async getDashboardMetrics(
    @TenantId() tenantId: string,
  ): Promise<DashboardMetrics> {
    return this.adminService.getDashboardMetrics(tenantId);
  }

  /**
   * GET /api/v1/admin/storage
   * Returns storage utilization broken down by MIME type and top users.
   */
  @Get('storage')
  @Version('1')
  @ApiOperation({
    summary: 'Get storage statistics',
    description: 'Storage breakdown by file type and top 20 users by usage.',
  })
  @ApiResponse({
    status: 200,
    description: 'Storage statistics',
  })
  async getStorageStats(
    @TenantId() tenantId: string,
  ): Promise<StorageStats> {
    return this.adminService.getStorageStats(tenantId);
  }

  /**
   * GET /api/v1/admin/users/active
   * Returns users who have performed at least one action in the last 30 days.
   */
  @Get('users/active')
  @Version('1')
  @ApiOperation({
    summary: 'Get active users (last 30 days)',
    description: 'Users with at least one audit event in the past 30 days.',
  })
  @ApiResponse({
    status: 200,
    description: 'Active user list',
    schema: {
      example: [
        {
          uid: 'firebase-uid',
          email: 'user@example.com',
          lastActivity: '2024-01-15T10:30:00Z',
          actionsCount: 47,
        },
      ],
    },
  })
  async getActiveUsers(
    @TenantId() tenantId: string,
  ): Promise<unknown[]> {
    return this.adminService.getActiveUsers(tenantId);
  }
}
