import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as admin from 'firebase-admin';
import { FastifyRequest } from 'fastify';
import { IS_PUBLIC_KEY } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Shape attached to request.user after token verification.
 */
export interface AuthenticatedUser {
  uid: string;
  email?: string;
  emailVerified?: boolean;
  tenantId?: string;
  role?: string;
  claims: admin.auth.DecodedIdToken;
}

/**
 * FirebaseAuthGuard — validates Firebase ID tokens on every protected route.
 *
 * Flow:
 * 1. Check if route is marked @Public() — skip if so
 * 2. Extract `Authorization: Bearer <token>` header
 * 3. Call Firebase Admin SDK verifyIdToken()
 * 4. Attach decoded token to request.user
 * 5. Throw UnauthorizedException on any failure
 *
 * The guard intentionally does NOT query PostgreSQL on every request for
 * performance. Role-based checks happen in RbacGuard using Firebase Custom
 * Claims, which are embedded in the JWT itself.
 */
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject('FIREBASE_ADMIN') private readonly firebaseApp: admin.app.App,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ── Check @Public() decorator ─────────────────────────────────────────
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<
      FastifyRequest & { user?: AuthenticatedUser }
    >();

    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException(
        'Missing authorization token. Include "Authorization: Bearer <token>" header.',
      );
    }

    try {
      let decodedToken: admin.auth.DecodedIdToken;

      // Local bypass for mock tokens in dev
      if (process.env.NODE_ENV !== 'production' && (token.startsWith('mock-token-') || token.startsWith('mock-token:'))) {
        let uid = '';
        let email = '';

        if (token.startsWith('mock-token:')) {
          const parts = token.split(':');
          uid = parts[1];
          email = parts[2];
        } else {
          uid = token.split('-').slice(2).join('-');
          email = `${uid.toLowerCase()}@demo-university.edu`;
        }

        let user = await this.prisma.user.findUnique({
          where: { uid },
        });

        if (!user) {
          const demoTenant = await this.prisma.tenant.findFirst({
            where: { slug: 'demo-university' },
          });
          if (!demoTenant) {
            throw new UnauthorizedException('Demo tenant not found in database.');
          }

          user = await this.prisma.user.create({
            data: {
              uid,
              email,
              displayName: email.split('@')[0],
              role: 'USER',
              tenantId: demoTenant.id,
              isActive: true,
            },
          });
        }

        decodedToken = {
          uid: user.uid,
          email: user.email ?? undefined,
          email_verified: true,
          role: user.role,
          tenantId: user.tenantId,
          aud: 'demo-nexusvault',
          auth_time: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
          firebase: {
            identities: {},
            sign_in_provider: 'custom',
          },
          iat: Math.floor(Date.now() / 1000),
          iss: 'https://securetoken.google.com/demo-nexusvault',
          sub: user.uid,
        } as unknown as admin.auth.DecodedIdToken;
      } else {
        // Verify token signature and expiry via Firebase Admin SDK
        decodedToken = await this.firebaseApp
          .auth()
          .verifyIdToken(token, true); // checkRevoked: true — catches revoked sessions
      }

      // Attach enriched user object to the request
      request.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        tenantId: (decodedToken['tenantId'] as string | undefined) ??
          (decodedToken['tenant_id'] as string | undefined),
        role: decodedToken['role'] as string | undefined,
        claims: decodedToken,
      };

      return true;
    } catch (err: unknown) {
      const error = err as Error & { code?: string };

      // Log auth failures for security monitoring (but not the token itself)
      this.logger.warn(
        `Token verification failed: ${error.code ?? error.message}`,
      );

      // Map Firebase error codes to user-facing messages
      if (error.code === 'auth/id-token-expired') {
        throw new UnauthorizedException(
          'Your session has expired. Please sign in again.',
        );
      }

      if (error.code === 'auth/id-token-revoked') {
        throw new UnauthorizedException(
          'Your session has been revoked. Please sign in again.',
        );
      }

      throw new UnauthorizedException(
        'Invalid or malformed authorization token.',
      );
    }
  }

  /**
   * Extracts the raw JWT from the Authorization header.
   * Expects format: "Bearer eyJ..."
   */
  private extractBearerToken(request: FastifyRequest): string | null {
    const authHeader = request.headers['authorization'];
    if (!authHeader || typeof authHeader !== 'string') {
      return null;
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return null;
    }

    return token;
  }
}
