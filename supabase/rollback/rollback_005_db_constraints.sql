-- ============================================
-- ROLLBACK: 005_db_constraints
-- Removes SM-2 CHECK constraints and validation function.
-- Safe to run on a live database — no data loss.
-- ============================================

BEGIN;

ALTER TABLE student_memory_states DROP CONSTRAINT IF EXISTS chk_ease_factor;
ALTER TABLE student_memory_states DROP CONSTRAINT IF EXISTS chk_interval_days;
DROP FUNCTION IF EXISTS validate_sm2_state(NUMERIC, INTEGER);

COMMIT;
