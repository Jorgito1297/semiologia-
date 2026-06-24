# Neuroadaptive Replay Validation

## Objective
Simulate student progression windows to detect scheduling and cognitive stability issues before production.

## Replay Horizon
- Default: 90-day progression simulation.
- Optional: 30-day smoke replay for fast validation.

## Scenarios
- High-performance student trajectory.
- Average progression trajectory.
- Struggling student with repeated failures.
- Fatigue and interruption scenarios.

## Required Validations
- SM-2 progression remains within configured constraints.
- interval_days and next_review_at stay consistent.
- ease_factor remains within 1.3 to 5.0.
- procedural and semantic domains remain isolated.
- no overload patterns from over-review loops.

## Failure Conditions
- Drift in scheduling consistency.
- Cognitive overload signal increase.
- Domain contamination between memory types.
- Regression against previous approved replay baseline.

## Required Report Fields
- replay_run_id
- simulation_days
- students_simulated
- anomalies_found
- overload_events
- domain_isolation_passed
- go_no_go
