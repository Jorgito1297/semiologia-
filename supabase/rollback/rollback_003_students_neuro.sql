-- ============================================
-- ROLLBACK: 003_students_neuro
-- Drops student-related tables in dependency order.
-- ============================================

BEGIN;

DROP TABLE IF EXISTS student_competency_progress CASCADE;
DROP TABLE IF EXISTS student_memory_states        CASCADE;
DROP TABLE IF EXISTS students                     CASCADE;

COMMIT;
