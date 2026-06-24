# NEXUS VAULT 🔐

> **Enterprise Secure File Vault Platform** — Multi-tenant, Firebase-authenticated, S3-backed file
> management with full audit trail and role-based access control.

---

## Architecture Overview

```
                         ┌─────────────────────────────────────────────┐
                         │             NEXUS VAULT Platform              │
                         └─────────────────────────────────────────────┘

  Browser / Mobile                    Docker Network: nexus_public
  ┌───────────┐          ┌──────────────────────────────────────────┐
  │  User     │──HTTPS──▶│              nginx (TLS)                  │
  └───────────┘          │  • TLS termination (443→80)              │
                         │  • Rate limiting (api/auth/upload zones)  │
                         │  • Security headers (HSTS, CSP, etc.)    │
                         └──────────┬───────────────┬───────────────┘
                                    │               │
                         Docker Network: nexus_internal (isolated)
                              ┌─────▼─────┐   ┌────▼────────┐
                              │  Backend  │   │  Frontend   │
                              │ (NestJS)  │   │ (React SPA) │
                              │  :4000    │   │   :80       │
                              └─────┬─────┘   └─────────────┘
                                    │
               ┌────────────────────┼────────────────────┐
               │                    │                    │
        ┌──────▼──────┐   ┌────────▼────────┐   ┌───────▼──────┐
        │ PostgreSQL  │   │     MinIO       │   │    Redis     │
        │    :5432    │   │  S3-compatible  │   │    :6379     │
        │  (Prisma)   │   │  :9000/:9001    │   │  (sessions)  │
        └─────────────┘   └─────────────────┘   └──────────────┘
               │
        ┌──────▼──────┐   ┌─────────────────┐
        │ Prometheus  │   │    Grafana       │
        │    :9090    │──▶│    :3001         │
        └─────────────┘   └─────────────────┘

  External: Firebase Authentication (Google Cloud)
```

---

## Tech Stack

| Layer       | Technology                         |
| ----------- | ---------------------------------- |
| Backend     | NestJS (Node 20), TypeScript       |
| Frontend    | React 18, Vite, TypeScript         |
| Database    | PostgreSQL 16 via Prisma ORM       |
| Auth        | Firebase Authentication            |
| Storage     | MinIO (dev) / AWS S3 / CF R2 (prod)|
| Cache       | Redis 7                            |
| Gateway     | nginx 1.25                         |
| Monitoring  | Prometheus + Grafana               |
| CI/CD       | GitHub Actions                     |
| Container   | Docker + Docker Compose            |

---

## Prerequisites

| Requirement   | Minimum Version | Notes                              |
| ------------- | --------------- | ---------------------------------- |
| Node.js       | 20.x LTS        | Use `nvm use` if nvm is installed  |
| npm           | 10.x            | Ships with Node 20                 |
| Docker        | 24.x            | Docker Desktop or Docker Engine    |
| Docker Compose| 2.x             | Included in Docker Desktop         |
| Firebase      | —               | Need a project for Auth            |

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-org/nexus-vault.git
cd nexus-vault
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in the required values — at minimum:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
# ... remaining VITE_FIREBASE_* vars
```

> **Where to get Firebase credentials**: Firebase Console →
> Project Settings → Service Accounts → Generate new private key

### 3. Start infrastructure services

```bash
# Production-like (all services)
docker compose up -d

# Development (hot-reload, no nginx, all ports exposed)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### 4. Run database migrations

```bash
npm run prisma:migrate:dev
```

### 5. Seed the database

```bash
npm run prisma:seed
```

### 6. Install Node dependencies (for local dev)

```bash
npm install
```

### 7. Start local development servers

```bash
npm run dev
```

| Service    | URL                       |
| ---------- | ------------------------- |
| Frontend   | http://localhost:3000     |
| Backend    | http://localhost:4000     |
| MinIO UI   | http://localhost:9001     |
| Grafana    | http://localhost:3001     |
| Prometheus | http://localhost:9090     |
| Prisma Studio | `npm run prisma:studio` |

---

## Environment Variables

### Required

| Variable                         | Description                              |
| -------------------------------- | ---------------------------------------- |
| `DATABASE_URL`                   | PostgreSQL connection string             |
| `FIREBASE_PROJECT_ID`            | Firebase project identifier              |
| `FIREBASE_CLIENT_EMAIL`          | Service account email                    |
| `FIREBASE_PRIVATE_KEY`           | Service account private key              |
| `JWT_SECRET`                     | 256-bit random string for internal tokens|
| `VITE_FIREBASE_API_KEY`          | Firebase web API key (frontend)          |
| `VITE_FIREBASE_AUTH_DOMAIN`      | Firebase auth domain (frontend)          |
| `VITE_FIREBASE_PROJECT_ID`       | Firebase project ID (frontend)           |

### Optional / Defaults

| Variable                   | Default                      | Description                |
| -------------------------- | ---------------------------- | -------------------------- |
| `PORT`                     | `4000`                       | Backend HTTP port          |
| `S3_ENDPOINT`              | `http://localhost:9000`      | MinIO/S3 endpoint          |
| `S3_BUCKET`                | `nexusvault-files`           | Object storage bucket      |
| `THROTTLE_TTL`             | `60`                         | Rate limit window (seconds)|
| `THROTTLE_LIMIT`           | `100`                        | Max requests per window    |
| `SESSION_TIMEOUT_MINUTES`  | `15`                         | Auto-logout idle timeout   |
| `REDIS_URL`                | `redis://localhost:6379`     | Redis connection string    |

---

## API Endpoints

| Method | Path                   | Auth     | Description                      |
| ------ | ---------------------- | -------- | -------------------------------- |
| GET    | `/health`              | None     | Health check                     |
| GET    | `/metrics`             | Internal | Prometheus metrics               |
| POST   | `/api/auth/login`      | Firebase | Exchange Firebase token          |
| POST   | `/api/auth/logout`     | JWT      | Invalidate session               |
| GET    | `/api/files`           | JWT      | List files (tenant-scoped)       |
| POST   | `/api/files`           | JWT      | Upload file                      |
| GET    | `/api/files/:id`       | JWT      | Get file metadata                |
| GET    | `/api/files/:id/url`   | JWT      | Get signed download URL          |
| DELETE | `/api/files/:id`       | JWT      | Soft-delete file                 |
| POST   | `/api/files/:id/share` | JWT      | Share file with another user     |
| GET    | `/api/users`           | Admin    | List users in tenant             |
| PATCH  | `/api/users/:id/role`  | Admin    | Change user role                 |
| GET    | `/api/audit-logs`      | Admin    | Paginated audit trail            |

---

## Data Flow: File Upload

```
Browser
  │ 1. User selects file
  ▼
Firebase Auth
  │ 2. Validate Firebase ID token
  ▼
POST /api/files (nginx → backend)
  │ 3. Check tenant storage quota
  │ 4. Scan file (ClamAV or stub)
  │ 5. Compute SHA-256 checksum
  │ 6. Upload to MinIO/S3
  │ 7. Save metadata to PostgreSQL (File record)
  │ 8. Write AuditLog entry
  │ 9. Update user.storageUsed
  ▼
Response: { id, signedUrl, size, mimeType }
```

---

## Monorepo Structure

```
nexus-vault/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI/CD
├── apps/
│   ├── backend/                # NestJS API
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   └── frontend/               # React + Vite SPA
│       ├── src/
│       ├── Dockerfile
│       ├── nginx-spa.conf
│       └── package.json
├── packages/                   # Shared packages (types, utils)
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── seed.ts                 # Development seed data
│   └── migrations/             # Auto-generated migrations
├── infrastructure/
│   ├── nginx/
│   │   ├── nginx.conf          # Global nginx config
│   │   ├── conf.d/
│   │   │   └── nexusvault.conf # Virtual host + SSL
│   │   └── certs/              # TLS certificates (not in git)
│   └── monitoring/
│       ├── prometheus.yml
│       └── grafana/
│           ├── datasources/
│           └── dashboards/
├── docker-compose.yml          # Production compose
├── docker-compose.dev.yml      # Development overrides
├── .env.example                # Environment template
├── .gitignore
├── .prettierrc
├── package.json                # Monorepo root
├── README.md
└── SECURITY.md
```

---

## Deployment to Production

### 1. Provision a server (Ubuntu 22.04+)

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### 2. Set up TLS certificates

```bash
# Using Let's Encrypt / Certbot
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com

# Copy certs to nginx
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem infrastructure/nginx/certs/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem infrastructure/nginx/certs/
```

### 3. Configure production secrets

```bash
cp .env.example .env
# Edit .env with production values — use a secrets manager in CI (GitHub Secrets, Vault, etc.)
```

### 4. Update nginx domain

Edit `infrastructure/nginx/conf.d/nexusvault.conf` and replace `yourdomain.com` with your domain.

### 5. Deploy

```bash
docker compose pull
docker compose up -d --build
npm run prisma:migrate    # run from CI or a migration job
```

### 6. Verify health

```bash
curl https://yourdomain.com/health
# Expected: {"status":"ok","version":"1.0.0"}
```

---

## Security Best Practices

- **Never commit `.env`** — use `.env.example` as the template
- **Rotate Firebase private keys** periodically via the Firebase Console
- **Use strong passwords** for PostgreSQL, Redis, MinIO, and Grafana
- **Disable exposed ports** in `docker-compose.yml` for postgres (5432) in production
- **Enable PostgreSQL SSL** — append `?sslmode=require` to `DATABASE_URL`
- **Use read-only mounts** for nginx config volumes (`:ro`)
- **Enable Redis AUTH** — always set `requirepass` in production
- **Run containers as non-root** — backend Dockerfile uses `nestjs` uid 1001

See [SECURITY.md](./SECURITY.md) for comprehensive security documentation.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit using Conventional Commits: `git commit -m "feat: add file versioning"`
4. Push and open a Pull Request against `develop`
5. CI must pass before merge; at least 1 review required

### Commit Convention

```
feat:     New feature
fix:      Bug fix
docs:     Documentation only
style:    Formatting, no logic change
refactor: Code change, no feature/fix
test:     Adding or updating tests
chore:    Build, tooling, dependencies
```

---

## License

MIT © 2024 NEXUS VAULT Contributors
