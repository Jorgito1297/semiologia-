import { Controller, Get, Res, Version } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { MetricsService } from './metrics.service';
import { Public } from '../common/decorators/roles.decorator';

/**
 * MetricsController — Prometheus metrics endpoint.
 *
 * Mounted at: /metrics (no /api/v1 prefix — standard Prometheus convention)
 *
 * GET /metrics → Prometheus text format metrics
 *
 * This endpoint is @Public() but should be protected at the infrastructure
 * level (nginx/firewall) so only the Prometheus scraper can access it.
 * Never expose this to the public internet.
 */
@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * GET /metrics
   * Returns all Prometheus metrics in text exposition format.
   * Prometheus scraper polls this endpoint at its configured interval.
   *
   * ⚠️  Protect this endpoint at the infrastructure level — it reveals
   *     internal performance characteristics and request patterns.
   */
  @Get()
  @Public()
  @ApiOperation({
    summary: 'Prometheus metrics endpoint',
    description:
      'Returns metrics in Prometheus text format. Should be firewalled from public access.',
  })
  @ApiResponse({
    status: 200,
    description: 'Prometheus text format metrics',
    content: { 'text/plain': {} },
  })
  async getMetrics(@Res() reply: FastifyReply): Promise<void> {
    const [metrics, contentType] = await Promise.all([
      this.metricsService.getMetrics(),
      Promise.resolve(this.metricsService.getContentType()),
    ]);

    await reply.header('Content-Type', contentType).send(metrics);
  }
}
