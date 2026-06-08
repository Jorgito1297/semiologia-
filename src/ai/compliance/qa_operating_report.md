# UCE MED-228 QA Agent Compliance and Systems Audit Report
**Medical AI Learning System — Universidad Central del Este (UCE)**  
**Auditor Persona:** QA and Systems Compliance Analyst  
**Date:** June 6, 2026  
**Status Verdict:** 🔴 **NO-GO** (Active blockers prevent transition from Fase 2 to Fase 3)

---

## 📋 Executive Summary

This audit evaluates the codebase and database schema of the **MED-228 Propedéutica Clínica y Semiología Médica** platform against the official **UCE MED-228 QA Agent Operating Manual**. 

The current system has successfully established its database migrations, RLS policies, vector chunking rules, and a socratic prompt generator. However, critical gaps in **active content counts**, **spaced repetition interval constraints**, and **Moodle API scope boundary violations** constitute active blockers. The overall verdict is a **NO-GO** for transitioning to Fase 3 until these issues are resolved.

---

## 🔍 Phase-by-Phase Compliance Audit

### 📅 FASE 1 — FOUNDATION
* **1.1 Project Structure & Environment**: 🟢 **GO**
  * The project follows a Next.js App Router structure with distinct folders for `src/app`, `src/services`, `src/utils`, `src/analytics`, and `src/ai`.
  * Node version: Standard Dev environment is aligned. Next.js (`16.2.7`) and React (`19.2.4`) are defined in [package.json](file:///c:/Users/jorgi/OneDrive/Desktop/semiologia/package.json).
  * pgvector: Enabled in both [20260605_vector_schema.sql](file:///c:/Users/jorgi/OneDrive/Desktop/semiologia/supabase/migrations/20260605_vector_schema.sql) and [20260606_002_content_chunks.sql](file:///c:/Users/jorgi/OneDrive/Desktop/semiologia/supabase/migrations/20260606_002_content_chunks.sql).
* **1.2/1.3 Schema Integrity & Constraint Validation**: 🟢 **GO WITH DEBT**
  * All required tables (`courses`, `competencies`, `academic_blocks`, `content_chunks`, `students`, `student_memory_states`, `student_competency_progress`) are successfully defined in migrations.
  * `validated_by` column is strictly marked `NOT NULL` in the `content_chunks` table, enforcing professional medical oversight.
  * Vector index `idx_content_chunks_embedding` is created using `ivfflat` with `vector_cosine_ops`.
  * *Technical Debt*: Redundant vector schema. The older table `academic_embeddings` from [20260605_vector_schema.sql](file:///c:/Users/jorgi/OneDrive/Desktop/semiologia/supabase/migrations/20260605_vector_schema.sql) is unused and sits as dead code. All current operations read/write to `content_chunks` from [20260606_002_content_chunks.sql](file:///c:/Users/jorgi/OneDrive/Desktop/semiologia/supabase/migrations/20260606_002_content_chunks.sql).
* **1.4 Academic Seeds**: 🟢 **GO**
  * Seed values in [20260606_001_academic_foundation.sql](file:///c:/Users/jorgi/OneDrive/Desktop/semiologia/supabase/migrations/20260606_001_academic_foundation.sql) perfectly align with UCE regulations:
    * `MED-228` course has `credits = 3`, `theory_hours = 2`, and `practical_hours = 3`.
    * Academic blocks: `block_1` (30%), `block_2` (30%), `block_3` (0% - auxiliary review), and `final` (40%).
    * Competencies: Seeded with 6 official generic competencies (`CG1`, `CG2`, `CG6`, `CG7`, `CG8`, `CG11`).
* **1.5 Security & Row-Level Security (RLS)**: 🟢 **GO**
  * RLS is enabled on all tables in [20260606_004_rls_policies.sql](file:///c:/Users/jorgi/OneDrive/Desktop/semiologia/supabase/migrations/20260606_004_rls_policies.sql).
  * Policy `chunks_read_active` enforces that students can only select chunks where `is_active = true`. Inactive or unvalidated chunks are hidden from students.
  * Isolation is maintained: students can only select or edit their own profile, memory states, and competency progress.
* **1.6 Content Quality & Volume**: 🔴 **NO-GO (BLOCKER)**
  * The manual requires: **Block 1 >= 30 active chunks**, **Block 2 >= 30 active chunks**, and **each CG competency >= 5 active chunks**.
  * According to the compliance audit data, the database only contains **4 indexed chunks**, out of which only **1 chunk is validated and active** (Block 1, CG6). No active chunks exist for Block 2, Block 3, or the final evaluation block. CG1, CG2, CG7, CG8, and CG11 have 0 active chunks. This is a critical content coverage gap.

---

### 🧠 FASE 2 — LEARNING ENGINE
* **2.1 Baseline Metrics**: 🔴 **NO-GO (BLOCKER)**
  * The transition gate requires: `total_students >= 1`, `active_chunks >= 60`, `memory_states >= 0`, and migrations 001–004 stable.
  * Active chunks are currently at **1**, failing the baseline gate.
  * Migration rollback commands are unstable and contain critical syntax/semantic errors (see detailed section below).
* **2.2 Scope Boundaries**: 🔴 **NO-GO (BLOCKER)**
  * The manual explicitly dictates: **No virtual patients code**, **no Moodle API integration**, and **no voice AI features**.
  * Voice AI & Virtual Patients: Compliant (no active routes or external libraries exist).
  * Moodle API Integration: **VIOLATED**. The repository contains [supabase_moodle_proxy.ts](file:///c:/Users/jorgi/OneDrive/Desktop/semiologia/supabase_moodle_proxy.ts) (a secure CORS proxy Edge Function implementing Moodle login token exchange and REST calls to fetch assignments and calendar events) and `moodle_downloader.py`. The Next.js dashboard in [page.tsx](file:///c:/Users/jorgi/OneDrive/Desktop/semiologia/src/app/page.tsx) directly invokes this proxy to sync user data, violating the strict scope boundary of Fase 2.
* **2.3 Spaced Repetition Spacing Algorithm**: 🔴 **NO-GO (BLOCKER)**
  * The manual requires: **Distribution in 4 memory domains**, **review spacing of 1–30 days**, and **ease_factor in the [1.3, 5.0] range**.
  * The SM-2 implementation in [sm2.ts](file:///c:/Users/jorgi/OneDrive/Desktop/semiologia/src/utils/sm2.ts) enforces the `ease_factor` limit: `nextEF = Math.max(1.3, Math.min(5.0, nextEF));` (compliant).
  * The 4 memory domains (`semantic`, `procedural`, `executive`, `perceptual`) are implemented in types and components.
  * Spacing 1-30 days: **VIOLATED**. The algorithm in [sm2.ts](file:///c:/Users/jorgi/OneDrive/Desktop/semiologia/src/utils/sm2.ts) checks for `Math.max(1, nextIntervalDays)` but does **NOT** cap the maximum interval at 30 days. Under consecutive correct answers, intervals can grow indefinitely (e.g., 6 days * 2.5 EF = 15; 15 days * 2.5 EF = 38 days), violating the 30-day upper bound.
  * Database Constraints: Spaced repetition constraints are only partially checked at the application layer. The table `student_memory_states` in [003_students_neuro.sql](file:///c:/Users/jorgi/OneDrive/Desktop/semiologia/supabase/migrations/20260606_003_students_neuro.sql) lacks database-level `CHECK` constraints to enforce `ease_factor BETWEEN 1.3 AND 5.0` and `interval_days BETWEEN 1 AND 30`.

---

### 🤖 FASE 3 — RAG & AGENTS
* **3.1 Vector Database Chunking**: 🟢 **GO WITH DEBT**
  * [ingest_academic_resources.py](file:///c:/Users/jorgi/OneDrive/Desktop/semiologia/ingest_academic_resources.py) chunks text with `chunk_size = 800` and `overlap = 120` (15%), and pages with `chunk_size = 900` and `overlap = 100` (11%). Both conform to the recommended `500-1500` characters size and `10-20%` overlap guidelines.
  * pgvector is used with an `ivfflat` index on `content_chunks` and an `hnsw` index on `academic_embeddings`.
  * *Technical Debt*: Unused, redundant `academic_embeddings` table index.
* **3.2 Prompting Quality & Latency**: 🟢 **GO WITH DEBT**
  * The prompt template in [generate_review.py](file:///c:/Users/jorgi/OneDrive/Desktop/semiologia/generate_review.py) configures a socratic, empathetic doctor persona aligned with UCE guidelines. It strictly references UCE's official bibliography (Argente-Álvarez, Bates/Bickley, Surós, Goic) and guides the student using the **IPPAA Method** (Anamnesis, Planificación, Ejecución Activa/IPPAA, Evaluación).
  * Latency: Simulated vector query latency is highly efficient (~12ms).
* **3.3 Agent Compliance & Logging**: 🔴 **NO-GO (BLOCKER)**
  * The double-validation pipeline is present in [academic_compliance_agent.py](file:///c:/Users/jorgi/OneDrive/Desktop/semiologia/src/ai/compliance/academic_compliance_agent.py).
  * Logger completeness: **VIOLATED**. The logging function `log_action` in [academic_compliance_agent.py](file:///c:/Users/jorgi/OneDrive/Desktop/semiologia/src/ai/compliance/academic_compliance_agent.py) does not write `memory_domain` or `content_type` properties to [compliance_logs.json](file:///c:/Users/jorgi/OneDrive/Desktop/semiologia/src/ai/compliance/compliance_logs.json). As a result, when parsing local compliance logs for audits, all memory domains and content types evaluate to `0`, breaking analytics reports.
  * Hardcoded telemetry: The compliance report generator has hardcoded average student mastery values (e.g., `avg_cg6 = 71.2`, `avg_cg2 = 58.4`, `at_risk = 3`) rather than querying these dynamically from `student_competency_progress` or `student_memory_states`.

---

### 🏥 FASE 4 — CLINICAL INTEGRATION
* **4.1 OSCE Simulations**: 🟢 **GO**
  * Spaced repetition flashcards and quiz questions support self-evaluation. No voice integration features are present, keeping the system compliant with Phase 2 scope limits.
* **4.2 Telemedicine Simulator**: 🔴 **NO-GO (NOT YET IMPLEMENTED)**
  * No telemedicine routes, layouts, or schemas exist in the codebase.
* **4.3 Deployment & Testing**: 🟢 **GO WITH DEBT**
  * Firebase Hosting deployment configuration is set up in `firebase.json` and integrated with watchdog debouncing in [medical_guardian.py](file:///c:/Users/jorgi/OneDrive/Desktop/semiologia/medical_guardian.py).
  * *Technical Debt*: The codebase completely lacks automated regression, integration, or unit test suites.

---

## 🛠️ SQL Rollback Discrepancy Analysis

The rollback commands declared in the migration headers contain critical syntax and logical errors that would cause data corruption or failure to clean the database:

1. **[001_academic_foundation.sql](file:///c:/Users/jorgi/OneDrive/Desktop/semiologia/supabase/migrations/20260606_001_academic_foundation.sql)**:
   * **Header Rollback Command**: `DROP SCHEMA IF EXISTS med228 CASCADE;`
   * **Discrepancy**: The migration creates tables (`courses`, `competencies`, `academic_blocks`) and custom enums (`content_type`, `memory_domain`, `evaluation_type`, `block_type`, `cg_competency`) in the **`public` schema** rather than a `med228` schema. Executing this rollback command is a no-op that leaves the database fully dirty.
   * **Corrected Rollback**:
     ```sql
     DROP TABLE IF EXISTS public.academic_blocks CASCADE;
     DROP TABLE IF EXISTS public.competencies CASCADE;
     DROP TABLE IF EXISTS public.courses CASCADE;
     DROP TYPE IF EXISTS public.content_type CASCADE;
     DROP TYPE IF EXISTS public.memory_domain CASCADE;
     DROP TYPE IF EXISTS public.evaluation_type CASCADE;
     DROP TYPE IF EXISTS public.block_type CASCADE;
     DROP TYPE IF EXISTS public.cg_competency CASCADE;
     ```

2. **[003_students_neuro.sql](file:///c:/Users/jorgi/OneDrive/Desktop/semiologia/supabase/migrations/20260606_003_students_neuro.sql)**:
   * **Header Rollback Command**: `DROP TABLE IF EXISTS student_memory_states, students CASCADE;`
   * **Discrepancy**: This migration also creates the `student_competency_progress` table. Running the declared rollback command drops `students` and `student_memory_states`, which removes foreign keys from `student_competency_progress` due to `CASCADE`, but **leaves the `student_competency_progress` table itself intact**. This creates orphaned tables and schema pollution.
   * **Corrected Rollback**:
     ```sql
     DROP TABLE IF EXISTS public.student_memory_states CASCADE;
     DROP TABLE IF EXISTS public.student_competency_progress CASCADE;
     DROP TABLE IF EXISTS public.students CASCADE;
     ```

3. **[004_rls_policies.sql](file:///c:/Users/jorgi/OneDrive/Desktop/semiologia/supabase/migrations/20260606_004_rls_policies.sql)**:
   * **Header Rollback Command**: Missing clear instructions.
   * **Corrected Rollback**:
     ```sql
     DROP POLICY IF EXISTS students_self_access ON public.students;
     DROP POLICY IF EXISTS memory_self_access ON public.student_memory_states;
     DROP POLICY IF EXISTS competency_self_access ON public.student_competency_progress;
     DROP POLICY IF EXISTS chunks_read_active ON public.content_chunks;
     ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
     ALTER TABLE public.student_memory_states DISABLE ROW LEVEL SECURITY;
     ALTER TABLE public.student_competency_progress DISABLE ROW LEVEL SECURITY;
     ALTER TABLE public.content_chunks DISABLE ROW LEVEL SECURITY;
     ```

---

## 🚨 Active Blockers & Systems Deviations Matrix

| ID | Phase | Target File / Area | Severity | Description | Action Item |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **B-01** | Fase 1 | Database & Ingestion | 🔴 **Critical** | Database contains only 1 active chunk (Block 1, CG6). Falls short of the required 60+ (30 in Block 1, 30 in Block 2, >=5 per CG). | Run `ingest_academic_resources.py` with official textbooks and syllabi to populate the DB. |
| **B-02** | Fase 2 | [supabase_moodle_proxy.ts](file:///c:/Users/jorgi/OneDrive/Desktop/semiologia/supabase_moodle_proxy.ts) | 🔴 **Critical** | Direct integration with Moodle API for sync. Violates Phase 2 scope boundaries. | Disable Moodle API sync features or lock them behind a future toggle. |
| **B-03** | Fase 2 | [sm2.ts](file:///c:/Users/jorgi/OneDrive/Desktop/semiologia/src/utils/sm2.ts) | 🔴 **Critical** | Spaced repetition spacing interval has no upper limit of 30 days, allowing growing review dates. | Apply `Math.min(30, nextIntervalDays)` before returning the calculated state. |
| **B-04** | Fase 2 | [003_students_neuro.sql](file:///c:/Users/jorgi/OneDrive/Desktop/semiologia/supabase/migrations/20260606_003_students_neuro.sql) | 🟡 **Medium** | Missing database-level CHECK constraints for `ease_factor` [1.3, 5.0] and `interval_days` [1, 30]. | Add check constraints to `student_memory_states` table columns. |
| **B-05** | Fase 3 | [academic_compliance_agent.py](file:///c:/Users/jorgi/OneDrive/Desktop/semiologia/src/ai/compliance/academic_compliance_agent.py) | 🔴 **Critical** | Compliance logging function `log_action` forgets to record `memory_domain` and `content_type` properties. | Modify the JSON logging payload to include `memory_domain` and `content_type` fields. |
| **B-06** | Fase 3 | [academic_compliance_agent.py](file:///c:/Users/jorgi/OneDrive/Scalar) | 🟡 **Medium** | Compliance reports display hardcoded student telemetry rather than running dynamic SQL metrics. | Update reporting functions to execute live aggregation queries on progress tables. |
| **B-07** | Database | Migration Rollbacks | 🔴 **Critical** | Rollbacks drop wrong schemas or leave orphaned tables (`student_competency_progress` remaining). | Refactor migration rollback comments and script files to implement correct drops. |

---

## 📈 Recommendations and Corrective Actions

1. **Fix Spacing Cap**: Edit [sm2.ts](file:///c:/Users/jorgi/OneDrive/Desktop/semiologia/src/utils/sm2.ts) to cap intervals:
   ```typescript
   // Ensure interval is bounded between 1 and 30 days
   nextIntervalDays = Math.max(1, Math.min(30, nextIntervalDays));
   ```
2. **Implement DB Constraints**: Run an alter table migration to enforce database-level limits:
   ```sql
   ALTER TABLE student_memory_states 
     ADD CONSTRAINT check_ease_factor CHECK (ease_factor BETWEEN 1.3 AND 5.0),
     ADD CONSTRAINT check_interval_days CHECK (interval_days BETWEEN 1 AND 30);
   ```
3. **Enhance Logging**: Update `log_action` in compliance agent to include missing metadata:
   ```python
   "memory_domain": chunk_data.get("memory_domain"),
   "content_type": chunk_data.get("content_type")
   ```
4. **Clean Rollbacks**: Update rollback headers in all SQL files with the corrected SQL commands to maintain local and production migrations structure.
