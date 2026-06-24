# Knowledge Promotion Pipeline

## Pipeline Stages
INGESTION -> QA VALIDATION -> FACULTY REVIEW -> RETRIEVAL VALIDATION -> STAGING -> PRODUCTION

## Stage Gates

### 1) Ingestion
- Source provenance complete.
- Chunk schema valid.
- Disabled by default until approved.

### 2) QA Validation
- Structural checks pass.
- Citation integrity pass.
- Duplicate/contradiction checks triaged.

### 3) Faculty Review
- clinical_accuracy = true
- faculty_verified = true
- competency mapping approved.

### 4) Retrieval Validation
- Multi-factor thresholds satisfied.
- retrieval_approved = true
- trust score >= 0.90

### 5) Staging
- End-to-end replay succeeds.
- RLS checks pass.
- No critical observability alerts open.

### 6) Production
- Change advisory approved.
- Rollback evidence attached.
- Promotion manifest signed.

## Promotion Manifest (Required)
- chunk_id list
- reviewer identities
- threshold snapshot
- staging replay trace IDs
- rollback reference

## Blocking Conditions
- Any unresolved critical clinical defect.
- Any unresolved critical security issue.
- Any failed rollback validation.

## Output
Only approved chunks become active and retrievable in production.
