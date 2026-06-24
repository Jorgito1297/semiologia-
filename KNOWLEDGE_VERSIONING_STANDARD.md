# Knowledge Versioning Standard

Status: Mandatory
Policy: Append-only history for clinical knowledge artifacts.

## Why
Clinical knowledge evolves and corrections must remain traceable.
Never overwrite historical artifacts used for prior decisions.

## Versioned Entities
- Chunks
- Embeddings
- Faculty approvals
- Retrieval test outputs
- Replay datasets
- Neuroadaptive configuration

## Versioning Rules
- Use monotonic versions (v1, v2, v3...).
- Preserve prior versions as immutable history.
- Link each promotion to exact artifact versions.
- Store reviewer identity and timestamp per version.

## Promotion Chain Example
Chunk v1
-> Faculty Revision
-> Chunk v2
-> Embedding v2
-> Replay Validation
-> Promotion Candidate

## Required Metadata per Version
- artifact_id
- version
- parent_version
- change_reason
- reviewer_id
- created_at
- approved_for_promotion (true/false)

## Prohibited Practices
- In-place overwrite of embeddings.
- Deleting prior retrieval metrics.
- Rewriting faculty approval history.

## Audit Requirement
Every production artifact must map to:
- source version,
- validation outputs,
- faculty decision,
- promotion record.
