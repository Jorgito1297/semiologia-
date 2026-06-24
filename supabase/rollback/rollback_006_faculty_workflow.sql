-- ============================================
-- ROLLBACK: 006_faculty_workflow
-- Clean reversal of all faculty workflow objects.
-- ============================================

BEGIN;

DROP TRIGGER  IF EXISTS trg_promote_chunk_on_approval ON chunk_review_queue;
DROP TRIGGER  IF EXISTS trg_crq_updated_at            ON chunk_review_queue;
DROP FUNCTION IF EXISTS promote_chunk_on_approval();
DROP FUNCTION IF EXISTS set_updated_at_crq();

DROP TABLE IF EXISTS chunk_review_queue CASCADE;

ALTER TABLE content_chunks DROP COLUMN IF EXISTS retrieval_priority;
ALTER TABLE content_chunks DROP COLUMN IF EXISTS faculty_notes;
ALTER TABLE content_chunks DROP COLUMN IF EXISTS approved_by;
ALTER TABLE content_chunks DROP COLUMN IF EXISTS approved_at;

DROP TYPE IF EXISTS retrieval_priority;
DROP TYPE IF EXISTS review_status;

COMMIT;
