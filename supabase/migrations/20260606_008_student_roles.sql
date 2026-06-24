-- ============================================
-- MIGRATION: 008_student_roles
-- Description: Roles, Cohorts, and Auto-Provisioning triggers
-- Rollback:
--   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--   DROP FUNCTION IF EXISTS public.handle_new_auth_user();
--   ALTER TABLE public.students DROP COLUMN IF EXISTS role;
--   ALTER TABLE public.students DROP COLUMN IF EXISTS cohort;
--   DROP TYPE IF EXISTS user_role;
-- ============================================

BEGIN;

-- Crear el tipo ENUM para roles si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('student', 'faculty', 'validator', 'admin');
  END IF;
END
$$;

-- Añadir columnas a students si no existen
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'student';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS cohort TEXT DEFAULT '2026-A';

-- Actualizar las políticas de RLS de la tabla students
DROP POLICY IF EXISTS students_self_access ON public.students;

-- Los estudiantes solo ven su perfil, pero docentes y validadores pueden ver todos
CREATE POLICY students_access_policy ON public.students
  FOR ALL USING (
    auth.uid() = auth_id 
    OR 
    (SELECT role FROM public.students WHERE auth_id = auth.uid()) IN ('faculty', 'validator', 'admin')
  );

-- Función de trigger para aprovisionamiento automático al autenticarse vía Microsoft/Entra ID
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Restringir registro a dominios oficiales de la UCE (excepto cuentas de desarrollo específicas)
  IF NEW.email NOT LIKE '%@uce.edu.do' AND NEW.email NOT IN ('angel.tusen@uce.edu.do', 'dr.tusen@gmail.com', 'estudiante.sim@uce.edu.do') THEN
    RAISE EXCEPTION 'Acceso Restringido: Solo se permiten correos institucionales de la UCE (@uce.edu.do)';
  END IF;

  INSERT INTO public.students (auth_id, full_name, email, role, completed_med224, last_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_metadata->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    CASE 
      WHEN NEW.email IN ('angel.tusen@uce.edu.do', 'dr.tusen@gmail.com') THEN 'validator'::user_role
      ELSE 'student'::user_role
    END,
    false, -- se marcará como completado al culminar el onboarding
    NOW()
  )
  ON CONFLICT (auth_id) DO UPDATE SET
    last_active = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enlazar trigger a la tabla auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

COMMIT;
