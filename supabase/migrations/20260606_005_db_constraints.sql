-- ============================================================
-- MIGRATION: 005_add_check_constraints
-- Patch: B-04
-- Problema: student_memory_states aceptaba ease_factor y
--           interval_days fuera de los rangos válidos del SM-2
-- Rollback: ver sección al final
-- ============================================================

BEGIN;

ALTER TABLE public.student_memory_states
  ADD CONSTRAINT check_ease_factor
    CHECK (ease_factor BETWEEN 1.3 AND 5.0),
  ADD CONSTRAINT check_interval_days
    CHECK (interval_days BETWEEN 1 AND 30),
  ADD CONSTRAINT check_accuracy_pct
    CHECK (accuracy_pct BETWEEN 0 AND 100),
  ADD CONSTRAINT check_confidence_pct
    CHECK (confidence_pct BETWEEN 0 AND 100),
  ADD CONSTRAINT check_memory_decay_score
    CHECK (memory_decay_score BETWEEN 0.0 AND 1.0),
  ADD CONSTRAINT check_difficulty_level
    CHECK (difficulty_level BETWEEN 1 AND 5);

-- Verificar que los datos existentes no violan las nuevas constraints
-- (si hay datos fuera de rango, el ALTER TABLE fallará antes del COMMIT)

COMMIT;

-- ============================================================
-- ROLLBACK de esta migración (B-04)
-- ============================================================
-- BEGIN;
-- ALTER TABLE public.student_memory_states
--   DROP CONSTRAINT IF EXISTS check_ease_factor,
--   DROP CONSTRAINT IF EXISTS check_interval_days,
--   DROP CONSTRAINT IF EXISTS check_accuracy_pct,
--   DROP CONSTRAINT IF EXISTS check_confidence_pct,
--   DROP CONSTRAINT IF EXISTS check_memory_decay_score,
--   DROP CONSTRAINT IF EXISTS check_difficulty_level;
-- COMMIT;
-- ============================================================

-- POST-MIGRATION VERIFICATION
-- SELECT conname, consrc FROM pg_constraint
-- WHERE conrelid = 'public.student_memory_states'::regclass
-- AND contype = 'c';
-- Esperado: 6 constraints listadas
-- ============================================================
