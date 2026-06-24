import {
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  MaxLength,
  Min,
  IsNumber,
  IsInt,
  IsObject,
} from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO used internally to create an audit log entry.
 * Called by AuditInterceptor and individual services.
 */
export class CreateAuditLogDto {
  @ApiProperty({ description: 'Firebase UID of the acting user' })
  @IsString()
  userId!: string;

  @ApiPropertyOptional({ description: 'Email of the acting user' })
  @IsString()
  @IsOptional()
  userEmail?: string;

  @ApiPropertyOptional({ description: 'Tenant ID' })
  @IsString()
  @IsOptional()
  tenantId?: string;

  @ApiProperty({ description: 'Semantic action name', example: 'FILE_UPLOAD' })
  @IsString()
  @MaxLength(100)
  action!: string;

  @ApiProperty({ description: 'Affected resource path', example: '/api/v1/files/uuid' })
  @IsString()
  @MaxLength(500)
  resource!: string;

  @ApiProperty({ description: 'HTTP method', example: 'POST' })
  @IsString()
  @MaxLength(10)
  method!: string;

  @ApiPropertyOptional({ description: 'Client IP address' })
  @IsString()
  @IsOptional()
  @MaxLength(45) // IPv6 max length
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'User-Agent string' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  userAgent?: string;

  @ApiPropertyOptional({ description: 'HTTP response status code' })
  @IsInt()
  @IsOptional()
  statusCode?: number;

  @ApiPropertyOptional({ description: 'Request duration in milliseconds' })
  @IsNumber()
  @IsOptional()
  durationMs?: number;

  @ApiPropertyOptional({ description: 'Additional structured metadata (JSON)' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

/**
 * Query parameters for filtering audit logs.
 */
export class AuditLogQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'Filter by user UID' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by action name', example: 'FILE_UPLOAD' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  action?: string;

  @ApiPropertyOptional({ description: 'Start date (ISO 8601)', example: '2024-01-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)', example: '2024-12-31T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by HTTP method' })
  @IsString()
  @IsOptional()
  method?: string;
}
