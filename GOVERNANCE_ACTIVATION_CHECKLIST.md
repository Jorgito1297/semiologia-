# Governance Activation Checklist

Status: Required before enabling production promotion during Stability Sprint.

## Objective
Ensure governance is fully operational with real evidence, real owners, and active observability.

## A. Human Ownership
- [ ] CODEOWNERS uses real GitHub handles or real teams.
- [ ] Engineering owner assigned.
- [ ] Faculty/compliance owner assigned.
- [ ] Security/data governance owner assigned.

## B. Evidence Readiness
- [ ] artifacts/retrieval/latest.json replaced with real run output.
- [ ] artifacts/neuroadaptive/latest.json replaced with real run output.
- [ ] artifacts/compliance/rls_penetration.json replaced with real penetration results.
- [ ] artifacts/rollback/latest.json replaced with real rollback replay output.
- [ ] artifacts/compliance/latest.json replaced with real compliance sign-off.

## C. Replay Datasets and Pipelines
- [ ] Retrieval replay dataset active and versioned.
- [ ] Neuroadaptive replay scenarios active and versioned.
- [ ] Replay run IDs captured per validation cycle.

## D. Telemetry and Alerts
- [ ] Operational telemetry enabled for retrieval events.
- [ ] Hallucination and low-confidence alerts configured.
- [ ] Faculty override telemetry configured.
- [ ] Replay degradation alerts configured.
- [ ] Cognitive overload telemetry configured.

## E. Incident Response Operability
- [ ] Incident workflow tested with tabletop scenario.
- [ ] P0-P3 triage exercised and documented.
- [ ] RCA template validated.
- [ ] Promotion freeze/unfreeze path tested.

## F. Mandatory Gate Verification
Run and record outputs for:
- npm run retrieval-validation
- npm run neuroadaptive-validation
- npm run rls-validation
- npm run rollback-validation
- npm run compliance-validation
- npm run architecture-review-validation

## Activation Decision
- [ ] Governance activated for operational evidence mode.
- [ ] Approved by Engineering + Faculty/Compliance + Security owner.
- [ ] Decision timestamp recorded.
