import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService — extends PrismaClient to integrate with NestJS lifecycle hooks.
 *
 * Responsibilities:
 * - Connect to PostgreSQL on module initialization
 * - Disconnect on module destroy (graceful shutdown)
 * - Provide query logging in development mode
 * - Singleton: shared across the entire application
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      // Log queries in development for debugging; errors always logged
      log:
        process.env.NODE_ENV === 'development'
          ? [
              { emit: 'event', level: 'query' },
              { emit: 'event', level: 'info' },
              { emit: 'event', level: 'warn' },
              { emit: 'event', level: 'error' },
            ]
          : [
              { emit: 'event', level: 'warn' },
              { emit: 'event', level: 'error' },
            ],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Wire up Prisma query events to Pino logger in development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).$on('query', (event: { query: string; duration: number }) => {
        this.logger.debug(`Query (${event.duration}ms): ${event.query}`);
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).$on('error', (event: { message: string }) => {
      this.logger.error(`Prisma error: ${event.message}`);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).$on('warn', (event: { message: string }) => {
      this.logger.warn(`Prisma warning: ${event.message}`);
    });
  }

  /**
   * Called when the NestJS module is initialized.
   * Establishes the PostgreSQL connection pool.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('✅ PostgreSQL connected via Prisma');
    } catch (err) {
      this.logger.error('❌ Failed to connect to PostgreSQL', err);
      throw err;
    }
  }

  /**
   * Called when the NestJS module is destroyed (e.g. SIGTERM).
   * Releases all connection pool resources.
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('PostgreSQL connection closed');
  }

  /**
   * Checks if the database is reachable.
   * Used by the health controller to report database status.
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
