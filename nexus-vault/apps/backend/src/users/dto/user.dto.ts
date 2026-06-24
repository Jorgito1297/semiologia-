import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Role } from '../../common/decorators/roles.decorator';

/**
 * DTO for creating a new user record in PostgreSQL.
 * Typically called internally after Firebase auth sync.
 */
export class CreateUserDto {
  @ApiProperty({ description: 'Firebase UID', example: 'firebase-uid-abc123' })
  @IsString()
  @IsNotEmpty()
  uid!: string;

  @ApiPropertyOptional({ description: 'User email address' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Display name', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional({ description: 'Tenant ID (UUID)' })
  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional({ enum: Role, description: 'Initial role assignment' })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}

/**
 * DTO for updating an existing user's profile.
 * All fields optional — partial update.
 */
export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Display name', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional({ description: 'Photo URL', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  photoUrl?: string;

  @ApiPropertyOptional({ description: 'Phone number', maxLength: 20 })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phoneNumber?: string;
}

/**
 * DTO for updating a user's role.
 * SUPER_ADMIN only endpoint.
 */
export class UpdateRoleDto {
  @ApiProperty({
    enum: Role,
    description: 'New role to assign',
    example: Role.ADMIN,
  })
  @IsEnum(Role)
  role!: Role;
}

/**
 * Query parameters for paginated user listing.
 */
export class ListUsersQueryDto {
  @ApiPropertyOptional({ description: 'Page number (1-indexed)', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Search by email or display name', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: Role, description: 'Filter by role' })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
