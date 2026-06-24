-- ============================================
-- MIGRATION: 001_academic_foundation
-- Description: Core academic structure for MED-228 UCE
-- Author: Database Agent
-- Validated by: [Nombre del Docente]
-- Rollback:
--   DROP TABLE IF EXISTS public.academic_blocks CASCADE;
--   DROP TABLE IF EXISTS public.competencies CASCADE;
--   DROP TABLE IF EXISTS public.courses CASCADE;
--   DROP TYPE IF EXISTS public.content_type CASCADE;
--   DROP TYPE IF EXISTS public.memory_domain CASCADE;
--   DROP TYPE IF EXISTS public.evaluation_type CASCADE;
--   DROP TYPE IF EXISTS public.block_type CASCADE;
--   DROP TYPE IF EXISTS public.cg_competency CASCADE;
--           (NOTE: no med228 schema exists — all objects are in public)
-- ============================================

BEGIN;

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE content_type AS ENUM (
  'theoretical',    -- 2h/week — conceptual content
  'procedural'      -- 3h/week — physical examination technique
);

CREATE TYPE memory_domain AS ENUM (
  'semantic',       -- theoretical knowledge, definitions, classifications
  'procedural',     -- physical exam motor sequences
  'executive',      -- clinical reasoning, syndrome construction
  'perceptual'      -- pattern recognition (sounds, visual signs, palpation)
);

CREATE TYPE evaluation_type AS ENUM (
  'quiz',           -- theoretical multiple choice
  'osce',           -- objective structured clinical examination
  'simulation',     -- virtual patient interaction
  'practical_exam'  -- hands-on physical examination
);

CREATE TYPE block_type AS ENUM (
  'block_1',   -- Weeks 1–6  → 30%
  'block_2',   -- Weeks 7–11 → 30%
  'block_3',   -- Weeks 12–14 → content
  'final'      -- Weeks 15–16 → 40%
);

CREATE TYPE cg_competency AS ENUM (
  'CG1',   -- Ethical practice and legal responsibilities
  'CG2',   -- Effective communication with patients and colleagues
  'CG6',   -- Integral clinical history
  'CG7',   -- Health promotion and prevention
  'CG8',   -- Diagnostic and treatment procedures
  'CG11'   -- ICT application in clinical activities
);

-- ============================================
-- TABLE: courses
-- ============================================

CREATE TABLE IF NOT EXISTS courses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,          -- 'MED-228'
  name            TEXT NOT NULL,
  credits         INTEGER NOT NULL,              -- 3
  weekly_hours_theory    INTEGER NOT NULL,       -- 2
  weekly_hours_practical INTEGER NOT NULL,       -- 3
  pensum          TEXT NOT NULL,                 -- 'Pensum 36'
  prerequisite_code TEXT,                        -- 'MED-224'
  period          TEXT NOT NULL,                 -- 'MAY-AGO 2026'
  institution     TEXT NOT NULL DEFAULT 'UCE',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Seed MED-228
INSERT INTO courses (
  code, name, credits,
  weekly_hours_theory, weekly_hours_practical,
  pensum, prerequisite_code, period
) VALUES (
  'MED-228',
  'Propedéutica Clínica y Semiología Médica',
  3, 2, 3,
  'Pensum 36', 'MED-224', 'MAY-AGO 2026'
) ON CONFLICT (code) DO NOTHING;

-- ============================================
-- TABLE: competencies
-- ============================================

CREATE TABLE IF NOT EXISTS competencies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID REFERENCES courses(id) ON DELETE CASCADE,
  code        cg_competency NOT NULL,
  description TEXT NOT NULL,
  weight      NUMERIC(5,2),                      -- future: institutional weight
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed CG competencies for MED-228
INSERT INTO competencies (course_id, code, description) VALUES
  ((SELECT id FROM courses WHERE code = 'MED-228'), 'CG1',
   'Ethical practice and legal responsibilities in medical profession'),
  ((SELECT id FROM courses WHERE code = 'MED-228'), 'CG2',
   'Effective oral and written communication with patients and health professionals'),
  ((SELECT id FROM courses WHERE code = 'MED-228'), 'CG6',
   'Integral clinical history with diagnostic, prognostic and treatment information'),
  ((SELECT id FROM courses WHERE code = 'MED-228'), 'CG7',
   'Health promotion, prevention, cure and rehabilitation across the lifespan'),
  ((SELECT id FROM courses WHERE code = 'MED-228'), 'CG8',
   'Diagnostic and treatment procedures for major national and regional pathologies'),
  ((SELECT id FROM courses WHERE code = 'MED-228'), 'CG11',
   'Application of ICT in clinical, therapeutic, preventive and research activities');

-- ============================================
-- TABLE: academic_blocks
-- ============================================

CREATE TABLE IF NOT EXISTS academic_blocks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     UUID REFERENCES courses(id) ON DELETE CASCADE,
  block         block_type NOT NULL,
  week_start    INTEGER NOT NULL,
  week_end      INTEGER NOT NULL,
  weight_pct    NUMERIC(5,2) NOT NULL,           -- 30.00 / 30.00 / 40.00
  description   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Seed blocks for MED-228
INSERT INTO academic_blocks (course_id, block, week_start, week_end, weight_pct, description) VALUES
  ((SELECT id FROM courses WHERE code = 'MED-228'),
   'block_1', 1, 6, 30.00,
   'Introduction to Semiology, Clinical History, Head and Neck examination'),
  ((SELECT id FROM courses WHERE code = 'MED-228'),
   'block_2', 7, 11, 30.00,
   'Thorax, Cardiovascular, Blood Pressure, Pulses, Breasts'),
  ((SELECT id FROM courses WHERE code = 'MED-228'),
   'block_3', 12, 14, 0.00,
   'Abdomen, Genitourinary, Extremities, Clinical Syndrome Integration'),
  ((SELECT id FROM courses WHERE code = 'MED-228'),
   'final', 15, 16, 40.00,
   'Comprehensive final evaluation — all blocks');

COMMIT;
