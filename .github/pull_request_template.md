## Stability Sprint PR Gate

### Scope Declaration
- [ ] This PR does not introduce new features outside Stability Sprint scope.
- [ ] This PR aligns with FEATURE FREEZE policy.

### Required Validations
- [ ] QA validation passed.
- [ ] Retrieval validation passed.
- [ ] Rollback validation passed.
- [ ] Schema validation passed.
- [ ] Faculty compliance validation passed.
- [ ] Retrieval replay validation passed.
- [ ] Neuroadaptive replay validation passed.

### Clinical Reliability Evidence
- Retrieval trust score:
- Hallucination rate:
- Grounding accuracy:
- Faculty override rate:
- CG alignment accuracy:

### Risk and Rollback
- Risk level (low/medium/high):
- User impact summary:
- Rollback plan:
- Rollback verification evidence:

### Artifacts
- Links to reports, logs, or dashboards used for approval:

### Architecture Review Board (ARB)
- [ ] ARB review completed (required for critical changes).
- affects_retrieval: yes/no
- affects_neuroadaptive_logic: yes/no
- affects_compliance: yes/no
- rollback_safe: yes/no
- faculty_impact: yes/no
- rls_impact: yes/no

### KnowledgeOps Promotion Stage
- [ ] New chunk
- [ ] Automated QA
- [ ] Faculty review
- [ ] Retrieval testing
- [ ] Staging
- [ ] Limited release
- [ ] Full production

### Knowledge Incident Management
- incident_required: yes/no
- incident_id (if yes):
- severity (P0/P1/P2/P3):
- affected_chunks_attached: yes/no
- retrieval_replay_attached: yes/no
- faculty_review_attached: yes/no
- rollback_executed_if_needed: yes/no
- rca_attached_if_incident: yes/no

### Reviewer Routing
- [ ] Engineering reviewer assigned.
- [ ] Faculty/compliance reviewer assigned (required for retrieval/corpus/neuroadaptive changes).
