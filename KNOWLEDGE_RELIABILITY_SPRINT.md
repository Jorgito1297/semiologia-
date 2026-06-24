# Knowledge Reliability Sprint

## Why This Sprint Exists
The system can compile and pass lint while still producing clinically unsafe reinforcement.
This sprint validates correctness of knowledge, retrieval, and neuroadaptive behavior.

## Retrieval Validation Model
Use Multi-Factor Retrieval Validation instead of cosine-only checks.

### Baseline Thresholds
- cosine_similarity >= 0.82
- citation_grounding >= 0.90
- competency_alignment = exact
- hallucination_rate <= 0.03
- semantic_redundancy <= 0.15

## Faculty Verification Layer
A retrieval candidate is eligible only if faculty verification gates pass.

Required fields:
- semantic_score
- clinical_accuracy
- faculty_verified
- cg_alignment
- retrieval_approved

Reference payload:

```json
{
  "semantic_score": 0.86,
  "clinical_accuracy": true,
  "faculty_verified": true,
  "cg_alignment": ["CG2"],
  "retrieval_approved": true
}
```

## Corpus Readiness Gates
- Source provenance complete for each chunk.
- Citation spans traceable to approved material.
- Disabled chunk retrieval blocked.
- Faculty-approved chunks prioritized by retrieval_priority.
- Duplicate and contradictory chunks flagged.

## RLS Penetration Suite (Mandatory)
- stale JWT -> reject
- malformed JWT -> reject
- tenant escalation -> blocked
- direct chunk access without entitlement -> blocked
- disabled chunk retrieval -> blocked

## Neuroadaptive Validation Suite
- SM-2 progression correctness across quality 0..5.
- memory_decay_score monotonic behavior under repeated failures.
- semantic and procedural states remain independent.
- fatigue scaling does not inflate mastery.
- adaptive difficulty evolves progressively.
- next_review_at and interval_days remain consistent.

## Observability (Current Gap)
Minimum required dashboards/logs:
- Retrieval gate pass/fail breakdown by factor.
- Hallucination and grounding trend by course and week.
- Faculty override events and approval latency.
- RLS deny events by policy and endpoint.
- Neuroadaptive scheduling anomalies.

## Deliverables
- Retrieval QA report with threshold compliance.
- Corpus readiness report signed by faculty reviewer.
- Neuroadaptive suite results and failure triage log.
- Stability go/no-go decision for migration automation.
