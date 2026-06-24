-- ============================================
-- MIGRATION: 003_students_neuro
-- Description: Student profiles and memory tracking per domain
-- Rollback:
--   DROP TABLE IF EXISTS public.student_memory_states CASCADE;
--   DROP TABLE IF EXISTS public.student_competency_progress CASCADE;
--   DROP TABLE IF EXISTS public.students CASCADE;
-- ============================================

BEGIN;

-- ============================================
-- TABLE: students
-- ============================================

CREATE TABLE IF NOT EXISTS students (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id             UUID UNIQUE,               -- Supabase auth.users reference
  full_name           TEXT NOT NULL,
  email               TEXT NOT NULL UNIQUE,
  course_id           UUID REFERENCES courses(id),

  -- Prerequisite tracking
  completed_med224    BOOLEAN NOT NULL DEFAULT true,
  med224_baseline_score NUMERIC(5,2),            -- set during Phase 2 diagnostic

  -- Session metadata
  last_active         TIMESTAMPTZ,
  timezone            TEXT DEFAULT 'America/Santo_Domingo',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: student_memory_states
-- One row per student per chunk per memory domain
-- This is the core of the NeuroAdaptive Engine
-- ============================================

CREATE TABLE IF NOT EXISTS student_memory_states (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID REFERENCES students(id) ON DELETE CASCADE,
  chunk_id        UUID REFERENCES content_chunks(id) ON DELETE CASCADE,

  -- Memory Domain (matches chunk's memory_domain)
  memory_domain   memory_domain NOT NULL,

  -- Performance Metrics
  accuracy_pct    NUMERIC(5,2) DEFAULT 0,        -- 0–100
  response_time_s NUMERIC(6,2),                  -- seconds
  confidence_pct  NUMERIC(5,2) DEFAULT 0,        -- self-reported or inferred

  -- NeuroAdaptive Scores
  memory_decay_score   NUMERIC(5,4) DEFAULT 1.0, -- 0.0 (forgotten) to 1.0 (retained)
  difficulty_level     INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  review_count         INTEGER DEFAULT 0,

  -- Spaced Repetition Scheduling
  next_review_at       TIMESTAMPTZ,
  interval_days        INTEGER DEFAULT 1,
  ease_factor          NUMERIC(4,2) DEFAULT 2.5, -- SM-2 algorithm factor

  -- Cognitive State
  fatigue_level        TEXT CHECK (fatigue_level IN ('low','medium','high')),
  bias_detected        TEXT[],                   -- ['premature_closure', 'anchoring']

  -- Timestamps
  last_reviewed_at     TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE (student_id, chunk_id, memory_domain)
);

-- ============================================
-- TABLE: student_competency_progress
-- Tracks CG competency achievement per student
-- This enables: "Student mastered CG2 at 81%"
-- ============================================

CREATE TABLE IF NOT EXISTS student_competency_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id       UUID REFERENCES courses(id) ON DELETE CASCADE,
  competency      cg_competency NOT NULL,

  -- Progress
  mastery_pct     NUMERIC(5,2) DEFAULT 0,        -- 0–100
  items_attempted INTEGER DEFAULT 0,
  items_correct   INTEGER DEFAULT 0,

  -- Block breakdown
  block_1_pct     NUMERIC(5,2),
  block_2_pct     NUMERIC(5,2),
  block_3_pct     NUMERIC(5,2),
  final_pct       NUMERIC(5,2),

  -- Timestamps
  last_updated    TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (student_id, course_id, competency)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_memory_student ON student_memory_states (student_id);
CREATE INDEX IF NOT EXISTS idx_memory_next_review ON student_memory_states (student_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_memory_domain ON student_memory_states (memory_domain);
CREATE INDEX IF NOT EXISTS idx_competency_student ON student_competency_progress (student_id, competency);

COMMIT;
