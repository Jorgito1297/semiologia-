import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuthModule } from '../auth/auth.module';

/**
 * AuditModule — audit log persistence and retrieval.
 *
 * AuditService is exported so AuditInterceptor (in common) can use it.
 * PrismaModule is @Global(), so no explicit import needed.
 */
@Module({
  imports: [AuthModule],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
