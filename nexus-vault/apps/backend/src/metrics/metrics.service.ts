import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from 'prom-client';

/**
 * MetricsService — Prometheus metrics collection for NEXUS VAULT.
 *
 * Metrics exposed:
 * - nexusvault_http_requests_total        (Counter)   HTTP requests by method/path/status
 * - nexusvault_http_request_duration_ms   (Histogram)  Request duration distribution
 * - nexusvault_active_connections         (Gauge)      Current active connections
 * - nexusvault_file_uploads_total         (Counter)    File upload counter by tenant/mime
 * - nexusvault_audit_logs_total           (Counter)    Audit log entries by action
 * - nexusvault_storage_bytes_uploaded     (Counter)    Total bytes uploaded
 *
 * All metrics use the 'nexusvault_' prefix to avoid collision in shared
 * Prometheus environments.
 */
@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly logger = new Logger(MetricsService.name);
  private readonly registry: Registry;

  // ── HTTP Metrics ──────────────────────────────────────────────────────────

  readonly httpRequestsTotal: Counter<string>;
  readonly httpRequestDurationMs: Histogram<string>;
  readonly activeConnections: Gauge<string>;

  // ── Business Metrics ──────────────────────────────────────────────────────

  readonly fileUploadsTotal: Counter<string>;
  readonly auditLogsTotal: Counter<string>;
  readonly storageBytesUploaded: Counter<string>;

  constructor() {
    this.registry = new Registry();
    this.registry.setDefaultLabels({
      app: 'nexus-vault',
      version: process.env.npm_package_version ?? '1.0.0',
    });

    // ── HTTP request counter ──────────────────────────────────────────────
    this.httpRequestsTotal = new Counter({
      name: 'nexusvault_http_requests_total',
      help: 'Total number of HTTP requests processed',
      labelNames: ['method', 'path', 'status_code'],
      registers: [this.registry],
    });

    // ── HTTP request duration histogram ──────────────────────────────────
    // Buckets optimized for web API latency: 5ms → 10s
    this.httpRequestDurationMs = new Histogram({
      name: 'nexusvault_http_request_duration_ms',
      help: 'HTTP request duration in milliseconds',
      labelNames: ['method', 'path', 'status_code'],
      buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
      registers: [this.registry],
    });

    // ── Active connections gauge ──────────────────────────────────────────
    this.activeConnections = new Gauge({
      name: 'nexusvault_active_connections',
      help: 'Number of currently active HTTP connections',
      registers: [this.registry],
    });

    // ── File upload counter ──────────────────────────────────────────────
    this.fileUploadsTotal = new Counter({
      name: 'nexusvault_file_uploads_total',
      help: 'Total number of files uploaded',
      labelNames: ['tenant_id', 'mime_type'],
      registers: [this.registry],
    });

    // ── Audit log counter ────────────────────────────────────────────────
    this.auditLogsTotal = new Counter({
      name: 'nexusvault_audit_logs_total',
      help: 'Total number of audit log entries created',
      labelNames: ['action'],
      registers: [this.registry],
    });

    // ── Storage bytes uploaded ───────────────────────────────────────────
    this.storageBytesUploaded = new Counter({
      name: 'nexusvault_storage_bytes_uploaded_total',
      help: 'Total bytes uploaded to object storage',
      labelNames: ['tenant_id'],
      registers: [this.registry],
    });
  }

  /**
   * Registers Node.js default metrics (heap, event loop lag, GC, etc.)
   * on module initialization.
   */
  onModuleInit(): void {
    collectDefaultMetrics({
      register: this.registry,
      prefix: 'nexusvault_nodejs_',
    });

    this.logger.log('Prometheus metrics initialized');
  }

  /**
   * Returns all metrics in Prometheus text exposition format.
   * Called by the /metrics endpoint.
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Returns the content type header for Prometheus scraping.
   */
  getContentType(): string {
    return this.registry.contentType;
  }

  // ── Convenience recording methods ─────────────────────────────────────────

  /**
   * Records an HTTP request completion.
   */
  recordRequest(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
  ): void {
    const labels = { method, path, status_code: String(statusCode) };
    this.httpRequestsTotal.inc(labels);
    this.httpRequestDurationMs.observe(labels, durationMs);
  }

  /**
   * Records a file upload event.
   */
  recordFileUpload(tenantId: string, mimeType: string, bytes: number): void {
    this.fileUploadsTotal.inc({ tenant_id: tenantId, mime_type: mimeType });
    this.storageBytesUploaded.inc({ tenant_id: tenantId }, bytes);
  }

  /**
   * Records an audit log write.
   */
  recordAuditLog(action: string): void {
    this.auditLogsTotal.inc({ action });
  }
}
