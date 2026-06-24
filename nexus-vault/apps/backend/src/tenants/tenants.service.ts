import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * TenantsService — multi-tenancy management.
 *
 * Tenants are organizational units that group users and files.
 * Each tenant has its own isolated data space (enforced via tenantId FK).
 */
@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns all tenants (SUPER_ADMIN only).
   */
  async findAll(): Promise<unknown[]> {
    return this.prisma.tenant.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Returns a single tenant by ID.
   */
  async findById(id: string): Promise<unknown> {
    return this.prisma.tenant.findUnique({
      where: { id, deletedAt: null },
    });
  }

  /**
   * Creates a new tenant.
   */
  async create(name: string, slug: string): Promise<unknown> {
    return this.prisma.tenant.create({
      data: { name, slug },
    });
  }

  /**
   * Updates a tenant's metadata.
   */
  async update(id: string, data: { name?: string; slug?: string }): Promise<unknown> {
    return this.prisma.tenant.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft-deletes a tenant.
   */
  async softDelete(id: string): Promise<void> {
    await this.prisma.tenant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    this.logger.log(`Tenant ${id} soft-deleted`);
  }
}
