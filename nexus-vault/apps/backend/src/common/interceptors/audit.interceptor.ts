import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FastifyRequest } from 'fastify';
import { AuditService } from '../../audit/audit.service';

/**
 * Decoded Firebase JWT attached to the request by FirebaseAuthGuard.
 */
interface AuthenticatedUser {
  uid: string;
  email?: string;
  tenantId?: string;
  claims?: {
    role?: string;
    [key: string]: unknown;
  };
}

/**
 * Maps an HTTP method + path pattern to a semantic action name.
 * These action names appear in the audit_logs table.
 */
function resolveAction(method: string, path: string): string {
  const upper = method.toUpperCase();

  // File operations
  if (upper === 'POST' && path.includes('/files/') && path.includes('/share'))
    return 'FILE_SHARE';
  if (upper === 'POST' && path.includes('/files')) return 'FILE_UPLOAD';
  if (upper === 'GET' && path.includes('/files') && path.includes('/download'))
    return 'FILE_DOWNLOAD';
  if (upper === 'DELETE' && path.includes('/files')) return 'FILE_DELETE';
  if (upper === 'GET' && path.includes('/files')) return 'FILE_LIST';

  // Auth operations
  if (upper === 'POST' && path.includes('/auth/verify')) return 'AUTH_VERIFY';
  if (upper === 'POST' && path.includes('/auth/logout')) return 'AUTH_LOGOUT';

  // User operations
  if (upper === 'PATCH' && path.includes('/users') && path.includes('/role'))
    return 'USER_ROLE_CHANGE';
  if (upper === 'DELETE' && path.includes('/users')) return 'USER_DELETE';
  if (upper === 'POST' && path.includes('/users')) return 'USER_CREATE';
  if (upper === 'PATCH' && path.includes('/users')) return 'USER_UPDATE';
  if (upper === 'GET' && path.includes('/users')) return 'USER_READ';

  // Admin operations
  if (path.includes('/admin')) return `ADMIN_${upper}`;

  // Audit log access
  if (path.includes('/audit')) return 'AUDIT_READ';

  // Tenant operations
  if (path.includes('/tenants')) return `TENANT_${upper}`;

  // Default fallback: METHOD /path
  return `${upper} ${path}`;
}

/**
 * AuditInterceptor — fires after every successful request.
 *
 * Uses tap() (RxJS side-effect operator) to run AFTER the response has been
 * sent. The audit log write is intentionally non-blocking (fire-and-forget)
 * to ensure it never adds latency to the response path.
 *
 * Only logs requests from authenticated users (request.user must be present).
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<
      FastifyRequest & { user?: AuthenticatedUser }
    >();

    // Skip audit for unauthenticated requests (health checks, metrics, etc.)
    if (!request.user) {
      return next.handle();
    }

    const { user } = request;
    const method = request.method;
    const path = request.url;
    const ip =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      request.ip ??
      'unknown';
    const userAgent = request.headers['user-agent'] ?? 'unknown';
    const action = resolveAction(method, path);
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          // Fire-and-forget: do not await, do not block response
          this.auditService
            .log({
              userId: user.uid,
              userEmail: user.email,
              tenantId: user.tenantId,
              action,
              resource: path,
              method,
              ipAddress: ip,
              userAgent,
              statusCode: 200,
              durationMs: Date.now() - startTime,
              metadata: {},
            })
            .catch((err: Error) => {
              // Log audit write failures but NEVER propagate them
              this.logger.error(
                `Audit log write failed: ${err.message}`,
                err.stack,
              );
            });
        },
        error: (err: Error) => {
          // Also audit failures so admins can see attempted operations
          this.auditService
            .log({
              userId: user.uid,
              userEmail: user.email,
              tenantId: user.tenantId,
              action: `${action}_FAILED`,
              resource: path,
              method,
              ipAddress: ip,
              userAgent,
              statusCode: 500,
              durationMs: Date.now() - startTime,
              metadata: { error: err.message },
            })
            .catch((logErr: Error) => {
              this.logger.error(
                `Audit log write failed: ${logErr.message}`,
                logErr.stack,
              );
            });
        },
      }),
    );
  }
}
