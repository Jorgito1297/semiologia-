import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { FilesModule } from '../files/files.module';

/**
 * HealthModule — liveness and readiness health check endpoints.
 *
 * Imports FilesModule to access StorageService for storage health checks.
 * PrismaModule is @Global(), so no import needed.
 */
@Module({
  imports: [FilesModule],
  controllers: [HealthController],
})
export class HealthModule {}
