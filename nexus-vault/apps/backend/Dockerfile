# =============================================================================
# NEXUS VAULT — Backend Dockerfile (NestJS)
# Multi-stage: deps → builder → production
# Runs as non-root user "nestjs" (uid 1001)
# =============================================================================

# ── Stage 1: Install production dependencies + generate Prisma client ────────
FROM node:20-alpine AS deps
WORKDIR /app

# Install system deps needed by native modules (bcrypt, etc.)
RUN apk add --no-cache libc6-compat openssl

COPY package*.json ./
COPY prisma ./prisma/

# Install ONLY production deps; generate Prisma client against real schema
RUN npm install --omit=dev
RUN npx prisma generate

# ── Stage 2: Full install + TypeScript compilation ────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY package*.json ./
RUN npm install

COPY . .
# Ensure Prisma client is generated for the builder too
RUN npx prisma generate
RUN npm run build

# ── Stage 3: Development image (hot reload via nodemon) ──────────────────────
FROM node:20-alpine AS development
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY package*.json ./
RUN npm install  # full install for devDependencies

COPY . .
RUN npx prisma generate

EXPOSE 4000 9229

CMD ["npm", "run", "start:dev"]

# ── Stage 4: Lean production image ───────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Security hardening
RUN apk add --no-cache libc6-compat openssl wget \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nestjs -u 1001

# Copy only what's needed from previous stages
COPY --from=deps  --chown=nestjs:nodejs /app/node_modules         ./node_modules
COPY --from=deps  --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nestjs:nodejs /app/dist               ./dist
COPY --chown=nestjs:nodejs prisma ./prisma
COPY --chown=nestjs:nodejs package.json ./

# Drop to non-root
USER nestjs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -q --spider http://localhost:4000/health || exit 1

CMD ["node", "dist/main"]
