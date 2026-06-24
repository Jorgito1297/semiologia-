import { Controller, Get, Version } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../files/storage.service';
import { Public } from '../common/decorators/roles.decorator';

/**
 * Shape of the health check response.
 */
interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: 'ok' | 'error';
    storage: 'ok' | 'error';
  };
}

/**
 * HealthController — liveness and readiness probes.
 *
 * Mounted at: /health (no /api prefix — for Kubernetes probes)
 *
 * GET /health → full health check including DB and storage connectivity
 *
 * This endpoint is marked @Public() to bypass authentication,
 * allowing load balancers and orchestrators to poll it freely.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * GET /health
   * Checks database and object storage connectivity.
   * Returns 200 if all checks pass, 503 if any critical check fails.
   */
  @Get()
  @Version('1')
  @Public()
  @ApiOperation({
    summary: 'Health check',
    description: 'Checks PostgreSQL and MinIO/S3 connectivity. Used by Kubernetes probes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2024-01-15T10:30:00.000Z',
        uptime: 3600.25,
        version: '1.0.0',
        checks: {
          database: 'ok',
          storage: 'ok',
        },
      },
    },
  })
  @ApiResponse({ status: 503, description: 'One or more services unavailable' })
  async check(): Promise<HealthStatus> {
    // Run checks in parallel — don't let one slow check block the other
    const [dbHealthy, storageHealthy] = await Promise.all([
      this.prisma.healthCheck(),
      this.storageService.isHealthy(),
    ]);

    const allHealthy = dbHealthy && storageHealthy;

    return {
      status: allHealthy ? 'ok' : dbHealthy ? 'degraded' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version ?? '1.0.0',
      checks: {
        database: dbHealthy ? 'ok' : 'error',
        storage: storageHealthy ? 'ok' : 'error',
      },
    };
  }

  /**
   * GET /health/liveness
   * Lightweight liveness probe — just confirms the process is alive.
   * Does NOT check external dependencies.
   */
  @Get('liveness')
  @Public()
  @ApiOperation({ summary: 'Liveness probe (no dependency checks)' })
  @ApiResponse({ status: 200, description: 'Process is alive' })
  liveness(): { status: string; uptime: number } {
    return {
      status: 'alive',
      uptime: process.uptime(),
    };
  }

  /**
   * GET /health/readiness
   * Readiness probe — checks if the service is ready to accept traffic.
   * Checks DB connectivity (required for all operations).
   */
  @Get('readiness')
  @Public()
  @ApiOperation({ summary: 'Readiness probe (checks database)' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  async readiness(): Promise<{ status: string; database: string }> {
    const dbHealthy = await this.prisma.healthCheck();

    return {
      status: dbHealthy ? 'ready' : 'not ready',
      database: dbHealthy ? 'ok' : 'error',
    };
  }
}
