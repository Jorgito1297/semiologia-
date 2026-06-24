# CLAUDE.md — Enterprise AI Development Guide
## Semiología Médica Platform + NEXUS VAULT · ANTIGRAVITY 2.0   Análisis de senior sobre este `CLAUDE.md`, sin asumir nada del código que no esté documentado aquí.

## Problemas estructurales reales

**Acoplamiento de tres proyectos en un solo repo sin justificación documentada.** Semiología, NEXUS VAULT y Agents son negocios distintos (LMS médico educativo vs. SaaS documental multi-tenant vs. plataforma de automatización interna). Comparten Firebase Auth como decisión transversal, pero ni una línea explica por qué viven en el mismo repositorio. Si no hay código compartido real (librerías, tipos, contratos de API), esto es monorepo de conveniencia, no monorepo técnico. Consecuencia práctica: cualquier agente IA que abra este repo carga contexto de NEXUS VAULT al tocar un archivo de Semiología, y viceversa. Eso infla tokens, diluye el contexto persistente y aumenta la probabilidad de que el modelo "alucine" cruces entre sistemas que no existen (por ejemplo, sugerir Prisma en código que usa Supabase directo).

**Stack inconsistente sin ADR que lo explique.** Next.js 16 + React 19 es bleeding edge (riesgo de incompatibilidades con librerías de terceros); NEXUS VAULT usa React 18. ¿Es decisión deliberada de aislar el riesgo de la versión nueva en el sistema "no crítico", o es deuda técnica por evolución asincrónica? El documento no lo dice. Para un ingeniero que entra nuevo, o para Claude generando código, esa ambigüedad es la diferencia entre escribir código correcto y código que rompe en build.

**Mezcla de gestores de paquetes y plataformas sin pin de versiones.** PowerShell para Ollama, `.venv\Scripts\activate` solo Windows (sin contraparte `source .venv/bin/activate` para Mac/Linux) — indica que el repo asume un solo entorno de desarrollo. Si hay más de un desarrollador o CI en Linux, los comandos documentados aquí simplemente no sirven.

**Routing de modelos por tabla estática, no por código.** La tabla de routing IA (qwen2.5-coder vs qwen3 vs OpenRouter) vive solo en prosa en este markdown. No hay un `agents/config/router.py` referenciado con esa lógica versionada, ni criterio numérico de cuándo "contexto largo" dispara el salto a Gemini. Esto es la diferencia entre documentación descriptiva y documentación normativa: hoy es una sugerencia que cualquier agente puede ignorar o interpretar distinto cada sesión.

**Seguridad: las reglas están bien pero son afirmaciones, no controles verificables.** "Nunca hardcodear API keys" sin un hook de pre-commit (gitleaks, husky) o CI gate que lo fuerce es una política de honor. En un repo con datos médicos educativos y un sistema multi-tenant con storage S3-compatible, esto debería ser técnico, no documental.

## Cómo "coexiste" Claude en este repo, en la práctica

Lo que describe el archivo es manejo de contexto por convención (`@AGENTS.md` al final, secciones por sistema), no aislamiento real. Eso funciona mientras el repo es pequeño y un solo agente trabaja a la vez. Se rompe cuando:

- Claude Code abre sesión en la raíz del repo: carga las ~250 líneas completas de los tres sistemas aunque la tarea sea un fix de un componente en `/src/app/osce`. Eso es contexto desperdiciado en cada turno.
- Dos agentes (o dos sesiones) tocan `nexus-vault/` y `src/` simultáneamente: no hay mención de locks, de `memory/session_log.jsonl` como mecanismo de coordinación real, ni de cómo se evitan conflictos de decisiones contradictorias entre sesiones.
- El "contexto persistente" (`memory/project_context.json`, `decisions.md`, `session_log.jsonl`) está mencionado pero no hay esquema, no hay ejemplo de entrada, no hay política de cuándo se actualiza ni quién (¿el agente escribe ahí solo, o requiere aprobación humana?). Sin estructura definida, ese directorio se convierte en logs muertos que nadie lee ni el agente consulta de forma confiable.

## Qué arreglaría, en orden de impacto

1. **Separar el monorepo en submódulos o repos independientes**, o si hay razón real para mantenerlo unido, documentar esa razón en un ADR-007 explícito (ej. "comparten infraestructura de auth y se despliegan juntos en el mismo cluster").
2. **Convertir CLAUDE.md raíz en un router delgado** que apunte a un `CLAUDE.md` por subsistema (`src/CLAUDE.md`, `nexus-vault/CLAUDE.md`, `agents/CLAUDE.md`). Esto es lo que realmente resuelve el problema de "contexto multiarchivo": el agente carga solo el contexto del subsistema que está tocando, no los tres.
3. **Versionar el routing de modelos como código**, no como tabla en markdown — un JSON o YAML en `agents/config/` que el orquestador lea directamente, con el markdown apuntando a ese archivo como fuente de verdad.
4. **Definir el esquema de `memory/`** explícitamente: qué estructura tiene cada entrada de `session_log.jsonl`, qué dispara una escritura en `decisions.md` (¿automática por el agente, o requiere PR humano?), y cómo un agente nuevo "recupera" memoria al iniciar sesión — ahora mismo el archivo dice que existe memoria, pero no cómo se consume.
5. **Reemplazar reglas de seguridad declarativas por gates de CI**: gitleaks o trufflehog en pre-commit, lint rule que prohíba `as any` en TS, y un check que falle el build si se detecta Firebase Admin SDK importado fuera de rutas backend.
6. **Documentar el criterio cuantitativo** para cuándo se usa cloud vs local (no solo ">32k tokens", sino qué pasa si Ollama está caído, qué pasa si el query es médico-sensible y por tanto no debería ir a un proveedor cloud externo — esto es relevante dado que el propio documento dice que la privacidad de datos médicos es la razón de ser local-first; el documento se contradice a sí mismo al permitir fallback a OpenRouter/Gemini sin filtro de sensibilidad).

> Este archivo es la memoria institucional del proyecto para Claude Code y cualquier agente IA.
> Léelo completo antes de modificar cualquier archivo.

---

## 📐 ARQUITECTURA DEL REPOSITORIO

Este repositorio contiene **DOS sistemas independientes**:

### Sistema 1: Plataforma de Semiología Médica (`/src`, `/`)
- **Framework**: Next.js 16 (App Router) · React 19 · TypeScript
- **Base de datos**: Supabase (PostgreSQL) via `@supabase/supabase-js`
- **Auth**: Firebase Authentication
- **IA Local**: Ollama (qwen3:8b, qwen2.5-coder:7b, nomic-embed-text)
- **IA Cloud**: Gemini API (opcional), OpenAI API (opcional)
- **Propósito**: Plataforma LMS médica con repaso interactivo, OSCE, paciente virtual

### Sistema 2: NEXUS VAULT (`/nexus-vault/`)
- **Frontend**: React 18 + Vite 5 + TailwindCSS 3 + Zustand
- **Backend**: NestJS 10 + TypeScript + Prisma + Firebase Admin SDK
- **Base de datos**: PostgreSQL 16 (Docker)
- **Storage**: MinIO (S3-compatible)
- **Auth**: Firebase Auth como IdP → Backend valida tokens
- **Propósito**: Plataforma SaaS enterprise de gestión documental multi-tenant

### Sistema 3: AI Agents (`/agents/`)
- **Runtime**: Python 3.14 + .venv
- **Orquestador**: `agents/orchestrator.py`
- **Modelos**: Ollama local-first, OpenRouter como fallback cloud
- **Propósito**: Automatización, RAG, workflows de desarrollo

---

## 🤖 ROUTING DE MODELOS IA

### Regla de oro: **LOCAL FIRST, CLOUD WHEN NEEDED**

```
TAREA                          → MODELO
──────────────────────────────────────────────────────
Generación código TypeScript   → qwen2.5-coder:7b (Ollama)
Preguntas rápidas / QA         → qwen3:8b (Ollama)
Embeddings / RAG               → nomic-embed-text (Ollama)
Razonamiento complejo / arch   → OpenRouter (claude-3.5-sonnet o gemini-1.5-pro)
Contexto largo (>32k tokens)   → Gemini via OpenRouter
Debugging médico especializado → qwen3:8b con contexto RAG
Generación documentación       → qwen3:8b (Ollama)
Tests automáticos              → qwen2.5-coder:7b (Ollama)
```

### Variables de entorno requeridas:
```env
# LOCAL (siempre disponible)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=qwen3:8b
OLLAMA_CODE_MODEL=qwen2.5-coder:7b
OLLAMA_EMBED_MODEL=nomic-embed-text

# CLOUD (solo cuando local no alcanza)
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

---

## 📁 ESTRUCTURA DE CARPETAS

```
semiologia/
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/            # Route handlers (API endpoints)
│   │   ├── faculty/        # Panel docente
│   │   ├── login/          # Autenticación
│   │   ├── osce/           # Evaluaciones OSCE
│   │   ├── repaso/         # Sistema de repaso interactivo
│   │   └── page.tsx        # Home principal
│   ├── ai/                 # Lógica IA del sistema médico
│   │   └── compliance/     # Validaciones de cumplimiento
│   ├── rag/                # RAG pipeline médico
│   │   └── schemas/        # Esquemas de vectorización
│   ├── analytics/          # Métricas y telemetría
│   ├── config/             # Configuración centralizada
│   ├── ingestion/          # Pipeline de ingesta de documentos
│   ├── pipelines/          # Pipelines de procesamiento
│   ├── services/           # Servicios externos (Supabase, etc.)
│   └── utils/              # Utilidades compartidas
│
├── agents/                 # Sistema multi-agente AI
│   ├── config/             # Configuración de routing y modelos
│   ├── memory/             # Memoria persistente del proyecto
│   ├── base_agent.py       # Clase base de agentes
│   ├── orchestrator.py     # Orquestador central
│   ├── coding_agent.py     # Agente de código
│   ├── research_agent.py   # Agente de investigación
│   ├── rag_agent.py        # Agente RAG
│   └── doc_agent.py        # Agente documentación
│
├── workflows/              # Automatización de flujos
│   ├── dev_workflow.py     # Desarrollo → lint → test
│   ├── commit_workflow.py  # Auto-commits con changelog
│   └── rag_ingest.py       # Ingestión documental
│
├── memory/                 # Memoria institucional del proyecto
│   ├── project_context.json
│   ├── decisions.md        # Architecture Decision Records
│   └── session_log.jsonl   # Log de sesiones
│
├── nexus-vault/            # NEXUS VAULT (sistema independiente)
│   ├── apps/
│   │   ├── backend/        # NestJS API
│   │   └── frontend/       # React/Vite UI
│   ├── prisma/             # Schema Prisma
│   ├── infrastructure/     # Docker, nginx, monitoring
│   └── docker-compose.yml
│
├── scripts/                # Scripts de utilidad
├── public/                 # Assets estáticos Next.js
└── books/                  # PDFs médicos para RAG
```

---

## 💻 COMANDOS ESTÁNDAR

### Semiología (Next.js)
```bash
npm run dev          # Dev server en localhost:3000
npm run build        # Build producción
npm run lint         # ESLint check
```

### NEXUS VAULT
```bash
# Desde nexus-vault/
npm run docker:dev   # Levanta todos los servicios en Docker
npm run prisma:migrate  # Aplica migraciones DB
npm run prisma:seed     # Datos de prueba
```

### Agentes Python
```bash
# Activar entorno
.venv\Scripts\activate     # Windows

# Ejecutar agente
python agents/orchestrator.py
python agents/rag_agent.py --query "¿Qué es la semiología?"
```

### Ollama
```powershell
ollama list                          # Ver modelos disponibles
ollama run qwen3:8b                  # Chat interactivo
ollama pull nomic-embed-text         # Descargar modelo embedding
```

---

## 🔒 REGLAS DE SEGURIDAD — CRÍTICAS

1. **NUNCA commitear**: `.env`, `.env.local`, `serviceAccount*.json`, `*-private-key.json`
2. **NUNCA hardcodear**: API keys, UIDs de admin, contraseñas, tokens
3. **SIEMPRE usar**: `process.env.VAR_NAME` (Node) o `os.getenv('VAR')` (Python)
4. **Firebase Admin SDK**: Solo en backend. NUNCA en frontend/cliente
5. **Signed URLs**: Todo acceso a archivos debe ser via URL temporal con expiración
6. **Validación**: SIEMPRE validar en backend. Frontend es UX, no seguridad
7. **RBAC**: Verificar roles en cada endpoint. No confiar en claims del cliente sin validar

---

## 📐 STANDARDS DE CÓDIGO

### TypeScript (Next.js + NestJS)
```typescript
// ✅ CORRECTO
const user: User = await usersService.findByUid(uid);
if (!user) throw new NotFoundException(`User ${uid} not found`);

// ❌ INCORRECTO  
const user = await usersService.findByUid(uid) as any;
```

- **Strict mode** siempre activado
- **No `any`**: usar tipos explícitos o `unknown`
- **Async/await**: nunca `.then().catch()` sin razón
- **DTOs**: toda entrada de API debe tener DTO con class-validator
- **Error handling**: usar NestJS exceptions, no throws genéricos
- **Naming**: camelCase variables, PascalCase clases, UPPER_SNAKE_CASE constantes

### Python (Scripts + Agents)
```python
# ✅ CORRECTO
async def generate_review(topic: str, model: str = "qwen3:8b") -> str:
    """Generate a medical review for the given topic."""
    response = await ollama_client.generate(model=model, prompt=topic)
    return response.content

# ❌ INCORRECTO
def generate_review(topic, model="qwen3:8b"):
    # sin tipos, sin docstring
    ...
```

- **Type hints** en todas las funciones
- **Docstrings** en clases y métodos públicos
- **`async/await`** para operaciones I/O (Ollama, DB, archivos)
- **Logging** con `structlog` o `logging` — no `print()` en producción

---

## 🧪 TESTING STANDARDS

### Semiología
- Unit tests: Jest + React Testing Library
- E2E: Playwright (cuando aplique)
- Cobertura mínima: 70% en servicios críticos

### NEXUS VAULT Backend
- Unit: Jest + NestJS Testing utilities
- Integration: Supertest con DB de test real
- Correr antes de merge: `npm test --workspace=apps/backend`

### Python Agents
- Framework: pytest + pytest-asyncio
- Mock Ollama en tests: no consumir GPU en CI

---

## 🚀 DEPLOYMENT STANDARDS

### Semiología
1. Build: `npm run build`
2. Firebase App Hosting o Docker standalone
3. Variables de entorno via Firebase config o secrets manager

### NEXUS VAULT
1. `docker-compose up -d` (producción)
2. `npx prisma migrate deploy` (antes del primer run)
3. MinIO bucket: `mc mb local/nexusvault-files`
4. Monitoreo: Grafana en `:3001`, Prometheus en `:9090`

---

## 📊 ARQUITECTURA DE DECISIONES (ADR)

Ver `/memory/decisions.md` para el historial completo.

**Decisiones clave tomadas:**
- ADR-001: Next.js 16 (App Router) sobre Pages Router — modernidad y RSC
- ADR-002: Supabase sobre Firebase Firestore — SQL + RLS + mejor precio
- ADR-003: Firebase Auth como IdP-only — no como backend completo
- ADR-004: Ollama local-first — cero costo en desarrollo, privacidad datos médicos
- ADR-005: MinIO sobre AWS S3 directo — dev local gratis, idéntica API
- ADR-006: NestJS para NEXUS VAULT backend — DI, guards, interceptors nativos

---

## 🏥 CONTEXTO DE DOMINIO MÉDICO

Este proyecto maneja **datos educativos médicos sensibles**.

- Los PDFs en `/books/` son libros de texto (Llanio Tomo I y II)
- No se procesan datos de pacientes reales
- El sistema de repaso es para estudiantes de medicina
- OSCE = Objective Structured Clinical Examination
- Semiología = estudio de signos y síntomas clínicos

**Cuando generes preguntas o contenido médico:**
- Basarse en los libros del RAG, no en conocimiento general no verificado
- Marcar siempre "con fines educativos"
- No diagnosticar condiciones reales

---

## 🔗 REFERENCIAS RÁPIDAS

- Supabase dashboard: ver SUPABASE_URL en .env
- Firebase console: https://console.firebase.google.com
- Ollama API: http://localhost:11434
- NEXUS VAULT API docs: http://localhost:4000/api (Swagger)
- NEXUS VAULT MinIO: http://localhost:9001
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001

---

## ⚙️ OLLAMA — GUÍA DE OPERACIÓN

```powershell
# Verificar modelos disponibles
ollama list

# Llamada de prueba rápida
Invoke-RestMethod -Uri "http://localhost:11434/api/generate" `
  -Method Post -ContentType "application/json" `
  -Body '{"model": "qwen3:8b", "prompt": "Responde OK", "stream": false}'

# Ver uso de GPU/CPU
ollama ps
```

### Configuración `.env` requerida:
```env
LLM_PROVIDER=ollama
EMBEDDING_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=qwen3:8b
OLLAMA_CODE_MODEL=qwen2.5-coder:7b
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_TIMEOUT_SECONDS=120
```

---

@AGENTS.md

*Última actualización: 2026-06-12 · ANTIGRAVITY 2.0 · Sistema dual: Semiología + NEXUS VAULT*
