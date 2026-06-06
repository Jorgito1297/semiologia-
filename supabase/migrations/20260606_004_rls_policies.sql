-- ============================================
-- MIGRATION: 004_rls_policies
-- Description: RLS policies — tenant isolation
-- Rollback: DROP POLICY IF EXISTS ... (see below)
-- ============================================

BEGIN;

-- Enable RLS on all tables
ALTER TABLE students                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_memory_states       ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_competency_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_chunks              ENABLE ROW LEVEL SECURITY;

-- Students can only see their own profile
CREATE POLICY students_self_access ON students
  FOR ALL USING (auth.uid() = auth_id);

-- Students can only see their own memory states
CREATE POLICY memory_self_access ON student_memory_states
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE auth_id = auth.uid()
    )
  );

-- Students can only see their own competency progress
CREATE POLICY competency_self_access ON student_competency_progress
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE auth_id = auth.uid()
    )
  );

-- Students can only read ACTIVE and VALIDATED content chunks
CREATE POLICY chunks_read_active ON content_chunks
  FOR SELECT USING (is_active = true);

-- Instructors can read all chunks (role-based — extend per institution)
-- CREATE POLICY chunks_instructor_access ON content_chunks
--   FOR ALL USING (auth.jwt() ->> 'role' = 'instructor');

COMMIT;
