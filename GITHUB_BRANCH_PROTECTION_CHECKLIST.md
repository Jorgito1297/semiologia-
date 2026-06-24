# GitHub Branch Protection Checklist - MED-228 Stability Sprint

## Objective
Enforce governance, retrieval reliability, academic compliance, and neuroadaptive stability at repository level.

## Protected Branches
- main (required)
- staging (recommended)
- release/* (recommended)

## Required GitHub Settings

### Pull Request Enforcement
- Enable: Require a pull request before merging.
- Enable: Require approvals.
- Set minimum approvals: 2.

### Code Ownership Enforcement
- Enable: Require review from Code Owners.
- Ensure CODEOWNERS includes retrieval, neuroadaptive, compliance, RLS, migrations, faculty workflow, and schemas.

### Review Freshness
- Enable: Dismiss stale pull request approvals when new commits are pushed.

### Status Check Enforcement
- Enable: Require status checks to pass before merging.
- Enable: Require branches to be up to date before merging.
- Add required checks:
  - lint
  - build
  - retrieval-validation
  - neuroadaptive-validation
  - rls-validation
  - rollback-validation
  - schema-validation
  - compliance-validation
  - architecture-review-validation
  - security-validation

### Merge Restrictions
- Disable direct pushes to main.
- Disable force pushes.
- Disable branch deletion.

### Security Controls
- Enable secret scanning.
- Enable push protection.
- Enable dependency review.
- Recommended: Dependabot alerts and security updates.

### Environment Protection
For production environment:
- Require manual approval.
- Require faculty approval for knowledge promotion.
- Require staging validation before production deployment.

## Stability Sprint Constraints
Forbidden during sprint:
- New feature merges.
- Schema redesigns.
- Production auto-migrations.
- Direct Moodle activation.

Allowed:
- QA and hardening.
- Validation and observability.
- Retrieval reliability fixes.
- Rollback safety.
- Compliance fixes.

## Exit Criteria
- retrieval_trust_score >= 0.90
- hallucination_rate <= 0.03
- grounding_accuracy >= 0.92
- rollback validation = PASS
- RLS penetration tests = PASS
- faculty approval workflow = PASS
- neuroadaptive validation = PASS

## Final Principle
Clinical reliability overrides development speed.
