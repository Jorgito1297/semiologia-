# Retrieval Observability Spec

## Objective
Provide machine-verifiable visibility into retrieval reliability and drift risk.

## Event Types
- retrieval_hit
- retrieval_failed
- retrieval_low_confidence
- retrieval_hallucination_flag
- retrieval_faculty_override

## Required Event Fields
- event_id
- timestamp_utc
- course_code
- query_id
- chunk_id
- retrieval_trust_score
- cosine_similarity
- citation_grounding
- competency_alignment
- hallucination_rate
- faculty_verified
- retrieval_approved
- reason_code

## Dashboards (Minimum)
- Chunk hit frequency by topic/week.
- Failed retrievals by reason_code.
- Hallucination events trend by course.
- Low confidence retrieval ratio.
- Faculty override rate and latency.

## Alert Thresholds
- hallucination_rate_rolling_24h > 0.03
- retrieval_trust_score_p50 < 0.90
- low_confidence_ratio > 0.10
- faculty_override_rate > 0.05

## Daily Operational Checks
- Confirm event ingestion volume is non-zero for active courses.
- Confirm no missing required fields in events.
- Confirm all alerts reviewed and triaged.

## Data Retention
- Raw events: 180 days.
- Aggregated metrics: 365 days.
- Compliance logs: follow institutional policy.
