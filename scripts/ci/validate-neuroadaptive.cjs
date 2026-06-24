const fs = require('fs');
const path = require('path');

const reportPath = process.env.NEUROADAPTIVE_REPORT || path.join('artifacts', 'neuroadaptive', 'latest.json');

function fail(message) {
  console.error(`[neuroadaptive-validation] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(reportPath)) {
  fail(`Missing report: ${reportPath}. Add neuroadaptive suite output before merge.`);
}

let report;
try {
  report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
} catch (err) {
  fail(`Invalid JSON in ${reportPath}: ${err.message}`);
}

if (report.placeholder === true) {
  fail(`Evidence file ${reportPath} is a placeholder. Replace with real neuroadaptive results.`);
}

const requiredBoolean = [
  'sm2_regression_passed',
  'procedural_semantic_isolation',
  'no_regression_failures',
];

for (const key of requiredBoolean) {
  if (typeof report[key] !== 'boolean') {
    fail(`Required boolean field missing or invalid: ${key}`);
  }
  if (!report[key]) {
    fail(`${key} must be true`);
  }
}

const requiredNumeric = [
  'min_interval_days',
  'max_interval_days',
  'ease_factor_min',
  'ease_factor_max',
];

for (const key of requiredNumeric) {
  if (typeof report[key] !== 'number') {
    fail(`Required numeric field missing or invalid: ${key}`);
  }
}

if (report.min_interval_days < 1) {
  fail(`min_interval_days ${report.min_interval_days} < 1`);
}
if (report.max_interval_days > 30) {
  fail(`max_interval_days ${report.max_interval_days} > 30`);
}
if (report.ease_factor_min < 1.3) {
  fail(`ease_factor_min ${report.ease_factor_min} < 1.3`);
}
if (report.ease_factor_max > 5.0) {
  fail(`ease_factor_max ${report.ease_factor_max} > 5.0`);
}

console.log('[neuroadaptive-validation] PASS');
