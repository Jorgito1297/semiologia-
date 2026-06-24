const fs = require('fs');
const path = require('path');

const reportPath = process.env.RETRIEVAL_REPORT || path.join('artifacts', 'retrieval', 'latest.json');

const limits = {
  retrieval_trust_score_min: 0.9,
  hallucination_rate_max: 0.03,
  grounding_accuracy_min: 0.92,
  faculty_override_rate_max: 0.05,
  chunk_redundancy_max: 0.15,
  cg_alignment_accuracy_exact: 1.0,
};

function fail(message) {
  console.error(`[retrieval-validation] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(reportPath)) {
  fail(`Missing report: ${reportPath}. Add retrieval QA output before merge.`);
}

let report;
try {
  report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
} catch (err) {
  fail(`Invalid JSON in ${reportPath}: ${err.message}`);
}

if (report.placeholder === true) {
  fail(`Evidence file ${reportPath} is a placeholder. Replace with real retrieval results.`);
}

const required = [
  'retrieval_trust_score',
  'hallucination_rate',
  'grounding_accuracy',
  'faculty_override_rate',
  'chunk_redundancy',
  'cg_alignment_accuracy',
];

for (const key of required) {
  if (typeof report[key] !== 'number') {
    fail(`Required numeric field missing or invalid: ${key}`);
  }
}

if (report.retrieval_trust_score < limits.retrieval_trust_score_min) {
  fail(`retrieval_trust_score ${report.retrieval_trust_score} < ${limits.retrieval_trust_score_min}`);
}
if (report.hallucination_rate > limits.hallucination_rate_max) {
  fail(`hallucination_rate ${report.hallucination_rate} > ${limits.hallucination_rate_max}`);
}
if (report.grounding_accuracy < limits.grounding_accuracy_min) {
  fail(`grounding_accuracy ${report.grounding_accuracy} < ${limits.grounding_accuracy_min}`);
}
if (report.faculty_override_rate > limits.faculty_override_rate_max) {
  fail(`faculty_override_rate ${report.faculty_override_rate} > ${limits.faculty_override_rate_max}`);
}
if (report.chunk_redundancy > limits.chunk_redundancy_max) {
  fail(`chunk_redundancy ${report.chunk_redundancy} > ${limits.chunk_redundancy_max}`);
}
if (report.cg_alignment_accuracy !== limits.cg_alignment_accuracy_exact) {
  fail(`cg_alignment_accuracy ${report.cg_alignment_accuracy} must be exactly ${limits.cg_alignment_accuracy_exact}`);
}

console.log('[retrieval-validation] PASS');
