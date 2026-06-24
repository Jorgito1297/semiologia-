import {
  Injectable,
  Inject,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/decorators/roles.decorator';
import { RoleType } from '@prisma/client';

/**
 * Result returned from syncUserToDatabase
 */
export interface SyncedUser {
  id: string;
  uid: string;
  email: string | null;
  role: string;
  tenantId: string | null;
  createdAt: Date;
}

/**
 * AuthService — all Firebase authentication business logic.
 *
 * Responsibilities:
 * - Token verification and revocation via Firebase Admin SDK
 * - Custom claims management (role assignment)
 * - User synchronization from Firebase to PostgreSQL
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject('FIREBASE_ADMIN') private readonly firebaseApp: admin.app.App,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Verifies a Firebase ID token and returns the decoded token.
   * checkRevoked: true ensures revoked sessions are rejected.
   */
  async verifyToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    if (process.env.NODE_ENV !== 'production' && (idToken.startsWith('mock-token-') || idToken.startsWith('mock-token:'))) {
      let uid = '';
      let email = '';

      if (idToken.startsWith('mock-token:')) {
        const parts = idToken.split(':');
        uid = parts[1];
        email = parts[2];
      } else {
        uid = idToken.split('-').slice(2).join('-');
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

      return {
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
    }

    try {
      return await this.firebaseApp.auth().verifyIdToken(idToken, true);
    } catch (err: unknown) {
      const error = err as Error & { code?: string };
      this.logger.warn(`Token verification failed: ${error.code ?? error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Retrieves the Firebase Custom Claims for a user by UID.
   * Custom claims are the source of truth for role information.
   */
  async getUserClaims(
    uid: string,
  ): Promise<Record<string, unknown> | undefined> {
    const userRecord = await this.firebaseApp.auth().getUser(uid);
    return userRecord.customClaims as Record<string, unknown> | undefined;
  }

  /**
   * Sets a Firebase Custom Claim 'role' for the given user UID.
   * Custom claims are embedded in the user's JWT on next token refresh.
   *
   * ⚠️  Custom claims are limited to 1000 bytes total. Keep them minimal.
   */
  async setUserRole(uid: string, role: Role): Promise<void> {
    await this.firebaseApp.auth().setCustomUserClaims(uid, { role });
    this.logger.log(`Set role '${role}' for user ${uid}`);
  }

  /**
   * Syncs a Firebase-authenticated user into the PostgreSQL database.
   * Uses upsert so repeated calls are idempotent.
   *
   * Called after every successful authentication to keep DB in sync with Firebase.
   */
  async syncUserToDatabase(
    decodedToken: admin.auth.DecodedIdToken,
  ): Promise<SyncedUser> {
    const tenantId = (decodedToken['tenantId'] as string | undefined) ??
      (decodedToken['tenant_id'] as string | undefined) ?? null;
    const role =
      (decodedToken['role'] as string | undefined) ?? Role.USER;

    const user = await this.prisma.user.upsert({
      where: { uid: decodedToken.uid },
      update: {
        email: decodedToken.email ?? null,
        lastLoginAt: new Date(),
        // Update role from claims if it has changed
        role: role as RoleType,
      },
      create: {
        uid: decodedToken.uid,
        email: decodedToken.email ?? null,
        displayName: decodedToken.name ?? null,
        photoUrl: decodedToken.picture ?? null,
        role: role as RoleType,
        tenantId,
        lastLoginAt: new Date(),
      },
    });

    return user as SyncedUser;
  }

  /**
   * Revokes all refresh tokens for a user, effectively invalidating all
   * existing sessions. The user must re-authenticate to obtain new tokens.
   */
  async revokeUserSessions(uid: string): Promise<void> {
    await this.firebaseApp.auth().revokeRefreshTokens(uid);
    this.logger.log(`Revoked all sessions for user ${uid}`);
  }

  /**
   * Gets the full Firebase UserRecord for a user.
   */
  async getFirebaseUser(uid: string): Promise<admin.auth.UserRecord> {
    return this.firebaseApp.auth().getUser(uid);
  }
}
