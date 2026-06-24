# Retrieval Replay System

## Objective
Prevent retrieval regressions by replaying historical query sets prior to deployment.

## Replay Inputs
- Historical real queries.
- Expected competency alignment.
- Prior approved retrieval outputs.
- Known hallucination and override cases.

## Replay Outputs
- Delta against prior retrieval quality.
- Threshold pass/fail summary.
- Regression list by query_id and chunk_id.

## Required Gates
Deployment fails if replay detects:
- retrieval_trust_score below gate,
- grounding degradation below gate,
- hallucination increase above gate,
- competency alignment mismatch.

## Minimal Replay Report Fields
- replay_run_id
- query_count
- trust_score_delta
- grounding_delta
- hallucination_delta
- failed_queries
- go_no_go

## Cadence
- Mandatory on every PR targeting main.
- Full replay on release candidates.
