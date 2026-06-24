# Stability Sprint Policy

## Status
FEATURE FREEZE - Stability Sprint Active

Effective date: 2026-06-06

## Objective
Stabilize governance, data integrity, and retrieval reliability before enabling Phase 3 scope.

## Freeze Rules
- No new product features in web, ingestion, or Moodle integration.
- Allowed changes: bug fixes, security hardening, RLS tests, rollback validation, retrieval QA, observability.
- Any scope exception requires explicit maintainer approval in PR description.

## Migration Policy (Current Phase)
- SQL deployment mode: Manual SQL Editor Deployment only.
- Every migration must include:
  - rollback script reviewed and executed in staging,
  - RLS validation checks,
  - staging replay on representative data,
  - schema snapshot before and after migration.
- Automatic migration pipelines remain disabled until stabilization exit criteria are met.

## Exit Criteria
- Rollback verification: 100% pass for active migrations.
- RLS penetration suite: all mandatory attack cases blocked.
- Retrieval QA baseline: all threshold gates met.
- Corpus readiness report approved by faculty.
- Neuroadaptive validation suite green.

## Explicitly Out of Scope
- New Moodle data sync features.
- New UI modules unrelated to reliability.
- New adaptive logic not covered by tests.
