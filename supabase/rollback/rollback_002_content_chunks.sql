-- ============================================
-- ROLLBACK: 002_content_chunks
-- Drops content_chunks table and indexes.
-- ============================================

BEGIN;

DROP TABLE IF EXISTS content_chunks CASCADE;

-- Vector extension is shared; only drop if no other tables use it.
-- DROP EXTENSION IF EXISTS vector;  -- DISABLED: may be shared

COMMIT;
