import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role, ROLE_WEIGHT } from '../common/decorators/roles.decorator';
import { AuthenticatedUser } from './firebase-auth.guard';
import { FastifyRequest } from 'fastify';

/**
 * RbacGuard — Role-Based Access Control guard.
 *
 * Runs AFTER FirebaseAuthGuard (request.user is already set).
 *
 * Role hierarchy (highest → lowest privilege):
 *   SUPER_ADMIN (100) > ADMIN (80) > SUPERVISOR (60) >
 *   INSTRUCTOR (40) > USER (20) > STUDENT (10)
 *
 * A user with a higher-weighted role ALSO passes checks for lower roles.
 * e.g. @Roles(Role.ADMIN) will also allow SUPER_ADMIN.
 *
 * If no @Roles() decorator is present, access is granted (authentication
 * alone is sufficient).
 */
@Injectable()
export class RbacGuard implements CanActivate {
  private readonly logger = new Logger(RbacGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from @Roles() decorator (handler takes precedence)
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator → only authentication required, not specific role
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<
      FastifyRequest & { user?: AuthenticatedUser }
    >();

    const user = request.user;

    if (!user) {
      // Should not happen if FirebaseAuthGuard runs first
      throw new ForbiddenException('Authentication required');
    }

    // Resolve user's role from Firebase Custom Claims
    const userRole = (user.role ??
      (user.claims?.['role'] as string | undefined)) as Role | undefined;

    if (!userRole) {
      this.logger.warn(
        `User ${user.uid} has no role claim set. Denying access to ${context.getClass().name}.${context.getHandler().name}`,
      );
      throw new ForbiddenException(
        'Your account has not been assigned a role. Contact your administrator.',
      );
    }

    const userWeight = ROLE_WEIGHT[userRole] ?? 0;

    // User passes if their weight is >= ANY of the required role weights
    const hasPermission = requiredRoles.some((requiredRole) => {
      const requiredWeight = ROLE_WEIGHT[requiredRole] ?? 0;
      return userWeight >= requiredWeight;
    });

    if (!hasPermission) {
      this.logger.warn(
        `Access denied: User ${user.uid} has role ${userRole} ` +
          `but route requires one of [${requiredRoles.join(', ')}]`,
      );
      throw new ForbiddenException(
        `Insufficient permissions. Required role: ${requiredRoles.join(' or ')}`,
      );
    }

    return true;
  }
}
