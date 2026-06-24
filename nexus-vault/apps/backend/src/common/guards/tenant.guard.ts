import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../decorators/roles.decorator';

/**
 * TenantGuard — enforces multi-tenant data isolation.
 *
 * Rules:
 * - SUPER_ADMIN can access any tenant
 * - All other roles can only access their own tenant's data
 * - Reads tenantId from: route params, query string, or request body
 * - If no tenantId is present in the request, injects the user's own tenantId
 *
 * Usage: Apply AFTER FirebaseAuthGuard
 * @UseGuards(FirebaseAuthGuard, TenantGuard)
 */
@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: { uid: string; tenantId?: string; role?: string };
      params?: Record<string, string>;
      query?: Record<string, string>;
      body?: Record<string, unknown>;
      tenantId?: string;
    }>();

    const user = request.user;

    // If no user is present, let FirebaseAuthGuard handle the 401
    if (!user) return true;

    // SUPER_ADMIN bypasses all tenant isolation checks
    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    // Extract tenantId from various request locations (priority order)
    const requestedTenantId: string | undefined =
      request.params?.['tenantId'] ??
      request.query?.['tenantId'] ??
      (request.body?.['tenantId'] as string | undefined);

    // No specific tenant requested — auto-inject the user's own tenantId
    if (!requestedTenantId) {
      request.tenantId = user.tenantId;
      return true;
    }

    // Validate tenant ownership — reject cross-tenant access
    if (requestedTenantId !== user.tenantId) {
      this.logger.warn(
        `[TenantGuard] Cross-tenant access attempt: ` +
          `user=${user.uid} (tenant=${user.tenantId}) ` +
          `tried to access tenant=${requestedTenantId} ` +
          `via ${context.getClass().name}#${context.getHandler().name}`,
      );
      throw new ForbiddenException(
        'Access denied: you cannot access resources from another tenant.',
      );
    }

    request.tenantId = user.tenantId;
    return true;
  }
}
