-- ============================================
-- ROLLBACK: 008_student_roles
-- Clean reversal of roles, cohorts, and auto-provisioning triggers.
-- ============================================

BEGIN;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_auth_user();

ALTER TABLE public.students DROP COLUMN IF EXISTS role;
ALTER TABLE public.students DROP COLUMN IF EXISTS cohort;

DROP TYPE IF EXISTS user_role;

-- Restore original RLS policy on students if needed
DROP POLICY IF EXISTS students_access_policy ON public.students;

COMMIT;
