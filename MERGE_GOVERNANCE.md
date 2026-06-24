# Merge Governance

Status: Mandatory during Stability Sprint

## Policy
- No direct merge to main.
- All changes must be delivered through pull requests.
- Minimum approvals: 2 reviewers.
- At least 1 reviewer must be faculty/compliance owner for retrieval, corpus, or neuroadaptive changes.

## Required Gates Before Merge
- QA validation passed.
- retrieval validation passed.
- rollback validation passed.
- schema validation passed.
- faculty compliance validation passed.

## Mandatory PR Evidence
- Link to test and validation artifacts.
- Risk assessment section completed.
- Rollback plan section completed.
- Scope statement confirming no freeze violations.

## Blocking Conditions
- Any KPI below minimum gate.
- Any unresolved critical security issue.
- Any unresolved clinical correctness defect.
- Missing faculty sign-off where required.

## Enforcement Notes
Repository settings must enable branch protection for main:
- Require pull request before merge.
- Require status checks to pass.
- Require conversation resolution before merge.
- Restrict who can push to main.

This repository-level document defines policy intent and review expectations.
Branch protection must be configured in GitHub settings to enforce it technically.
