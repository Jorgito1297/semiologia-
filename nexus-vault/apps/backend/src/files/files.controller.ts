import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
  Version,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { FilesService } from './files.service';
import { ListFilesQueryDto, ShareFileDto } from './dto/file.dto';
import { FirebaseAuthGuard, AuthenticatedUser } from '../auth/firebase-auth.guard';
import { RbacGuard } from '../auth/rbac.guard';
import { CurrentUser, TenantId } from '../common/decorators/roles.decorator';

/**
 * FilesController — secure file management endpoints.
 *
 * Mounted at: /api/v1/files
 *
 * Key design decisions:
 * - File uploads use Fastify multipart (not Express multer)
 * - Download endpoint returns a PRESIGNED URL, never file bytes
 *   (avoids backend memory pressure for large files)
 * - All operations are tenant-scoped
 */
@ApiTags('files')
@ApiBearerAuth('Firebase-JWT')
@UseGuards(FirebaseAuthGuard, RbacGuard)
@Controller({ path: 'files', version: '1' })
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  /**
   * POST /api/v1/files/upload
   * Accepts a multipart/form-data request with a single file field.
   * Uses Fastify's native multipart parsing (registered globally).
   *
   * Returns the created file record including the DB id.
   * File bytes are NOT stored in the DB — only metadata.
   */
  @Post('upload')
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload a file',
    description:
      'Accepts multipart/form-data. Max 50MB. Returns file metadata record.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'File to upload' },
        description: { type: 'string', description: 'Optional file description' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size exceeded' })
  async upload(
    @Req() req: FastifyRequest,
    @CurrentUser() user: AuthenticatedUser,
    @TenantId() tenantId: string,
  ): Promise<unknown> {
    // Fastify multipart: iterate over parts
    const rawReq = req as any;
    if (!rawReq.isMultipart()) {
      throw new BadRequestException(
        'Request must be multipart/form-data',
      );
    }

    let fileBuffer: Buffer | null = null;
    let filename = 'upload';
    let mimetype = 'application/octet-stream';
    let fileSize = 0;
    let description: string | undefined;

    // Process each part from the multipart stream
    const parts = rawReq.parts();
    for await (const part of parts) {
      if (part.type === 'file') {
        const chunks: Buffer[] = [];
        for await (const chunk of part.file) {
          chunks.push(chunk as Buffer);
        }
        fileBuffer = Buffer.concat(chunks);
        filename = part.filename;
        mimetype = part.mimetype;
        fileSize = fileBuffer.length;
      } else if (part.fieldname === 'description') {
        description = part.value as string;
      }
    }

    if (!fileBuffer) {
      throw new BadRequestException('No file was provided in the request');
    }

    return this.filesService.upload(
      user.uid,
      tenantId,
      {
        fieldname: 'file',
        originalname: filename,
        mimetype,
        size: fileSize,
        buffer: fileBuffer,
      },
      { description },
    );
  }

  /**
   * GET /api/v1/files
   * Paginated list of files accessible to the current user.
   * Includes owned files AND shared files.
   */
  @Get()
  @Version('1')
  @ApiOperation({ summary: 'List files (owned + shared)' })
  @ApiResponse({ status: 200, description: 'Paginated file list' })
  async listFiles(
    @CurrentUser() user: AuthenticatedUser,
    @TenantId() tenantId: string,
    @Query() query: ListFilesQueryDto,
  ): Promise<unknown> {
    return this.filesService.listFiles(user.uid, tenantId, query);
  }

  /**
   * GET /api/v1/files/:id
   * Returns metadata for a specific file.
   */
  @Get(':id')
  @Version('1')
  @ApiOperation({ summary: 'Get file details by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'File metadata' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @TenantId() tenantId: string,
  ): Promise<unknown> {
    return this.filesService.findOne(id, user.uid, tenantId);
  }


  /**
   * GET /api/v1/files/:id/download
   * Returns a time-limited presigned download URL.
   * Clients use this URL to download directly from MinIO/S3.
   *
   * ⚠️  NEVER returns file bytes — this prevents backend memory exhaustion.
   */
  @Get(':id/download')
  @Version('1')
  @ApiOperation({
    summary: 'Get presigned download URL',
    description:
      'Returns a 1-hour presigned URL. Download directly from MinIO/S3.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        downloadUrl: 'https://minio.example.com/...',
        filename: 'document.pdf',
        expiresIn: 3600,
      },
    },
  })
  @ApiResponse({ status: 403, description: 'No access to this file' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getDownloadUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @TenantId() tenantId: string,
  ): Promise<{ downloadUrl: string; filename: string; expiresIn: number }> {
    return this.filesService.getDownloadUrl(id, user.uid, tenantId);
  }

  /**
   * POST /api/v1/files/:id/share
   * Shares a file with another user in the same tenant.
   */
  @Post(':id/share')
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Share file with another user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'File shared successfully' })
  @ApiResponse({ status: 403, description: 'Only file owner can share' })
  @ApiResponse({ status: 404, description: 'File or recipient not found' })
  async shareFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ShareFileDto,
    @CurrentUser() user: AuthenticatedUser,
    @TenantId() tenantId: string,
  ): Promise<unknown> {
    return this.filesService.shareFile(id, user.uid, dto, tenantId);
  }

  /**
   * DELETE /api/v1/files/:id
   * Soft-deletes the file record and permanently removes from storage.
   * Only the file owner can delete.
   */
  @Delete(':id')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a file' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'File deleted' })
  @ApiResponse({ status: 403, description: 'Only file owner can delete' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async deleteFile(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @TenantId() tenantId: string,
  ): Promise<void> {
    await this.filesService.deleteFile(id, user.uid, tenantId);
  }
}
