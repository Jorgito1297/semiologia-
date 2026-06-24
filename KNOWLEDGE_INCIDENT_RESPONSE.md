# Knowledge Incident Response

Status: Active
Scope: Retrieval, corpus, neuroadaptive, faculty validation, and compliance incidents.

## Incident Severity
- P0: Active patient-safety or critical clinical reliability risk in production.
- P1: High reliability/compliance risk with probable user impact.
- P2: Degradation detected, limited blast radius, no critical impact yet.
- P3: Minor anomaly or non-critical process drift.

## Trigger Examples
- Retrieval drift causing clinically incorrect chunk selection.
- Hallucination spike over threshold.
- Curriculum drift against approved UCE competency mapping.
- Faculty disagreement unresolved across critical topics.
- Neuroadaptive scheduling anomaly (over-review/under-review loops).

## Mandatory Response Flow
1. Declare incident with severity and incident_id.
2. Identify affected chunks, courses, cohorts, and endpoints.
3. Freeze promotions if severity is P0/P1.
4. Execute rollback procedure where applicable.
5. Run retrieval replay and neuroadaptive replay.
6. Run faculty review for impacted clinical topics.
7. Publish root cause analysis and corrective actions.
8. Re-open promotion only after gates are green.

## Required Artifacts
- Incident record: incident_id, owner, timeline, status.
- Affected chunks list and blast radius summary.
- Retrieval replay report for impacted queries.
- Faculty review decision log.
- Rollback evidence (if executed).
- RCA document with preventive controls.

## Production Freeze Policy
Apply production freeze when any of the following is true:
- P0 or P1 incident declared.
- Hallucination rate threshold violated persistently.
- Faculty verification uncertainty on high-impact topics.
- RLS or compliance validation fails.

## Exit Criteria
Incident closes only when:
- Corrective fix deployed and validated.
- Retrieval and neuroadaptive replay pass.
- Faculty sign-off recorded.
- Compliance checks pass.
- Preventive action tracked in governance backlog.
