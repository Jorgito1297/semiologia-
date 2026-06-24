# Evidence Generation Sprint

Status: Active recommendation
Goal: Convert governance scaffolding into validated, repeatable operational evidence.

## Scope
In scope:
- Real retrieval evidence generation.
- Real neuroadaptive replay evidence generation.
- Real RLS penetration evidence generation.
- Real rollback replay evidence generation.
- Real compliance sign-off evidence generation.

Out of scope:
- New product features.
- Schema redesigns.
- Production auto-migrations.

## Workstreams

### 1) Retrieval Evidence
Inputs:
- Real corpus
- Real query set
- Faculty-approved expected outcomes

Outputs:
- artifacts/retrieval/latest.json with real metrics
- replay run report and deltas

Acceptance:
- thresholds pass in retrieval-validation gate

### 2) Neuroadaptive Evidence
Inputs:
- 30-day smoke replay
- 90-day progression replay
- Semantic/procedural domain trajectories

Outputs:
- artifacts/neuroadaptive/latest.json with real simulation summary
- anomaly report

Acceptance:
- thresholds pass in neuroadaptive-validation gate

### 3) RLS Evidence
Inputs:
- Valid JWT, stale JWT, malformed JWT
- Tenant escalation attempts
- Direct disabled chunk access attempts

Outputs:
- artifacts/compliance/rls_penetration.json
- penetration report

Acceptance:
- all required deny controls true

### 4) Rollback Evidence
Sequence:
- forward migration
- rollback
- reapply
- integrity verification

Outputs:
- artifacts/rollback/latest.json
- replay integrity report

Acceptance:
- rollback, RLS, and constraint validations true

### 5) Compliance Evidence
Inputs:
- Faculty/compliance review results
- Freeze violation check

Outputs:
- artifacts/compliance/latest.json
- compliance decision record

Acceptance:
- compliance gate passes without placeholder

## Execution Cadence (Suggested)
- Day 1: Ownership + datasets + telemetry readiness
- Day 2-3: Retrieval and neuroadaptive runs
- Day 4: RLS penetration and rollback replay
- Day 5: Compliance sign-off and gate closure

## Completion Criteria
- All evidence placeholders replaced by real outputs.
- All governance gates pass with real evidence.
- CODEOWNERS mapped to real humans/teams.
- Activation checklist approved.
