import {
  IsOptional,
  IsString,
  MaxLength,
  Min,
  IsNumber,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Supported MIME types for file upload.
 * Any upload with a MIME type not in this list will be rejected with 400.
 */
export const ALLOWED_MIME_TYPES: readonly string[] = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-zip-compressed',
] as const;

/** Maximum file size: 50 MB in bytes */
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

/**
 * Query parameters for listing files.
 */
export class ListFilesQueryDto {
  @ApiPropertyOptional({ description: 'Page number (1-indexed)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by MIME type' })
  @IsString()
  @IsOptional()
  mimeType?: string;

  @ApiPropertyOptional({ description: 'Search by filename' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  search?: string;
}

/**
 * Body for sharing a file with another user.
 */
export class ShareFileDto {
  @IsUUID()
  toUserId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

/**
 * Body for requesting a presigned upload URL.
 */
export class RequestUploadUrlDto {
  @IsString()
  @MaxLength(255)
  filename!: string;

  @IsEnum(ALLOWED_MIME_TYPES, {
    message: `mimeType must be one of: ${ALLOWED_MIME_TYPES.join(', ')}`,
  })
  mimeType!: string;

  @IsNumber()
  @Min(1)
  size!: number;
}
