-- ============================================
-- ROLLBACK: 007_onboarding_telemetry
-- Clean reversal of onboarding telemetry table and RLS policies.
-- ============================================

BEGIN;

DROP TABLE IF EXISTS public.onboarding_telemetry CASCADE;

COMMIT;
