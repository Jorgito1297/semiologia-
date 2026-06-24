import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Prisma } from '@prisma/client';

/**
 * Standardized error response shape returned for every error.
 */
interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
  requestId?: string;
}

/**
 * GlobalExceptionFilter — catches ALL unhandled exceptions across the app.
 *
 * Responsibilities:
 * - Maps Prisma errors to appropriate HTTP status codes
 * - Prevents leaking stack traces or internal error messages in production
 * - Returns a consistent JSON error envelope for every failure
 * - Logs the full error internally (Pino) for observability
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const { statusCode, message, error } = this.resolveError(exception);

    // Always log the full error for internal tracing — never shown to clients
    this.logger.error(
      {
        statusCode,
        method: request.method,
        url: request.url,
        requestId: request.headers['x-request-id'],
        error: exception instanceof Error ? exception.stack : String(exception),
      },
      `[${statusCode}] ${request.method} ${request.url}`,
    );

    const body: ErrorResponse = {
      statusCode,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: request.headers['x-request-id'] as string | undefined,
    };

    void reply.status(statusCode).send(body);
  }

  /**
   * Resolves the appropriate HTTP status code, user-facing message, and error
   * name from any exception type. Never exposes stack traces or internal
   * Prisma error details to the client.
   */
  private resolveError(exception: unknown): {
    statusCode: number;
    message: string | string[];
    error: string;
  } {
    // ── NestJS HttpException (400, 401, 403, 404, etc.) ───────────────────
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      // NestJS ValidationPipe returns { message: string[], error: string }
      if (typeof response === 'object' && response !== null) {
        const res = response as Record<string, unknown>;
        return {
          statusCode: status,
          message: (res['message'] as string | string[]) ?? exception.message,
          error: (res['error'] as string) ?? this.httpStatusToError(status),
        };
      }

      return {
        statusCode: status,
        message: typeof response === 'string' ? response : exception.message,
        error: this.httpStatusToError(status),
      };
    }

    // ── Prisma known request errors (DB constraint violations etc.) ───────
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.mapPrismaError(exception);
    }

    // ── Prisma validation errors (bad query shapes) ───────────────────────
    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid data provided',
        error: 'Bad Request',
      };
    }

    // ── Prisma initialization / connection errors ─────────────────────────
    if (exception instanceof Prisma.PrismaClientInitializationError) {
      this.logger.error('Prisma initialization error — check DATABASE_URL');
      return {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Database temporarily unavailable',
        error: 'Service Unavailable',
      };
    }

    // ── Unknown / unexpected errors (never expose in production) ─────────
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: isProduction
        ? 'An unexpected error occurred. Please try again later.'
        : (exception instanceof Error ? exception.message : String(exception)),
      error: 'Internal Server Error',
    };
  }

  /**
   * Maps Prisma error codes to appropriate HTTP status codes and messages.
   * Reference: https://www.prisma.io/docs/reference/api-reference/error-reference
   */
  private mapPrismaError(err: Prisma.PrismaClientKnownRequestError): {
    statusCode: number;
    message: string;
    error: string;
  } {
    switch (err.code) {
      case 'P2002': {
        // Unique constraint violation — extract which field(s)
        const target = (err.meta?.['target'] as string[])?.join(', ') ?? 'field';
        return {
          statusCode: HttpStatus.CONFLICT,
          message: `A record with this ${target} already exists`,
          error: 'Conflict',
        };
      }

      case 'P2025':
        // Record not found
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'The requested record was not found',
          error: 'Not Found',
        };

      case 'P2003':
        // Foreign key constraint failure
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Related record does not exist',
          error: 'Bad Request',
        };

      case 'P2014':
        // Required relation violation
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Required relation is missing',
          error: 'Bad Request',
        };

      case 'P2016':
        // Query interpretation error
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid query parameters',
          error: 'Bad Request',
        };

      default:
        this.logger.error(`Unhandled Prisma error code: ${err.code}`);
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'A database error occurred',
          error: 'Internal Server Error',
        };
    }
  }

  /** Maps HTTP status codes to standard error strings */
  private httpStatusToError(status: number): string {
    const map: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      503: 'Service Unavailable',
    };
    return map[status] ?? 'Error';
  }
}
