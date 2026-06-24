# NEXUS VAULT — Security Documentation

> This document describes the security architecture, threat model, and
> compliance roadmap for the NEXUS VAULT platform.

---

## Table of Contents

1. [Authentication Architecture](#1-authentication-architecture)
2. [RBAC — Roles & Permissions](#2-rbac--roles--permissions)
3. [Multi-Tenant Isolation](#3-multi-tenant-isolation)
4. [Audit Logging](#4-audit-logging)
5. [Data at Rest Encryption](#5-data-at-rest-encryption)
6. [Signed URL Mechanism](#6-signed-url-mechanism)
7. [Rate Limiting](#7-rate-limiting)
8. [Network Security](#8-network-security)
9. [HIPAA / FERPA Compliance Roadmap](#9-hipaa--ferpa-compliance-roadmap)
10. [Vulnerability Disclosure](#10-vulnerability-disclosure)

---

## 1. Authentication Architecture

NEXUS VAULT uses **Firebase Authentication** as the identity provider (IdP) and
validates tokens server-side on every request.

```
Client Browser
     │
     │  1. User logs in (Google / Email+Password)
     ▼
Firebase Auth (Google Cloud)
     │
     │  2. Firebase issues a short-lived ID token (JWT, 1h TTL)
     ▼
Client sends: Authorization: Bearer <firebase-id-token>
     │
     ▼
NestJS Backend (Firebase Admin SDK)
     │  3. admin.auth().verifyIdToken(token)
     │     → Validates signature against Firebase public keys
     │     → Verifies aud, iss, exp
     │  4. Lookup user by firebaseUid in PostgreSQL
     │  5. Verify user.isActive && !user.deletedAt
     │  6. Attach { userId, tenantId, role } to request context
     ▼
Protected handler executes
```

### Token Lifecycle

| Token Type       | TTL  | Issued By      | Purpose                      |
| ---------------- | ---- | -------------- | ---------------------------- |
| Firebase ID token| 1h   | Firebase Auth  | API authentication           |
| Firebase refresh | 30d  | Firebase Auth  | Silent token refresh (client)|
| Internal JWT     | 1h   | Backend        | Service-to-service calls     |

### Session Tracking

Beyond Firebase tokens, NEXUS VAULT maintains a `Session` record in PostgreSQL
on each login. Sessions can be:

- **Manually revoked** by admins (forced logout)
- **Auto-expired** after `SESSION_TIMEOUT_MINUTES` of inactivity
- **Audited** — every login/logout writes an `AuditLog` entry

---

## 2. RBAC — Roles & Permissions

### Role Hierarchy

```
SUPER_ADMIN  ← platform-wide god mode (NEXUS VAULT operators only)
    │
  ADMIN      ← full control within their tenant
    │
SUPERVISOR   ← manage users + files in their organization
    │
INSTRUCTOR   ← upload, share, manage own files + view org files
    │
   USER      ← upload + manage own files, view shared files
    │
STUDENT      ← view + download files explicitly shared with them
```

### Permission Matrix

| Permission                        | SUPER_ADMIN | ADMIN | SUPERVISOR | INSTRUCTOR | USER | STUDENT |
| --------------------------------- | :---------: | :---: | :--------: | :--------: | :--: | :-----: |
| View all tenants                  | ✅          | ❌    | ❌         | ❌         | ❌   | ❌      |
| Manage tenants                    | ✅          | ❌    | ❌         | ❌         | ❌   | ❌      |
| View tenant users                 | ✅          | ✅    | ✅         | ❌         | ❌   | ❌      |
| Invite / deactivate users         | ✅          | ✅    | ❌         | ❌         | ❌   | ❌      |
| Change user roles                 | ✅          | ✅    | ❌         | ❌         | ❌   | ❌      |
| View org users                    | ✅          | ✅    | ✅         | ✅         | ❌   | ❌      |
| Upload files                      | ✅          | ✅    | ✅         | ✅         | ✅   | ❌      |
| Delete own files                  | ✅          | ✅    | ✅         | ✅         | ✅   | ❌      |
| Delete any tenant file            | ✅          | ✅    | ❌         | ❌         | ❌   | ❌      |
| Share files                       | ✅          | ✅    | ✅         | ✅         | ✅   | ❌      |
| Download shared files             | ✅          | ✅    | ✅         | ✅         | ✅   | ✅      |
| View audit logs                   | ✅          | ✅    | ❌         | ❌         | ❌   | ❌      |
| View own audit logs               | ✅          | ✅    | ✅         | ✅         | ✅   | ✅      |
| Manage storage quotas             | ✅          | ✅    | ❌         | ❌         | ❌   | ❌      |
| Access Prometheus metrics         | ✅          | ❌    | ❌         | ❌         | ❌   | ❌      |

### Role Enforcement

Roles are enforced at multiple layers:

1. **Guard layer** (NestJS `@Roles()` decorator) — blocks requests before reaching handlers
2. **Service layer** — `tenantId` injected from JWT context, never from request body
3. **Database layer** — all queries include `WHERE tenantId = :tenantId` clause via Prisma
4. **Row-level policy** (roadmap) — PostgreSQL RLS for defense-in-depth

---

## 3. Multi-Tenant Isolation

Every database record that belongs to a tenant includes a `tenantId` foreign key.
Isolation is enforced as follows:

### Query Isolation

```typescript
// Every repository method scopes queries by tenantId from the auth context
async findFiles(tenantId: string, userId: string) {
  return this.prisma.file.findMany({
    where: {
      tenantId,          // ← always from auth context, never from user input
      deletedAt: null,
    },
  });
}
```

### Tenant Context Injection

The auth guard extracts `tenantId` from the validated Firebase token and injects
it into the NestJS request context. Handlers **must not** accept `tenantId` from
request bodies or query parameters.

### Storage Isolation

Files are stored under a tenant-scoped path:

```
s3://nexusvault-files/tenants/{tenantId}/users/{userId}/files/{uuid}-{filename}
```

This ensures storage-level isolation even if bucket policies are misconfigured.

### Cross-Tenant Access

Cross-tenant access is impossible by design:

- Users cannot specify a `tenantId` in requests
- All file share operations are validated: `sharedById` and `sharedToId` must belong
  to the same tenant
- `SUPER_ADMIN` users (platform operators) are in a separate system tenant and
  have explicit cross-tenant APIs

---

## 4. Audit Logging

The `AuditLog` table is **append-only** — records are never updated or deleted.

### Audited Events

| Category   | Events                                                           |
| ---------- | ---------------------------------------------------------------- |
| `AUTH`     | LOGIN, LOGOUT, TOKEN_REFRESH, LOGIN_FAILED, FORCE_LOGOUT        |
| `FILE`     | FILE_UPLOAD, FILE_DOWNLOAD, FILE_DELETE, FILE_SHARE, FILE_SCAN  |
| `USER`     | USER_CREATED, USER_DEACTIVATED, ROLE_CHANGED, PROFILE_UPDATED   |
| `ADMIN`    | TENANT_CREATED, QUOTA_CHANGED, USER_IMPERSONATED                |
| `SYSTEM`   | SYSTEM_SEED, MIGRATION_RUN, HEALTH_CHECK_FAILED                 |
| `SECURITY` | RATE_LIMIT_EXCEEDED, UNAUTHORIZED_ACCESS, SUSPICIOUS_ACTIVITY   |

### Log Fields

Each log entry captures:

- **Who**: `performedById` (actor), `targetUserId` (subject if applicable)
- **What**: `action` (string), `category` (enum)
- **Where**: `ipAddress`, `userAgent`
- **When**: `timestamp` (UTC)
- **Context**: `entityType`, `entityId`, `metadata` (JSON)
- **Outcome**: `success` (bool), `errorMessage`

### Tamper Prevention

- Audit logs have no `updatedAt` or `deletedAt` columns
- Database user should be granted `INSERT` only on `audit_logs` (not `UPDATE`/`DELETE`)
- For high-security environments: consider streaming audit logs to an immutable
  external store (e.g., AWS CloudTrail, BigQuery, Loki)

---

## 5. Data at Rest Encryption

### Database (PostgreSQL)

- **Volume encryption**: Enable full-disk encryption on the host (LUKS on Linux,
  BitLocker on Windows, or cloud-provider volume encryption)
- **Column-level encryption** (roadmap): Sensitive fields (e.g., metadata containing
  PII) can be encrypted at the application layer using AES-256-GCM before writing
  to PostgreSQL

### Object Storage (MinIO / S3)

- **Server-side encryption (SSE)**: Enable SSE-S3 or SSE-KMS on the bucket
- **MinIO local dev**: `MINIO_KMS_SECRET_KEY` can be set to enable envelope
  encryption
- **AWS S3**: Use `aws:kms` default bucket encryption with a CMK

### File-Level Encryption (roadmap)

The `File.isEncrypted` field tracks whether a file was encrypted before upload.
The roadmap includes client-side encryption using the Web Crypto API before
transmission, with the encryption key stored in a KMS.

---

## 6. Signed URL Mechanism

Files are never served directly from the backend or exposed via a public URL.
Downloads use **time-limited pre-signed URLs**:

```
Client ──GET /api/files/:id/url──▶ Backend
                                       │
                                       │ 1. Verify auth + permission
                                       │ 2. Verify FileShare record (if shared)
                                       │ 3. Check expiresAt on share
                                       │ 4. Generate S3 pre-signed URL (15 min TTL)
                                       │ 5. Write FILE_DOWNLOAD AuditLog
                                       ▼
                               ← { signedUrl: "https://..." }

Client ──GET signedUrl──▶ MinIO/S3 (direct, bypassing backend)
```

### Pre-signed URL Policy

| Setting          | Value      | Notes                             |
| ---------------- | ---------- | --------------------------------- |
| Default TTL      | 15 minutes | Configurable per tenant           |
| Max TTL          | 24 hours   | For bulk operations               |
| IP restriction   | Roadmap    | Restrict URL to requesting IP     |
| Download tracking| Yes        | `File.downloadCount` incremented  |

---

## 7. Rate Limiting

Rate limits are enforced at the nginx layer (before requests reach the application):

| Zone          | Limit   | Burst | Applies To              |
| ------------- | ------- | ----- | ----------------------- |
| `api_limit`   | 10 r/s  | 20    | `/api/*`                |
| `auth_limit`  | 5 r/s   | 10    | `/api/auth/*`           |
| `upload_limit`| 2 r/s   | 5     | `POST /api/files`       |

- Rate-limited requests return **HTTP 429** with `Retry-After` header
- IP addresses are used as the rate limit key (`$binary_remote_addr`)
- NestJS also implements `ThrottlerModule` as a second line of defense
- Optionally: use Redis-backed distributed throttling for multi-instance deployments

### Brute Force Protection

- `auth_limit` zone (5 r/s) prevents password brute force
- Failed login events are written to `AuditLog` with `category=SECURITY`
- Future: account lockout after N failed attempts

---

## 8. Network Security

### Docker Network Isolation

```
nexus_public   ← nginx only; exposed to internet
nexus_internal ← all backend services; NOT reachable from internet
                  (Docker `internal: true` flag)
```

- PostgreSQL, Redis, MinIO, Prometheus are on `nexus_internal` only
- Backend ↔ Database traffic never leaves the Docker internal network
- nginx is the **only** service on `nexus_public`

### nginx Security Headers

| Header                      | Value                                    |
| --------------------------- | ---------------------------------------- |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options`           | `DENY`                                   |
| `X-Content-Type-Options`    | `nosniff`                                |
| `X-XSS-Protection`          | `1; mode=block`                          |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`        |
| `Content-Security-Policy`   | Restricts scripts/styles to self + Firebase |
| `Permissions-Policy`        | Disables camera, microphone, geolocation |

### TLS Configuration

- Protocols: **TLS 1.2, TLS 1.3** (TLS 1.0/1.1 disabled)
- Cipher suites: Mozilla **Modern / Intermediate** profile
- OCSP stapling enabled
- HSTS with preload

---

## 9. HIPAA / FERPA Compliance Roadmap

> NEXUS VAULT is designed with healthcare (HIPAA) and education (FERPA) compliance
> in mind. The following controls are either implemented or on the roadmap.

### Implemented ✅

- Role-based access control with principle of least privilege
- Audit logging for all data access and modifications
- TLS encryption in transit
- Multi-tenant data isolation
- Session timeout and forced re-authentication
- Signed URLs (no persistent public file access)

### Roadmap 🗓️

| Control                        | Target         | Notes                                         |
| ------------------------------ | -------------- | --------------------------------------------- |
| Data at rest encryption        | Q3 2024        | S3 SSE-KMS + PostgreSQL column encryption     |
| Business Associate Agreement   | Q3 2024        | Required for HIPAA (Firebase / AWS / CF)      |
| Penetration testing            | Q3 2024        | Annual third-party pentest                    |
| SOC 2 Type II preparation      | Q4 2024        | Policy documentation + controls evidence      |
| Immutable audit log offloading | Q4 2024        | Stream audit logs to BigQuery / CloudTrail    |
| Client-side encryption         | Q1 2025        | End-to-end encryption before upload           |
| Data retention policies        | Q1 2025        | Auto-delete files after configurable period   |
| FERPA consent flows            | Q1 2025        | Parental consent for users under 18           |
| RBAC row-level security (RLS)  | Q2 2025        | PostgreSQL RLS as defense-in-depth            |
| FIPS 140-2 crypto              | Q2 2025        | Required for US federal compliance            |

---

## 10. Vulnerability Disclosure

If you discover a security vulnerability in NEXUS VAULT, please report it
**responsibly** and **privately**:

### Responsible Disclosure Process

1. **Email**: `security@nexusvault.example.com`
2. **Encrypt your report** using our PGP key (published at the address above)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - (Optional) Suggested remediation
4. We will acknowledge receipt within **48 hours**
5. We target a fix within **30 days** for critical issues, **90 days** for others
6. Reporters are credited in the release notes (opt-in)

### Scope

| In Scope                               | Out of Scope                         |
| -------------------------------------- | ------------------------------------ |
| Authentication bypass                  | Social engineering                   |
| IDOR / tenant data leakage             | Physical attacks                     |
| Privilege escalation                   | DDoS / volumetric attacks            |
| SQL injection                          | Issues requiring physical access     |
| XSS / CSRF                             | Third-party service vulnerabilities  |
| Insecure direct object references      |                                      |

### Bug Bounty

A formal bug bounty program is planned for Q4 2024. Until then, we offer
**recognition and swag** for qualifying reports.

---

*Last updated: 2024 — NEXUS VAULT Security Team*
