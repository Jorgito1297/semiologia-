import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // CI governance scripts run in plain Node and are linted separately if needed.
    "scripts/ci/**",
    // NEXUS VAULT is a separate NestJS project with its own lint config.
    // Its compiled output (dist/) uses CommonJS require() which ESLint flags as errors.
    "nexus-vault/**",
    // Python virtual environment — should never be linted by JS tooling.
    ".venv/**",
    // Compiled JavaScript output from any sub-project.
    "**/dist/**",
    // Supabase Edge Functions run in Deno — different runtime, not Node/Next.js.
    // @ts-nocheck is required and intentional for Deno compatibility.
    "supabase/functions/**",
    "supabase_moodle_proxy.ts",
  ]),
]);

export default eslintConfig;


