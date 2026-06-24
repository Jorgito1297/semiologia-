import {
  Injectable,
  Logger,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

/**
 * StorageService — abstraction over MinIO / AWS S3.
 *
 * Uses the @aws-sdk/client-s3 package which is compatible with MinIO's
 * S3-compatible API. All operations target a single bucket whose name
 * is read from STORAGE_BUCKET environment variable.
 *
 * Object key convention:
 *   tenants/{tenantId}/users/{userId}/files/{uuid}-{sanitizedFilename}
 *
 * This ensures:
 * - Tenant isolation via key prefix
 * - Collision-free filenames via UUID prefix
 * - Human-readable names preserved for debugging
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const endpoint = process.env.STORAGE_ENDPOINT ?? process.env.S3_ENDPOINT;
    const region = process.env.STORAGE_REGION ?? process.env.S3_REGION ?? 'us-east-1';
    const accessKeyId = process.env.STORAGE_ACCESS_KEY ?? process.env.S3_ACCESS_KEY;
    const secretAccessKey = process.env.STORAGE_SECRET_KEY ?? process.env.S3_SECRET_KEY;
    this.bucket = process.env.STORAGE_BUCKET ?? process.env.S3_BUCKET ?? 'nexus-vault';

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        'Missing storage credentials. ' +
          'Ensure STORAGE_ACCESS_KEY / S3_ACCESS_KEY and STORAGE_SECRET_KEY / S3_SECRET_KEY are set.',
      );
    }

    this.client = new S3Client({
      region,
      ...(endpoint && {
        endpoint,
        forcePathStyle: true, // Required for MinIO
      }),
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  /**
   * Generates a structured object key for a file.
   * Format: tenants/{tenantId}/users/{userId}/files/{uuid}-{sanitizedFilename}
   */
  getObjectKey(tenantId: string, userId: string, filename: string): string {
    const uuid = uuidv4();
    // Sanitize filename: replace spaces and special chars with hyphens
    const sanitized = filename
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
    return `tenants/${tenantId}/users/${userId}/files/${uuid}-${sanitized}`;
  }

  /**
   * Uploads a file buffer to the S3/MinIO bucket.
   *
   * @param key - Object key (path within bucket)
   * @param buffer - File content as Buffer
   * @param mimeType - Content-Type header for the stored object
   * @param size - File size in bytes (for validation logging)
   */
  async uploadFile(
    key: string,
    buffer: Buffer,
    mimeType: string,
    size: number,
  ): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ContentLength: size,
        // Server-side encryption
        ServerSideEncryption: 'AES256',
        // Store original content type as metadata for retrieval
        Metadata: {
          'original-content-type': mimeType,
          'upload-timestamp': new Date().toISOString(),
        },
      });

      await this.client.send(command);
      this.logger.debug(`Uploaded ${size} bytes to ${this.bucket}/${key}`);
    } catch (err) {
      this.logger.error(`Upload failed for key ${key}: ${(err as Error).message}`);
      throw new InternalServerErrorException('File upload failed');
    }
  }

  /**
   * Generates a presigned GET URL for downloading a file.
   * The URL is time-limited and requires no additional authentication.
   *
   * @param key - Object key
   * @param expiresIn - URL validity in seconds (default: 3600 = 1 hour)
   */
  async getSignedDownloadUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * Generates a presigned PUT URL for direct client-side uploads.
   * Clients upload directly to S3/MinIO without proxying through the backend.
   *
   * @param key - Object key
   * @param expiresIn - URL validity in seconds (default: 900 = 15 minutes)
   */
  async getSignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 900,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * Permanently deletes an object from the bucket.
   * Called when a user deletes a file (after soft-delete confirmed).
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      this.logger.debug(`Deleted object: ${this.bucket}/${key}`);
    } catch (err) {
      this.logger.error(`Delete failed for key ${key}: ${(err as Error).message}`);
      throw new InternalServerErrorException('File deletion failed');
    }
  }

  /**
   * Health check: verifies the bucket is accessible.
   * Used by HealthController to report storage status.
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.client.send(
        new HeadBucketCommand({ Bucket: this.bucket }),
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Creates the bucket if it does not exist.
   * Useful for local development / first-time setup.
   */
  async ensureBucketExists(): Promise<void> {
    const healthy = await this.isHealthy();
    if (!healthy) {
      this.logger.log(`Creating bucket: ${this.bucket}`);
      await this.client.send(
        new CreateBucketCommand({ Bucket: this.bucket }),
      );
    }
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureBucketExists();
    } catch (err) {
      this.logger.error(`Failed to ensure bucket exists: ${(err as Error).message}`);
    }
  }
}
