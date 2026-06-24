# Architecture Review Board (ARB)

Status: Active during Stability Sprint

## Purpose
Ensure every critical change is assessed for clinical reliability, security, compliance, and rollback safety.

## Minimum Composition
- Engineering owner
- Faculty/compliance owner
- Security or data governance owner

## Mandatory ARB Questions
For any critical change, record yes/no for:
- affects_retrieval
- affects_neuroadaptive_logic
- affects_compliance
- rollback_safe
- faculty_impact
- rls_impact

## Trigger Conditions
ARB review is mandatory when a change touches:
- retrieval validation logic,
- neuroadaptive logic,
- RLS and data access policy,
- migration or rollback scripts,
- faculty workflow and approval path,
- governance or compliance gates.

## Output Artifact
Each ARB-reviewed PR must include:
- decision summary,
- risk level,
- rollback plan reference,
- required follow-up checks,
- approval signatures.

## Policy
Clinical reliability overrides development speed.
