const fs = require('fs');

function fail(message) {
  console.error(`[architecture-review-validation] ${message}`);
  process.exit(1);
}

const requiredDocs = [
  'ARCHITECTURE_REVIEW_BOARD.md',
  'KNOWLEDGE_OPS_FRAMEWORK.md',
  'RETRIEVAL_REPLAY_SYSTEM.md',
  'NEUROADAPTIVE_REPLAY_VALIDATION.md',
  'KNOWLEDGE_INCIDENT_RESPONSE.md',
  'KNOWLEDGE_VERSIONING_STANDARD.md',
  'OPERATIONAL_TELEMETRY_SPEC.md',
  'GOVERNANCE_ACTIVATION_CHECKLIST.md',
  'EVIDENCE_GENERATION_SPRINT.md',
];

for (const doc of requiredDocs) {
  if (!fs.existsSync(doc)) {
    fail(`Missing required governance document: ${doc}`);
  }
}

const prTemplatePath = '.github/pull_request_template.md';
if (!fs.existsSync(prTemplatePath)) {
  fail('Missing .github/pull_request_template.md');
}

const template = fs.readFileSync(prTemplatePath, 'utf8');
const requiredMarkers = [
  'Architecture Review Board (ARB)',
  'affects_retrieval: yes/no',
  'affects_neuroadaptive_logic: yes/no',
  'affects_compliance: yes/no',
  'rollback_safe: yes/no',
  'faculty_impact: yes/no',
  'rls_impact: yes/no',
  'KnowledgeOps Promotion Stage',
  'Retrieval replay validation passed.',
  'Neuroadaptive replay validation passed.',
];

for (const marker of requiredMarkers) {
  if (!template.includes(marker)) {
    fail(`PR template missing marker: ${marker}`);
  }
}

console.log('[architecture-review-validation] PASS');
