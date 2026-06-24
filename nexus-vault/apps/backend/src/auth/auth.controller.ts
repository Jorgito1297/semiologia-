import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Version,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard, AuthenticatedUser } from './firebase-auth.guard';
import { CurrentUser, Public } from '../common/decorators/roles.decorator';

/**
 * DTO for token verification endpoint.
 */
class VerifyTokenDto {
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}

/**
 * AuthController — authentication lifecycle endpoints.
 *
 * Mounted at: /api/v1/auth
 */
@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/verify
   * Verifies a Firebase ID token and syncs the user to the database.
   * Returns the decoded claims and the DB user record.
   *
   * This endpoint is PUBLIC — clients call it immediately after Firebase
   * client-side sign-in to establish a server-side user record.
   */
  @Post('verify')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({
    summary: 'Verify Firebase ID token',
    description:
      'Verifies the token, syncs user to PostgreSQL, returns claims + user record.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token valid — user synced',
    schema: {
      example: {
        user: { id: 'uuid', uid: 'firebase-uid', email: 'user@example.com', role: 'USER' },
        claims: { uid: 'firebase-uid', role: 'USER', email: 'user@example.com' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async verifyToken(@Body() body: VerifyTokenDto): Promise<{
    user: unknown;
    claims: unknown;
  }> {
    const decodedToken = await this.authService.verifyToken(body.idToken);
    const user = await this.authService.syncUserToDatabase(decodedToken);

    return {
      user: {
        id: user.id,
        uid: user.uid,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        createdAt: user.createdAt,
      },
      claims: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken['role'],
        tenantId: decodedToken['tenantId'] ?? decodedToken['tenant_id'],
        emailVerified: decodedToken.email_verified,
      },
    };
  }

  /**
   * POST /api/v1/auth/logout
   * Revokes all Firebase refresh tokens for the current user.
   * Requires a valid token (authenticated endpoint).
   */
  @Post('logout')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('Firebase-JWT')
  @ApiOperation({
    summary: 'Logout — revoke all sessions',
    description:
      'Revokes all Firebase refresh tokens. User must re-authenticate.',
  })
  @ApiResponse({ status: 200, description: 'Sessions revoked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    await this.authService.revokeUserSessions(user.uid);
    return { message: 'All sessions have been revoked successfully.' };
  }

  /**
   * POST /api/v1/auth/refresh-claims
   * Forces re-sync of user claims from Firebase to the DB.
   * Useful when an admin has updated a user's role via setUserRole().
   */
  @Post('refresh-claims')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('Firebase-JWT')
  @ApiOperation({
    summary: 'Refresh user claims from Firebase',
    description: 'Re-syncs Firebase custom claims to the PostgreSQL user record.',
  })
  async refreshClaims(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ claims: unknown }> {
    const claims = await this.authService.getUserClaims(user.uid);
    return { claims };
  }
}
