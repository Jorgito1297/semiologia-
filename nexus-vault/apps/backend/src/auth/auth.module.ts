import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { FirebaseAdminProvider } from './firebase-admin.provider';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { RbacGuard } from './rbac.guard';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * AuthModule — provides Firebase Admin SDK, authentication guards,
 * and the authentication service.
 *
 * FirebaseAuthGuard and RbacGuard are exported so they can be applied
 * globally or in individual feature modules.
 */
@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    FirebaseAdminProvider,
    AuthService,
    FirebaseAuthGuard,
    RbacGuard,
  ],
  exports: [
    FirebaseAdminProvider, // Export for injection via @Inject('FIREBASE_ADMIN')
    AuthService,
    FirebaseAuthGuard,
    RbacGuard,
  ],
})
export class AuthModule {}
