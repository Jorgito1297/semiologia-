const fs = require('fs');
const path = require('path');

function fail(message) {
  console.error(`[rls-validation] ${message}`);
  process.exit(1);
}

const migrationsDir = path.join('supabase', 'migrations');
const rlsReport = process.env.RLS_REPORT || path.join('artifacts', 'compliance', 'rls_penetration.json');

if (!fs.existsSync(migrationsDir)) {
  fail('Missing supabase/migrations directory.');
}

const sqlFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
const sqlText = sqlFiles
  .map((f) => fs.readFileSync(path.join(migrationsDir, f), 'utf8'))
  .join('\n');

const requiredMarkers = [
  'ENABLE ROW LEVEL SECURITY',
  'students_self_access',
  'memory_self_access',
  'competency_self_access',
  'review_queue_faculty_access',
];

for (const marker of requiredMarkers) {
  if (!sqlText.includes(marker)) {
    fail(`Missing required RLS marker: ${marker}`);
  }
}

if (!fs.existsSync(rlsReport)) {
  fail(`Missing RLS penetration evidence: ${rlsReport}`);
}

let report;
try {
  report = JSON.parse(fs.readFileSync(rlsReport, 'utf8'));
} catch (err) {
  fail(`Invalid JSON in ${rlsReport}: ${err.message}`);
}

if (report.placeholder === true) {
  fail(`Evidence file ${rlsReport} is a placeholder. Replace with real RLS penetration results.`);
}

const requiredTrue = [
  'stale_jwt_rejected',
  'malformed_jwt_rejected',
  'tenant_escalation_blocked',
  'direct_chunk_access_blocked',
  'disabled_chunk_retrieval_blocked',
];

for (const key of requiredTrue) {
  if (report[key] !== true) {
    fail(`${key} must be true`);
  }
}

console.log('[rls-validation] PASS');
