-- ============================================
-- ROLLBACK: ALL MIGRATIONS (full teardown)
-- Execute in REVERSE migration order.
-- Validates clean rollback with no orphaned objects.
-- ============================================
-- Usage:
--   psql $DATABASE_URL -f rollback_all.sql
--
-- WARNING: This is a DESTRUCTIVE operation.
--          Run only in non-production environments
--          unless you have a verified backup.
-- ============================================

\echo '--- Rollback 008: Student Roles ---'
\ir rollback_008_student_roles.sql

\echo '--- Rollback 007: Onboarding Telemetry ---'
\ir rollback_007_onboarding_telemetry.sql

\echo '--- Rollback 006: Faculty Workflow ---'
\ir rollback_006_faculty_workflow.sql

\echo '--- Rollback 005: DB Constraints ---'
\ir rollback_005_db_constraints.sql

\echo '--- Rollback 004: RLS Policies ---'
\ir rollback_004_rls_policies.sql

\echo '--- Rollback 003: Students + NeuroAdaptive ---'
\ir rollback_003_students_neuro.sql

\echo '--- Rollback 002: Content Chunks ---'
\ir rollback_002_content_chunks.sql

\echo '--- Rollback 001: Academic Foundation ---'
\ir rollback_001_academic_foundation.sql

\echo '=== Full rollback complete. Verify with: SELECT tablename FROM pg_tables WHERE schemaname=''public''; ==='
