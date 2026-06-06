-- ============================================
-- MIGRATION: 002_content_chunks
-- Description: RAG chunks with full Academic Compliance metadata
-- Requires: pgvector extension enabled
-- Rollback: DROP TABLE IF EXISTS content_chunks CASCADE;
-- ============================================

BEGIN;

-- Enable vector extension (run once per database)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- TABLE: content_chunks
-- THE CORE OF THE RAG SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS content_chunks (
  -- Identity
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID REFERENCES courses(id) ON DELETE CASCADE,

  -- Academic Compliance Layer (MANDATORY — never null)
  week            INTEGER NOT NULL CHECK (week BETWEEN 1 AND 16),
  block           block_type NOT NULL,
  topic           TEXT NOT NULL,
  subtopic        TEXT,
  content_type    content_type NOT NULL,         -- theoretical | procedural
  memory_domain   memory_domain NOT NULL,        -- semantic | procedural | executive | perceptual
  cg_competencies cg_competency[] NOT NULL,      -- array: ['CG2', 'CG6']
  evaluation_type evaluation_type[],             -- which exams this prepares for

  -- Content
  chunk_text      TEXT NOT NULL,
  source_book     TEXT NOT NULL,                 -- 'Argente-Álvarez 2013'
  source_chapter  TEXT,
  source_pages    TEXT,

  -- Medical Validation (MANDATORY — content cannot be active without this)
  validated_by    TEXT NOT NULL,                 -- 'Dr. [Nombre]'
  validated_date  DATE NOT NULL,
  validation_notes TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT false, -- only active after validation

  -- Vector Embedding
  embedding       vector(1536),                  -- OpenAI/Gemini embedding dimension

  -- Metadata
  chunk_index     INTEGER,                       -- position within source document
  token_count     INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Vector similarity search
CREATE INDEX IF NOT EXISTS idx_content_chunks_embedding ON content_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Academic filtering (used constantly by RAG queries)
CREATE INDEX IF NOT EXISTS idx_chunks_course_block ON content_chunks (course_id, block);
CREATE INDEX IF NOT EXISTS idx_chunks_week ON content_chunks (week);
CREATE INDEX IF NOT EXISTS idx_chunks_content_type ON content_chunks (content_type);
CREATE INDEX IF NOT EXISTS idx_chunks_memory_domain ON content_chunks (memory_domain);
CREATE INDEX IF NOT EXISTS idx_chunks_active ON content_chunks (is_active);

-- CG competency search (GIN for array)
CREATE INDEX IF NOT EXISTS idx_chunks_cg ON content_chunks USING GIN (cg_competencies);
CREATE INDEX IF NOT EXISTS idx_chunks_eval_type ON content_chunks USING GIN (evaluation_type);

COMMIT;
