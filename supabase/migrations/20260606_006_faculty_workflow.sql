-- ============================================
-- MIGRATION: 006_faculty_workflow
-- Description: Faculty chunk review queue + confidence-weighted retrieval columns
-- Requires: 002_content_chunks applied
-- Rollback: See supabase/rollback/rollback_006_faculty_workflow.sql
-- ============================================

BEGIN;

-- ============================================
-- TYPE: review_status
-- ============================================
CREATE TYPE review_status AS ENUM (
  'pending_review',   -- staged, awaiting faculty decision
  'approved',         -- faculty approved — triggers is_active = true
  'rejected',         -- faculty rejected — content removed from RAG
  'revision_needed'   -- returned with notes for correction
);

-- ============================================
-- TYPE: retrieval_priority
-- Confidence-Weighted Retrieval — set by faculty authority
-- HIGH = validated by coordinator / cátedra UCE
-- MEDIUM = validated by instructor
-- LOW = auto-staged, not yet faculty-reviewed
-- ============================================
CREATE TYPE retrieval_priority AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- ============================================
-- TABLE: chunk_review_queue
-- Faculty sees this. Every staged chunk gets a row.
-- Decouples validation workflow from content_chunks table.
-- ============================================
CREATE TABLE IF NOT EXISTS chunk_review_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id        UUID REFERENCES content_chunks(id) ON DELETE CASCADE,

  -- Review assignment
  assigned_to     TEXT,                          -- 'Dr. Rivas', 'coordinador', etc.
  review_status   review_status NOT NULL DEFAULT 'pending_review',

  -- Faculty decision
  reviewed_by     TEXT,
  reviewed_at     TIMESTAMPTZ,
  faculty_notes   TEXT,                          -- corrections, domain changes, etc.

  -- Pipeline tracking
  pipeline_run_id TEXT,                          -- links batch ingestion runs
  source_file     TEXT,                          -- original filename
  ingestion_mode  TEXT DEFAULT 'manual',         -- 'pdf_batch', 'syllabus', 'manual', 'pptx'

  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COLUMNS: Add to content_chunks
-- ============================================

-- Confidence-Weighted Retrieval priority
ALTER TABLE content_chunks
  ADD COLUMN IF NOT EXISTS retrieval_priority retrieval_priority DEFAULT 'LOW';

-- Faculty annotation (set after approval)
ALTER TABLE content_chunks
  ADD COLUMN IF NOT EXISTS faculty_notes TEXT;

-- Approved by (faculty member name)
ALTER TABLE content_chunks
  ADD COLUMN IF NOT EXISTS approved_by TEXT;

-- Approved at timestamp
ALTER TABLE content_chunks
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- ============================================
-- FUNCTION: auto-promote chunk when approved
-- When chunk_review_queue row is set to 'approved',
-- content_chunks.is_active → true + retrieval_priority upgrades.
-- ============================================
CREATE OR REPLACE FUNCTION promote_chunk_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.review_status = 'approved' AND OLD.review_status != 'approved' THEN
    UPDATE content_chunks
    SET
      is_active          = true,
      approved_by        = NEW.reviewed_by,
      approved_at        = NEW.reviewed_at,
      faculty_notes      = NEW.faculty_notes,
      retrieval_priority = CASE
        WHEN NEW.reviewed_by ILIKE '%coordinador%'
          OR NEW.reviewed_by ILIKE '%cátedra%'
          OR NEW.reviewed_by ILIKE '%UCE%'
          THEN 'HIGH'::"retrieval_priority"
        ELSE 'MEDIUM'::"retrieval_priority"
      END,
      updated_at = NOW()
    WHERE id = NEW.chunk_id;
  END IF;

  IF NEW.review_status = 'rejected' AND OLD.review_status != 'rejected' THEN
    UPDATE content_chunks
    SET is_active = false, updated_at = NOW()
    WHERE id = NEW.chunk_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_promote_chunk_on_approval
  AFTER UPDATE ON chunk_review_queue
  FOR EACH ROW
  EXECUTE FUNCTION promote_chunk_on_approval();

-- ============================================
-- UPDATED_AT trigger for chunk_review_queue
-- ============================================
CREATE OR REPLACE FUNCTION set_updated_at_crq()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_crq_updated_at
  BEFORE UPDATE ON chunk_review_queue
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_crq();

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_review_queue_status  ON chunk_review_queue (review_status);
CREATE INDEX IF NOT EXISTS idx_review_queue_assigned ON chunk_review_queue (assigned_to);
CREATE INDEX IF NOT EXISTS idx_review_queue_chunk    ON chunk_review_queue (chunk_id);
CREATE INDEX IF NOT EXISTS idx_chunks_priority       ON content_chunks (retrieval_priority, is_active);

-- ============================================
-- RLS for chunk_review_queue
-- ============================================
ALTER TABLE chunk_review_queue ENABLE ROW LEVEL SECURITY;

-- Faculty can see queue rows assigned to them or pending
CREATE POLICY review_queue_faculty_access ON chunk_review_queue
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('instructor', 'faculty', 'coordinator', 'admin')
  );

COMMIT;
