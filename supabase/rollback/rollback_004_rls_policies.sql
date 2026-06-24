-- ============================================
-- ROLLBACK: 004_rls_policies
-- Removes all RLS policies created by 004 migration.
-- ============================================

BEGIN;

DROP POLICY IF EXISTS students_self_access              ON students;
DROP POLICY IF EXISTS memory_self_access                ON student_memory_states;
DROP POLICY IF EXISTS competency_self_access            ON student_competency_progress;
DROP POLICY IF EXISTS chunks_read_active                ON content_chunks;

-- Disable RLS (tables revert to superuser-only access pattern)
ALTER TABLE students                    DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_memory_states       DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_competency_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_chunks              DISABLE ROW LEVEL SECURITY;

COMMIT;
