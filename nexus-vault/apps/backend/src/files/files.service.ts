import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage.service';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  ListFilesQueryDto,
  ShareFileDto,
} from './dto/file.dto';
import { PaginatedResult } from '../users/users.service';

/**
 * Represents a multipart file as received by Fastify.
 */
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * FilesService — file management business logic.
 *
 * All operations enforce:
 * - MIME type whitelist (prevents executable uploads)
 * - File size limits (50 MB max)
 * - Tenant isolation (users can only access their tenant's files)
 * - Ownership verification before share/delete operations
 */
@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Validates a file before upload.
   * Checks MIME type whitelist and size limit.
   * Throws BadRequestException for invalid files.
   */
  validateFile(file: UploadedFile): void {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type '${file.mimetype}' is not allowed. ` +
          `Supported types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const maxMB = MAX_FILE_SIZE_BYTES / (1024 * 1024);
      throw new BadRequestException(
        `File size ${(file.size / (1024 * 1024)).toFixed(2)} MB exceeds the ${maxMB} MB limit`,
      );
    }

    if (file.size === 0) {
      throw new BadRequestException('Empty files are not allowed');
    }
  }

  /**
   * Uploads a file to MinIO/S3 and saves metadata to PostgreSQL.
   *
   * Steps:
   * 1. Validate file (MIME + size)
   * 2. Generate unique object key
   * 3. Upload buffer to storage
   * 4. Save file record to DB
   * 5. Return the created file record
   */
  async upload(
    userId: string,
    tenantId: string,
    file: UploadedFile,
    metadata?: { description?: string; tags?: string[] },
  ): Promise<unknown> {
    // 1. Validate before touching storage
    this.validateFile(file);

    // 2. Generate structured object key
    const objectKey = this.storageService.getObjectKey(
      tenantId,
      userId,
      file.originalname,
    );

    // 3. Upload to MinIO/S3
    await this.storageService.uploadFile(
      objectKey,
      file.buffer,
      file.mimetype,
      file.size,
    );

    // 4. Persist metadata to PostgreSQL
    const record = await this.prisma.file.create({
      data: {
        filename: file.originalname,
        mimeType: file.mimetype,
        size: BigInt(file.size),
        objectKey,
        ownerId: userId,
        tenantId,
        description: metadata?.description ?? null,
        tags: metadata?.tags ?? [],
      },
    });

    this.logger.log(
      `File uploaded: ${file.originalname} (${file.size} bytes) ` +
        `by user ${userId} in tenant ${tenantId}`,
    );

    // Serialize BigInt for JSON response
    return {
      ...record,
      size: Number(record.size),
    };
  }

  /**
   * Generates a presigned download URL for a file.
   *
   * Validates:
   * - File exists and belongs to the tenant
   * - Requester owns the file OR has a valid file_share record
   *
   * Returns a time-limited URL — NEVER returns file bytes.
   */
  async getDownloadUrl(
    fileId: string,
    requestingUserId: string,
    tenantId: string,
  ): Promise<{ downloadUrl: string; filename: string; expiresIn: number }> {
    const file = await this.findFileWithOwnershipCheck(
      fileId,
      requestingUserId,
      tenantId,
    );

    const expiresIn = 3600; // 1 hour
    const downloadUrl = await this.storageService.getSignedDownloadUrl(
      file.objectKey,
      expiresIn,
    );

    return {
      downloadUrl,
      filename: file.filename,
      expiresIn,
    };
  }

  /**
   * Retrieves file metadata if user has ownership or share access.
   */
  async findOne(
    fileId: string,
    requestingUserId: string,
    tenantId: string,
  ): Promise<unknown> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId, tenantId, deletedAt: null },
      include: {
        shares: {
          where: { deletedAt: null },
          select: {
            id: true,
            toUserId: true,
            createdAt: true,
            message: true,
          },
        },
      },
    });

    if (!file) {
      throw new NotFoundException(`File ${fileId} not found`);
    }

    const isOwner = file.ownerId === requestingUserId;
    const isSharedWithUser = file.shares.some((s) => s.toUserId === requestingUserId);

    if (!isOwner && !isSharedWithUser) {
      throw new ForbiddenException('You do not have access to this file');
    }

    return {
      ...file,
      size: Number(file.size),
    };
  }


  /**
   * Paginated list of files for a user within a tenant.
   * Includes files owned by the user AND shared with the user.
   */
  async listFiles(
    userId: string,
    tenantId: string,
    query: ListFilesQueryDto,
  ): Promise<PaginatedResult<unknown>> {
    const { page = 1, limit = 20, mimeType, search } = query;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      deletedAt: null,
      OR: [
        { ownerId: userId }, // Files owned by user
        {
          shares: {
            some: { toUserId: userId, deletedAt: null },
          },
        }, // Files shared with user
      ],
      ...(mimeType && { mimeType }),
      ...(search && {
        filename: { contains: search, mode: 'insensitive' as const },
      }),
    };

    const [files, total] = await Promise.all([
      this.prisma.file.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          filename: true,
          mimeType: true,
          size: true,
          description: true,
          tags: true,
          ownerId: true,
          tenantId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.file.count({ where }),
    ]);

    return {
      data: files.map((f) => ({ ...f, size: Number(f.size) })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Soft-deletes a file record and permanently removes it from storage.
   *
   * Order of operations:
   * 1. Verify ownership (throws if not owner)
   * 2. Soft-delete the DB record (sets deletedAt)
   * 3. Hard-delete from object storage (irreversible)
   *
   * Storage is deleted AFTER DB update so we have an audit trail even
   * if the storage delete fails.
   */
  async deleteFile(
    fileId: string,
    requestingUserId: string,
    tenantId: string,
  ): Promise<void> {
    // Only the file owner can delete (not share recipients)
    const file = await this.prisma.file.findUnique({
      where: { id: fileId, tenantId, deletedAt: null },
    });

    if (!file) {
      throw new NotFoundException(`File ${fileId} not found`);
    }

    if (file.ownerId !== requestingUserId) {
      throw new ForbiddenException('Only the file owner can delete this file');
    }

    // 1. Soft-delete DB record
    await this.prisma.file.update({
      where: { id: fileId },
      data: { deletedAt: new Date() },
    });

    // 2. Remove from object storage
    try {
      await this.storageService.deleteFile(file.objectKey);
    } catch (err) {
      // Log but don't re-throw — the DB record is already soft-deleted
      this.logger.error(
        `Storage delete failed for ${file.objectKey}: ${(err as Error).message}`,
      );
    }

    this.logger.log(`File ${fileId} deleted by user ${requestingUserId}`);
  }

  /**
   * Shares a file with another user in the same tenant.
   * Creates a file_share record; the recipient can now access the file.
   */
  async shareFile(
    fileId: string,
    fromUserId: string,
    dto: ShareFileDto,
    tenantId: string,
  ): Promise<unknown> {
    // Verify sharer owns the file
    const file = await this.prisma.file.findUnique({
      where: { id: fileId, tenantId, deletedAt: null },
    });

    if (!file) {
      throw new NotFoundException(`File ${fileId} not found`);
    }

    if (file.ownerId !== fromUserId) {
      throw new ForbiddenException('Only the file owner can share this file');
    }

    // Verify recipient exists in the same tenant
    const recipient = await this.prisma.user.findFirst({
      where: { id: dto.toUserId, tenantId, deletedAt: null },
    });

    if (!recipient) {
      throw new NotFoundException(
        `Recipient user ${dto.toUserId} not found in this tenant`,
      );
    }

    // Create or update share record (upsert prevents duplicates)
    return this.prisma.fileShare.upsert({
      where: {
        fileId_toUserId: {
          fileId,
          toUserId: dto.toUserId,
        },
      },
      create: {
        fileId,
        fromUserId,
        toUserId: dto.toUserId,
        message: dto.message ?? null,
      },
      update: {
        message: dto.message ?? null,
        deletedAt: null, // Re-share if previously revoked
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Internal helper: finds a file and verifies the requesting user
   * has access (is owner OR has a valid share record).
   */
  private async findFileWithOwnershipCheck(
    fileId: string,
    requestingUserId: string,
    tenantId: string,
  ): Promise<{ id: string; filename: string; objectKey: string; ownerId: string }> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId, tenantId, deletedAt: null },
      include: {
        shares: {
          where: { toUserId: requestingUserId, deletedAt: null },
        },
      },
    });

    if (!file) {
      throw new NotFoundException(`File ${fileId} not found`);
    }

    const isOwner = file.ownerId === requestingUserId;
    const isSharedWithUser = file.shares.length > 0;

    if (!isOwner && !isSharedWithUser) {
      throw new ForbiddenException('You do not have access to this file');
    }

    return file;
  }
}
