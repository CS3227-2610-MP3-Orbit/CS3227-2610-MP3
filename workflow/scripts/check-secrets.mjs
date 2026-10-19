#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";

let files;
try {
  files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);
} catch {
  console.error("Secret scan blocked: could not enumerate repository files.");
  process.exit(2);
}

const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  [
    "--no-install",
    "secretlint",
    "--format",
    "json",
    "--secretlintrc",
    ".secretlintrc.json",
    "--",
    ...files,
  ],
  { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
);
if (result.error) {
  console.error("Secret scan blocked: secretlint is unavailable. Run npm ci/install first.");
  process.exit(2);
}
if (result.status !== 0) {
  try {
    const reports = JSON.parse(result.stdout || "[]");
    for (const report of reports) {
      for (const finding of report.messages ?? []) {
        console.error(
          `secret finding: ${report.filePath}:${finding.line}:${finding.column} (${finding.ruleId})`,
        );
      }
    }
  } catch {
    console.error("Secret scan failed; output was suppressed to avoid exposing matched content.");
  }
}
process.exit(result.status ?? 2);
