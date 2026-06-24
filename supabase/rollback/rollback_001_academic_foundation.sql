-- ============================================
-- ROLLBACK: 001_academic_foundation
-- Drops all core academic tables and enums.
-- NOTE: The original migration incorrectly referenced `DROP SCHEMA IF EXISTS med228 CASCADE`.
--       There is no med228 schema — all objects live in `public`.
--       This rollback correctly targets individual objects.
-- ============================================

BEGIN;

DROP TABLE IF EXISTS academic_blocks  CASCADE;
DROP TABLE IF EXISTS competencies     CASCADE;
DROP TABLE IF EXISTS courses          CASCADE;

DROP TYPE IF EXISTS cg_competency    CASCADE;
DROP TYPE IF EXISTS block_type       CASCADE;
DROP TYPE IF EXISTS evaluation_type  CASCADE;
DROP TYPE IF EXISTS memory_domain    CASCADE;
DROP TYPE IF EXISTS content_type     CASCADE;

COMMIT;
