import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FilesModule } from './files/files.module';
import { AuditModule } from './audit/audit.module';
import { TenantsModule } from './tenants/tenants.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';

/**
 * Root application module.
 * Configures global providers, rate limiting, structured logging,
 * and imports all feature modules.
 */
@Module({
  imports: [
    // ── Environment configuration (global, available everywhere) ───────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      expandVariables: true,
    }),

    // ── Structured JSON logging with pino-pretty in dev ───────────────────
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                  colorize: true,
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname',
                },
              }
            : undefined,
        // Redact sensitive fields from logs
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.token',
          ],
          censor: '[REDACTED]',
        },
        // Automatically log request ID for tracing
        genReqId: (req) =>
          (req.headers['x-request-id'] as string) ??
          crypto.randomUUID(),
        customProps: () => ({
          service: 'nexus-vault-backend',
          version: process.env.npm_package_version ?? '1.0.0',
        }),
      },
    }),

    // ── Rate limiting: 100 requests per 60 seconds (global) ──────────────
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000, // 60 seconds in ms
        limit: 100,
      },
    ]),

    // ── Feature Modules ───────────────────────────────────────────────────
    PrismaModule,
    AuthModule,
    UsersModule,
    FilesModule,
    AuditModule,
    TenantsModule,
    AdminModule,
    HealthModule,
    MetricsModule,
  ],
  providers: [
    // ── Apply ThrottlerGuard globally to ALL routes ───────────────────────
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
