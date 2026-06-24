import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Metadata key used by RolesGuard to retrieve required roles.
 */
export const ROLES_KEY = 'roles';

/**
 * Metadata key used by FirebaseAuthGuard to skip authentication.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Role enum — mirrors the roles stored in PostgreSQL and Firebase Custom Claims.
 *
 * Hierarchy (highest to lowest privilege):
 * SUPER_ADMIN > ADMIN > SUPERVISOR > INSTRUCTOR > USER > STUDENT
 */
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  INSTRUCTOR = 'INSTRUCTOR',
  USER = 'USER',
  STUDENT = 'STUDENT',
}

/**
 * Numeric weight for role hierarchy comparison.
 * Higher number = more privileged.
 */
export const ROLE_WEIGHT: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 100,
  [Role.ADMIN]: 80,
  [Role.SUPERVISOR]: 60,
  [Role.INSTRUCTOR]: 40,
  [Role.USER]: 20,
  [Role.STUDENT]: 10,
};

/**
 * @Roles(...roles) — restricts a controller or route handler to users
 * whose role is in the provided list.
 *
 * @example
 * @Roles(Role.ADMIN, Role.SUPER_ADMIN)
 * @Get('/sensitive')
 * getSensitiveData() { ... }
 */
export const Roles = (...roles: Role[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(ROLES_KEY, roles);

/**
 * @Public() — marks a route as publicly accessible (skips FirebaseAuthGuard).
 *
 * @example
 * @Public()
 * @Get('/health')
 * healthCheck() { ... }
 */
export const Public = (): ReturnType<typeof SetMetadata> =>
  SetMetadata(IS_PUBLIC_KEY, true);

/**
 * @CurrentUser() — parameter decorator that injects the authenticated user
 * object from the request. The user object is attached by FirebaseAuthGuard.
 *
 * @example
 * @Get('/me')
 * getProfile(@CurrentUser() user: FirebaseDecodedToken) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: unknown }>();
    return request.user;
  },
);

/**
 * @TenantId() — parameter decorator that injects the tenantId from the
 * authenticated user's claims. Shorthand for @CurrentUser().tenantId.
 *
 * @example
 * @Get('/')
 * listFiles(@TenantId() tenantId: string) { ... }
 */
export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{
      user?: { tenantId?: string };
    }>();
    return request.user?.tenantId;
  },
);
