import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
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
} from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';
import { TenantsService } from './tenants.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RbacGuard } from '../auth/rbac.guard';
import { Roles, Role } from '../common/decorators/roles.decorator';

class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  slug!: string;
}

class UpdateTenantDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  slug?: string;
}

/**
 * TenantsController — tenant management endpoints.
 * Mounted at: /api/v1/tenants
 * All endpoints require SUPER_ADMIN role.
 */
@ApiTags('admin')
@ApiBearerAuth('Firebase-JWT')
@UseGuards(FirebaseAuthGuard, RbacGuard)
@Roles(Role.SUPER_ADMIN)
@Controller({ path: 'tenants', version: '1' })
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'List all tenants (SUPER_ADMIN)' })
  async findAll(): Promise<unknown[]> {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @Version('1')
  @ApiOperation({ summary: 'Get tenant by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<unknown> {
    return this.tenantsService.findById(id);
  }

  @Post()
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new tenant' })
  async create(@Body() dto: CreateTenantDto): Promise<unknown> {
    return this.tenantsService.create(dto.name, dto.slug);
  }

  @Patch(':id')
  @Version('1')
  @ApiOperation({ summary: 'Update tenant' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
  ): Promise<unknown> {
    return this.tenantsService.update(id, dto);
  }

  @Delete(':id')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete tenant' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.tenantsService.softDelete(id);
  }
}
