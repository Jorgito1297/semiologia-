import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
  Version,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto, UpdateRoleDto, ListUsersQueryDto } from './dto/user.dto';
import { FirebaseAuthGuard, AuthenticatedUser } from '../auth/firebase-auth.guard';
import { RbacGuard } from '../auth/rbac.guard';
import {
  CurrentUser,
  TenantId,
  Roles,
  Role,
} from '../common/decorators/roles.decorator';

/**
 * UsersController — user management endpoints.
 *
 * Mounted at: /api/v1/users
 *
 * All routes require a valid Firebase JWT.
 * Role restrictions are enforced by @Roles() + RbacGuard.
 */
@ApiTags('users')
@ApiBearerAuth('Firebase-JWT')
@UseGuards(FirebaseAuthGuard, RbacGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /api/v1/users/me
   * Returns the currently authenticated user's profile.
   * Must be defined BEFORE /:id to avoid route conflict.
   */
  @Get('me')
  @Version('1')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  async getMyProfile(@CurrentUser() user: AuthenticatedUser): Promise<unknown> {
    return this.usersService.findByUid(user.uid);
  }

  /**
   * GET /api/v1/users/me/storage
   * Returns storage usage statistics for the current user.
   */
  @Get('me/storage')
  @Version('1')
  @ApiOperation({ summary: 'Get current user storage usage' })
  @ApiResponse({
    status: 200,
    description: 'Storage usage stats',
    schema: {
      example: { bytesUsed: 104857600, fileCount: 42 },
    },
  })
  async getMyStorageUsage(
    @CurrentUser() user: AuthenticatedUser,
    @TenantId() tenantId: string,
  ): Promise<{ bytesUsed: number; fileCount: number }> {
    return this.usersService.getStorageUsed(user.uid, tenantId);
  }

  /**
   * GET /api/v1/users
   * Paginated list of users in the tenant. ADMIN+ only.
   */
  @Get()
  @Version('1')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all users in tenant (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated user list' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async findAll(
    @TenantId() tenantId: string,
    @Query() query: ListUsersQueryDto,
  ): Promise<unknown> {
    return this.usersService.findAll(tenantId, query);
  }

  /**
   * GET /api/v1/users/:id
   * Get a specific user by their database ID. ADMIN+ only.
   */
  @Get(':id')
  @Version('1')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User record' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() tenantId: string,
  ): Promise<unknown> {
    return this.usersService.findById(id, tenantId);
  }

  /**
   * PATCH /api/v1/users/:id
   * Update a user's profile (displayName, photoUrl, phoneNumber). ADMIN+ only.
   */
  @Patch(':id')
  @Version('1')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update user profile' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Updated user record' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @TenantId() tenantId: string,
  ): Promise<unknown> {
    return this.usersService.update(id, dto, tenantId);
  }

  /**
   * PATCH /api/v1/users/:id/role
   * Updates user role in DB + Firebase Custom Claims. SUPER_ADMIN only.
   */
  @Patch(':id/role')
  @Version('1')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update user role (SUPER_ADMIN only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiResponse({ status: 403, description: 'SUPER_ADMIN required' })
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<unknown> {
    return this.usersService.updateRole(id, dto);
  }

  /**
   * DELETE /api/v1/users/:id
   * Soft-deletes a user. ADMIN+ only.
   */
  @Delete(':id')
  @Version('1')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() tenantId: string,
  ): Promise<void> {
    await this.usersService.softDelete(id, tenantId);
  }
}
