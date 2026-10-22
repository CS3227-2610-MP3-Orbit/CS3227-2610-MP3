#!/usr/bin/env node

import { validateHandoffFile } from "./lib/handoff.mjs";

const file = process.argv[2];
if (!file) {
  console.error("usage: node workflow/scripts/check-handoff.mjs workflow/handoffs/<file>.md");
  process.exit(2);
}

const result = validateHandoffFile(file);
if (result.errors.length > 0) {
  result.errors.forEach((error) => console.error(`error: ${error}`));
  process.exit(1);
}
console.log(`Handoff valid: ${file} (${result.data.status})`);
