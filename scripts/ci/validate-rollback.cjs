const fs = require('fs');
const path = require('path');

function fail(message) {
  console.error(`[rollback-validation] ${message}`);
  process.exit(1);
}

const migrationDir = path.join('supabase', 'migrations');
const rollbackDir = path.join('supabase', 'rollback');
const reportPath = process.env.ROLLBACK_REPORT || path.join('artifacts', 'rollback', 'latest.json');

if (!fs.existsSync(migrationDir) || !fs.existsSync(rollbackDir)) {
  fail('Missing supabase migration or rollback directories.');
}

const migrations = fs
  .readdirSync(migrationDir)
  .filter((f) => /^\d{8}_\d{3}_.+\.sql$/.test(f));

for (const m of migrations) {
  const suffix = m.replace(/^\d{8}_/, '');
  const rollbackName = `rollback_${suffix}`;
  const rollbackPath = path.join(rollbackDir, rollbackName);
  if (!fs.existsSync(rollbackPath)) {
    fail(`Missing rollback pair for migration ${m} -> expected ${rollbackName}`);
  }
}

if (!fs.existsSync(path.join(rollbackDir, 'rollback_all.sql'))) {
  fail('Missing aggregate rollback: rollback_all.sql');
}

if (!fs.existsSync(reportPath)) {
  fail(`Missing rollback evidence report: ${reportPath}`);
}

let report;
try {
  report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
} catch (err) {
  fail(`Invalid JSON in ${reportPath}: ${err.message}`);
}

if (report.placeholder === true) {
  fail(`Evidence file ${reportPath} is a placeholder. Replace with real rollback validation output.`);
}

const requiredTrue = [
  'rollback_validation_passed',
  'rls_validation_passed',
  'constraint_validation_passed',
];

for (const key of requiredTrue) {
  if (report[key] !== true) {
    fail(`${key} must be true`);
  }
}

console.log('[rollback-validation] PASS');
