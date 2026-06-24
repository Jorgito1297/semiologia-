# Stability Sprint Execution Matrix (Day 1-10)

Status: Active
Owner: Engineering + Faculty QA
Effective date: 2026-06-06

## Success KPIs
- retrieval_trust_score >= 0.90
- hallucination_rate <= 0.03
- grounding_accuracy >= 0.92
- faculty_override_rate <= 0.05
- chunk_redundancy <= 0.15
- cg_alignment_accuracy = 1.00

## Day-by-Day Plan

### Day 1 - Freeze Enforcement and Baselines
- Objective: Lock scope and establish baseline metrics.
- Tasks:
  - Announce and apply FEATURE FREEZE policy.
  - Capture baseline retrieval metrics on current corpus.
  - Snapshot DB schema and migration state.
- Evidence required:
  - Freeze acknowledgment in PR template usage.
  - baseline_metrics.json artifact.
  - schema_snapshot_day1.sql.
- Exit check:
  - No feature PRs accepted.

### Day 2 - Rollback Verification
- Objective: Validate recoverability before further hardening.
- Tasks:
  - Execute forward + rollback for active migrations in staging.
  - Validate data integrity after rollback replay.
- Evidence required:
  - rollback_report_day2.md.
  - checksum comparison before/after replay.
- Exit check:
  - 100% rollback scripts succeed.

### Day 3 - RLS Penetration Tests
- Objective: Prove tenant isolation under adversarial cases.
- Tasks:
  - Test stale JWT, malformed JWT, tenant escalation attempts.
  - Test direct access to disabled chunks and foreign student data.
- Evidence required:
  - rls_penetration_report_day3.md.
  - deny_event logs for all attack vectors.
- Exit check:
  - All mandatory attack cases blocked.

### Day 4 - Corpus Readiness Audit
- Objective: Detect quality debt in knowledge corpus.
- Tasks:
  - Validate provenance and citation completeness.
  - Detect duplicate, contradictory, and low-grounding chunks.
- Evidence required:
  - corpus_readiness_report_day4.md.
  - flagged_chunks.csv with disposition state.
- Exit check:
  - All critical corpus issues triaged.

### Day 5 - Retrieval QA Pass 1
- Objective: Evaluate multi-factor retrieval gates.
- Tasks:
  - Run retrieval validation against threshold contract.
  - Measure trust score and failure taxonomy.
- Evidence required:
  - retrieval_validation_run_day5.json.
  - trust_score_dashboard_export_day5.csv.
- Exit check:
  - No unresolved critical retrieval failures.

### Day 6 - Faculty Review Alignment
- Objective: Align model outputs with faculty expectations.
- Tasks:
  - Faculty review sample of failed and borderline chunks.
  - Apply approved corrections and update review queue.
- Evidence required:
  - faculty_review_log_day6.md.
  - override_summary_day6.csv.
- Exit check:
  - faculty_verified coverage improved on critical topics.

### Day 7 - Neuroadaptive Validation Suite
- Objective: Verify cognitive scheduling integrity.
- Tasks:
  - Validate SM-2 progression and interval consistency.
  - Check semantic vs procedural independence.
  - Validate fatigue scaling and adaptive difficulty trends.
- Evidence required:
  - neuroadaptive_suite_day7.md.
  - scheduling_anomaly_report_day7.csv.
- Exit check:
  - No critical neuroadaptive defects.

### Day 8 - Retrieval QA Pass 2 (Post-fix)
- Objective: Confirm fixes hold under replay.
- Tasks:
  - Re-run full retrieval QA on corrected corpus.
  - Compare deltas vs Day 5 baseline.
- Evidence required:
  - retrieval_validation_run_day8.json.
  - delta_report_day8.md.
- Exit check:
  - KPI trend positive and above minimum gates.

### Day 9 - Staging Reliability Replay
- Objective: Validate end-to-end promotion workflow.
- Tasks:
  - Run ingestion -> QA -> faculty -> retrieval -> staging pipeline.
  - Confirm disabled chunks are non-retrievable.
- Evidence required:
  - promotion_replay_day9.md.
  - staging_trace_ids_day9.txt.
- Exit check:
  - End-to-end replay successful without policy violations.

### Day 10 - Go/No-Go Review
- Objective: Decide readiness for post-freeze phase.
- Tasks:
  - Review KPI attainment and unresolved risks.
  - Approve or reject migration automation enablement.
- Evidence required:
  - go_no_go_decision_day10.md.
  - risk_register_day10.md.
- Exit check:
  - Governance board sign-off recorded.

## RACI (Minimum)
- Engineering Lead: owns execution and technical gates.
- Data/ML Owner: owns retrieval metrics and hallucination analysis.
- Faculty Reviewer: owns clinical correctness and approval decisions.
- Security Owner: owns RLS penetration and access control checks.

## Non-Negotiable Rule
No direct merge to main while Stability Sprint is active.
