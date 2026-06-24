# Knowledge Operations Framework

Status: Active during Stability Sprint

## Purpose
Operate clinical knowledge as a controlled lifecycle, not as static content.

## Lifecycle
NEW CHUNK -> AUTOMATED QA -> FACULTY REVIEW -> RETRIEVAL TESTING -> STAGING -> LIMITED RELEASE -> FULL PRODUCTION

## Stage Controls

### New Chunk
- Provenance metadata required.
- Initial state must be non-active.

### Automated QA
- Schema and citation checks pass.
- Redundancy and contradiction checks complete.

### Faculty Review
- Clinical correctness approved.
- Competency mapping approved.
- Faculty notes recorded when applicable.

### Retrieval Testing
- Multi-factor retrieval validation passes.
- No threshold violations in trust metrics.

### Staging
- End-to-end replay succeeds.
- No critical RLS or compliance alerts.

### Limited Release
- Small scope rollout with observability focus.
- Monitor overrides, low-confidence retrievals, and hallucination alerts.

### Full Production
- Promotion manifest signed.
- Rollback evidence attached.
- Approval gates completed.

## Operational Metrics
- retrieval_trust_score
- hallucination_rate
- grounding_accuracy
- faculty_override_rate
- chunk_redundancy
- cg_alignment_accuracy

## Drift Controls
- Retrieval drift: replay historical query sets before deploy.
- Curriculum drift: detect competency/topic divergence from approved syllabus.
- Confidence decay: monitor trust score degradation over time.
- Neuroadaptive anomalies: detect over-review, under-review, and overload trends.

## Non-Negotiable Policy
No knowledge artifact reaches production without technical validity, academic alignment, faculty verification, retrieval validation, and rollback safety.
