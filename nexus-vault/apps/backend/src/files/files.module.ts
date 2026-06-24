import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { StorageService } from './storage.service';
import { AuthModule } from '../auth/auth.module';

/**
 * FilesModule — file upload, download, and management feature module.
 *
 * StorageService is provided here and exported so AdminModule and
 * HealthModule can use it for stats/health checks.
 */
@Module({
  imports: [AuthModule],
  controllers: [FilesController],
  providers: [FilesService, StorageService],
  exports: [FilesService, StorageService],
})
export class FilesModule {}
