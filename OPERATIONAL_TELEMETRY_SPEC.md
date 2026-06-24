# Operational Telemetry Spec

Status: Active
Purpose: Detect reliability degradation early and provide incident-grade observability.

## Core Signals
- retrieval_latency_ms
- retrieval_hallucination_events
- retrieval_low_confidence_events
- faculty_override_events
- chunk_rejection_events
- failed_review_events
- replay_degradation_events
- cognitive_overload_events

## Required Dimensions
- course_code
- competency
- week
- block
- chunk_id
- query_id
- pipeline_run_id
- environment

## Alerts
- Hallucination spike above threshold.
- Retrieval trust score drop below gate.
- Faculty override spike above baseline.
- Replay degradation detected against last approved baseline.
- Cognitive overload anomaly increase.

## Dashboards (Minimum)
- Reliability Overview (trust, grounding, hallucination).
- Faculty Operations (overrides, approval latency, disagreements).
- Replay Regression (delta by deployment candidate).
- Neuroadaptive Safety (review cadence, overload, anomaly trends).

## Retention and Auditability
- Raw telemetry retention: at least 180 days.
- Aggregated reliability metrics: at least 365 days.
- Incident-linked telemetry must be preserved through incident closure and audit window.
