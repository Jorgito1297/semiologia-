import {
  Injectable,
  NotFoundException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateRoleDto,
  ListUsersQueryDto,
} from './dto/user.dto';
import { Role } from '../common/decorators/roles.decorator';
import { RoleType } from '@prisma/client';

/**
 * Paginated response wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * UsersService — all user management business logic.
 *
 * Tenant isolation: every multi-tenant query filters by tenantId.
 * Soft deletion: uses deletedAt timestamp, never hard-deletes users.
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Paginated list of users — scoped to a tenant.
   * Excludes soft-deleted users by default.
   * Supports search by email or display name.
   */
  async findAll(
    tenantId: string,
    query: ListUsersQueryDto,
  ): Promise<PaginatedResult<unknown>> {
    const { page = 1, limit = 20, search, role } = query;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      deletedAt: null, // Exclude soft-deleted users
      ...(role && { role }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { displayName: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          uid: true,
          email: true,
          displayName: true,
          photoUrl: true,
          role: true,
          tenantId: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          // Exclude: deletedAt, sensitive fields
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find a user by their Firebase UID.
   */
  async findByUid(uid: string): Promise<unknown> {
    const user = await this.prisma.user.findUnique({
      where: { uid, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException(`User with UID ${uid} not found`);
    }

    return user;
  }

  /**
   * Find a user by their PostgreSQL database ID.
   * Optionally scoped to a tenant for security.
   */
  async findById(id: string, tenantId?: string): Promise<unknown> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
        deletedAt: null,
        ...(tenantId && { tenantId }),
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Creates a user record in PostgreSQL.
   * Throws ConflictException if UID already exists.
   */
  async create(dto: CreateUserDto): Promise<unknown> {
    const existing = await this.prisma.user.findUnique({
      where: { uid: dto.uid },
    });

    if (existing) {
      throw new ConflictException(`User with UID ${dto.uid} already exists`);
    }

    return this.prisma.user.create({
      data: {
        uid: dto.uid,
        email: dto.email ?? null,
        displayName: dto.displayName ?? null,
        tenantId: dto.tenantId ?? null,
        role: (dto.role ?? Role.USER) as RoleType,
      },
    });
  }

  /**
   * Updates a user's profile fields.
   * Does NOT update role (use updateRole() for that).
   */
  async update(id: string, dto: UpdateUserDto, tenantId?: string): Promise<unknown> {
    // Verify user exists and belongs to tenant
    await this.findById(id, tenantId);

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.photoUrl !== undefined && { photoUrl: dto.photoUrl }),
        ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber }),
      },
    });
  }

  /**
   * Updates a user's role in PostgreSQL AND sets the Firebase Custom Claim.
   * The claim update takes effect on the user's next token refresh.
   * Only SUPER_ADMIN can call this.
   */
  async updateRole(id: string, dto: UpdateRoleDto): Promise<unknown> {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Update Firebase Custom Claim first (authoritative source for auth)
    await this.authService.setUserRole(user.uid, dto.role);

    // Then update PostgreSQL (for queries and display)
    const updated = await this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
    });

    this.logger.log(
      `Role updated: User ${user.uid} → ${dto.role}`,
    );

    return updated;
  }

  /**
   * Soft-deletes a user by setting deletedAt timestamp.
   * The user record is retained for audit compliance.
   * Does NOT revoke Firebase tokens — caller must do that separately.
   */
  async softDelete(id: string, tenantId?: string): Promise<void> {
    const user = await this.findById(id, tenantId) as { uid: string };

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Revoke Firebase sessions so deleted user cannot continue using the app
    try {
      await this.authService.revokeUserSessions(user.uid);
    } catch (err) {
      this.logger.warn(
        `Could not revoke Firebase sessions for deleted user ${user.uid}: ${(err as Error).message}`,
      );
    }

    this.logger.log(`User ${id} soft-deleted`);
  }

  /**
   * Calculates the total storage used by a user across all their files.
   * Returns size in bytes.
   */
  async getStorageUsed(userId: string, tenantId?: string): Promise<{ bytesUsed: number; fileCount: number }> {
    const result = await this.prisma.file.aggregate({
      where: {
        ownerId: userId,
        ...(tenantId && { tenantId }),
        deletedAt: null,
      },
      _sum: { size: true },
      _count: { id: true },
    });

    return {
      bytesUsed: Number(result._sum?.size ?? 0),
      fileCount: (result._count as any)?.id ?? 0,
    };
  }
}
