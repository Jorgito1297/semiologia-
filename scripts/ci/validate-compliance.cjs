const fs = require('fs');
const path = require('path');

function fail(message) {
  console.error(`[compliance-validation] ${message}`);
  process.exit(1);
}

const policyPath = 'STABILITY_SPRINT_POLICY.md';
const reliabilityPath = 'KNOWLEDGE_RELIABILITY_SPRINT.md';
const promotionPath = 'KNOWLEDGE_PROMOTION_PIPELINE.md';
const observabilityPath = 'RETRIEVAL_OBSERVABILITY_SPEC.md';
const evidencePath = process.env.COMPLIANCE_REPORT || path.join('artifacts', 'compliance', 'latest.json');
const moodleFunctionPath = path.join('supabase', 'functions', 'supabase_moodle_proxy', 'index.ts');

for (const file of [policyPath, reliabilityPath, promotionPath, observabilityPath]) {
  if (!fs.existsSync(file)) {
    fail(`Missing required governance document: ${file}`);
  }
}

const policy = fs.readFileSync(policyPath, 'utf8');
if (!policy.includes('FEATURE FREEZE')) {
  fail('FEATURE FREEZE declaration missing in policy.');
}
if (!policy.includes('Manual SQL Editor Deployment')) {
  fail('Manual SQL deployment policy missing.');
}

if (!fs.existsSync(moodleFunctionPath)) {
  fail(`Missing Moodle proxy function: ${moodleFunctionPath}`);
}
const moodleFn = fs.readFileSync(moodleFunctionPath, 'utf8');
if (!moodleFn.includes('MOODLE_PHASE2_ENABLED')) {
  fail('Moodle governance gate missing (MOODLE_PHASE2_ENABLED).');
}

if (!fs.existsSync(evidencePath)) {
  fail(`Missing compliance evidence: ${evidencePath}`);
}

let report;
try {
  report = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
} catch (err) {
  fail(`Invalid JSON in ${evidencePath}: ${err.message}`);
}

if (report.placeholder === true) {
  fail(`Evidence file ${evidencePath} is a placeholder. Replace with real compliance sign-off.`);
}

if (report.faculty_compliance_approved !== true) {
  fail('faculty_compliance_approved must be true');
}
if (report.no_freeze_violations !== true) {
  fail('no_freeze_violations must be true');
}

console.log('[compliance-validation] PASS');
