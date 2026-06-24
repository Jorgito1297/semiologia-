# Architecture Decision Records (ADR)
## Semiología Médica Platform + NEXUS VAULT

> Este documento registra todas las decisiones de arquitectura importantes.
> Cada ADR explica el contexto, opciones consideradas, decisión final y consecuencias.
> **No se deben borrar ADRs** — marcar como "Superseded" si cambian.

---

## ADR-001: Next.js 16 con App Router

**Status**: ✅ Accepted  
**Date**: 2025-01-01

### Context
Necesitamos un framework frontend para la plataforma LMS médica que soporte SSR, buen SEO y desarrollo rápido.

### Options Considered
- Next.js 16 (App Router)
- Next.js 14 (Pages Router)
- Remix
- SvelteKit

### Decision
**Next.js 16 con App Router**

### Consequences
- ✅ React Server Components reducen JavaScript del cliente
- ✅ Co-location de data fetching con los componentes
- ✅ Mejor performance inicial con streaming
- ⚠️ Breaking changes respecto a Pages Router — curva de aprendizaje
- ⚠️ Algunos patrones de App Router aún evolucionan

---

## ADR-002: Supabase para base de datos de Semiología

**Status**: ✅ Accepted  
**Date**: 2025-01-01

### Context
La plataforma de semiología necesita almacenar usuarios, preguntas, respuestas, métricas de aprendizaje.

### Options Considered
- Firebase Firestore (NoSQL)
- Supabase (PostgreSQL managed)
- PlanetScale (MySQL)
- Self-hosted PostgreSQL

### Decision
**Supabase (PostgreSQL managed)**

### Consequences
- ✅ SQL estructurado — mejor para relaciones complejas de datos educativos
- ✅ Row Level Security (RLS) — seguridad a nivel de base de datos
- ✅ Precio predecible, free tier generoso
- ✅ Roadmap hacia HIPAA compliance
- ✅ Realtime subscriptions built-in
- ❌ Vendor lock-in (mitigable con Prisma como abstracción)

---

## ADR-003: Firebase Auth como IdP únicamente

**Status**: ✅ Accepted  
**Date**: 2025-03-01

### Context
Necesitamos autenticación con soporte para Google OAuth, Microsoft OAuth y email/password. El sistema anterior usaba Firebase directamente desde el frontend.

### Options Considered
- Firebase Auth + acceso directo desde frontend (patrón previo)
- Firebase Auth como IdP → Backend valida tokens (patrón enterprise)
- Auth0
- Supabase Auth

### Decision
**Firebase Auth como IdP → tokens validados en backend via Admin SDK**

### Consequences
- ✅ Backend tiene control total de autorización (RBAC via Custom Claims)
- ✅ Auditoría completa de accesos en backend
- ✅ Cumplimiento enterprise (no confiar en cliente)
- ✅ Soporta Google, Microsoft, Email/Password out-of-the-box
- ⚠️ Requiere Firebase Admin SDK en backend — no en frontend
- ⚠️ Token refresh gestionado en Axios interceptors del cliente

---

## ADR-004: Ollama como proveedor de IA local-first

**Status**: ✅ Accepted  
**Date**: 2025-01-01

### Context
La plataforma necesita IA para generar repasos, preguntas y analizar contenido médico. Los datos médicos educativos son sensibles.

### Options Considered
- OpenAI API (cloud, de pago, datos en servidores externos)
- Google Gemini API (cloud, de pago)
- Ollama (local, gratis, privado)
- Hugging Face Inference (cloud o self-hosted)

### Decision
**Ollama como proveedor local-first, con OpenRouter como fallback cloud opcional**

### Consequences
- ✅ Cero costo en desarrollo
- ✅ Privacidad total — datos nunca salen del sistema local
- ✅ Funciona offline
- ✅ No rate limits
- ⚠️ Requiere GPU o CPU potente para inferencia rápida
- ⚠️ Calidad inferior a GPT-4 para tareas muy complejas (mitigado con RAG)

---

## ADR-005: MinIO para storage en NEXUS VAULT

**Status**: ✅ Accepted  
**Date**: 2026-06-01

### Context
NEXUS VAULT necesita almacenamiento de archivos con Signed URLs, sin exposición pública, multi-tenant.

### Options Considered
- AWS S3 (cloud, de pago, requiere cuenta AWS)
- Cloudflare R2 (cloud, económico, egress gratis)
- MinIO self-hosted (S3-compatible, gratis)
- Firebase Storage (NO — ya descartado por arquitectura)

### Decision
**MinIO self-hosted en desarrollo/staging, con override via env vars para AWS S3 o R2 en producción**

### Consequences
- ✅ Cero costo en desarrollo
- ✅ API 100% compatible con AWS S3 SDK
- ✅ Cambio a S3/R2 en producción = solo cambiar 3 variables de entorno
- ✅ Signed URLs con expiración automática
- ⚠️ Requiere gestión del volumen Docker en producción (backups)
- ⚠️ No tiene CDN nativo (usar CloudFront o Cloudflare si se necesita)

---

## ADR-006: NestJS para backend de NEXUS VAULT

**Status**: ✅ Accepted  
**Date**: 2026-06-01

### Context
NEXUS VAULT necesita un backend enterprise con RBAC, auditoría, rate limiting, validación de DTOs y Swagger.

### Options Considered
- NestJS (TypeScript, DI, decoradores, enterprise patterns)
- Fastify solo (más rápido, menos estructura)
- Express solo (flexible, poco opinionado)
- Hono (nuevo, muy rápido, minimal)

### Decision
**NestJS con FastifyAdapter** (mejor performance que Express, estructura enterprise)

### Consequences
- ✅ Guards, Interceptors, Pipes nativos — ideal para RBAC + Audit
- ✅ Inyección de dependencias — testeable
- ✅ Swagger/OpenAPI automático via decoradores
- ✅ Módulos independientes — escalable a microservicios
- ⚠️ Curva de aprendizaje para devs sin experiencia en NestJS
- ⚠️ Más boilerplate que Express/Fastify puro

---

## ADR-007: Sistema multi-agente Python para automatización IA

**Status**: ✅ Accepted  
**Date**: 2026-06-12

### Context
El proyecto necesita agentes IA para automatización de desarrollo, RAG sobre documentos médicos, y asistencia al desarrollador.

### Options Considered
- LangChain (complejo, muchas dependencias, overhead)
- LlamaIndex (bueno para RAG, excesivo para nuestro caso)
- Framework custom lightweight (control total, cero dependencias extra)
- AutoGen (multi-agent, Microsoft)

### Decision
**Framework custom Python lightweight** basado en httpx + asyncio + Ollama API directamente

### Consequences
- ✅ Cero dependencias pesadas (no LangChain)
- ✅ Control total del routing de modelos
- ✅ Fácil de extender con nuevos agentes
- ✅ Ollama local-first con fallback OpenRouter
- ⚠️ Más código a mantener vs usar un framework existente
- ⚠️ Sin ecosystem de plugins de LangChain (no los necesitamos)

---

*Última actualización: 2026-06-12 · Mantenido por el equipo de desarrollo*
