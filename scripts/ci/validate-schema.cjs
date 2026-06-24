const fs = require('fs');
const path = require('path');

function fail(message) {
  console.error(`[schema-validation] ${message}`);
  process.exit(1);
}

const schemaDir = path.join('src', 'rag', 'schemas');
if (!fs.existsSync(schemaDir)) {
  fail(`Missing schema directory: ${schemaDir}`);
}

const files = fs.readdirSync(schemaDir).filter((f) => f.endsWith('.json'));
if (!files.includes('chunk_schema.json')) {
  fail('Missing required schema: chunk_schema.json');
}
if (!files.includes('retrieval_validation_schema.json')) {
  fail('Missing required schema: retrieval_validation_schema.json');
}

for (const file of files) {
  const full = path.join(schemaDir, file);
  try {
    JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch (err) {
    fail(`Invalid JSON in ${full}: ${err.message}`);
  }
}

console.log('[schema-validation] PASS');
