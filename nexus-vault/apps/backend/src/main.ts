import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

/**
 * Bootstrap function — entry point for the NEXUS VAULT NestJS application.
 * Uses FastifyAdapter for higher throughput compared to Express.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false, // Pino handles logging separately
      trustProxy: true, // Needed behind reverse proxies (nginx, load balancers)
    }),
    { bufferLogs: true },
  );

  // ── Structured Pino logger ────────────────────────────────────────────────
  app.useLogger(app.get(Logger));

  // ── Security headers via @fastify/helmet ──────────────────────────────────
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
      },
    },
  });

  // ── Multipart file uploads via @fastify/multipart ────────────────────────
  await app.register(multipart, {
    limits: {
      fileSize: 52_428_800, // 50 MB
    },
  });

  // ── CORS — only allow whitelisted origins ─────────────────────────────────
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
    credentials: true,
  });

  // ── URI versioning: /api/v1/... ───────────────────────────────────────────
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // ── Global validation pipe ────────────────────────────────────────────────
  // whitelist: strips properties not in the DTO
  // forbidNonWhitelisted: throws 400 for unknown properties
  // transform: auto-casts primitives (string '1' → number 1)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global exception filter — prevents stack trace leakage ───────────────
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── Swagger / OpenAPI ─────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('NEXUS VAULT API')
    .setDescription(
      'Enterprise document management and secure file exchange platform',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'Firebase-JWT',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('files', 'File management')
    .addTag('audit', 'Audit logs')
    .addTag('admin', 'Administrative endpoints')
    .addTag('health', 'Health checks')
    .addTag('metrics', 'Prometheus metrics')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 4000;
  await app.listen(port, '0.0.0.0');

  const logger = app.get(Logger);
  logger.log(`🚀 NEXUS VAULT Backend running on port ${port}`, 'Bootstrap');
  logger.log(`📚 Swagger UI: http://localhost:${port}/api`, 'Bootstrap');
  logger.log(
    `🌍 Environment: ${process.env.NODE_ENV ?? 'development'}`,
    'Bootstrap',
  );
}

void bootstrap();
