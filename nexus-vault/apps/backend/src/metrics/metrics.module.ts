import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';

/**
 * MetricsModule — Prometheus metrics collection and exposition.
 *
 * MetricsService is exported so other modules (FilesService, AuditService)
 * can inject it to record business-specific metrics.
 */
@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
