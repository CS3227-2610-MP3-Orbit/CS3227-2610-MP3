#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const profile = process.argv.find((arg) => arg.startsWith("--profile="))?.split("=", 2)[1] ?? "app";
const profiles = new Set(["app", "database", "e2e", "full"]);
if (!profiles.has(profile)) {
  console.error(`Unknown verification profile: ${profile}`);
  process.exit(2);
}

const app = [
  ["format", "npm", ["run", "format:check"]],
  ["lint", "npm", ["run", "lint"]],
  ["typecheck", "npm", ["run", "typecheck"]],
  ["workflow controls", "npm", ["run", "test:workflow"]],
  ["sensitive-change classification", "npm", ["run", "check:sensitive"]],
  ["application unit tests", "npm", ["test"]],
  ["spec traceability", "npm", ["run", "check:spec"]],
  ["secret scan", "npm", ["run", "check:secrets"]],
  ["application build", "npm", ["run", "build"]],
];
const database = [
  ["database lint", "supabase", ["db", "lint", "--level", "error"]],
  ["database rule tests", "npm", ["run", "test:db"]],
];
const e2e = [["end-to-end tests", "npm", ["run", "test:e2e"]]];
let steps =
  profile === "app"
    ? app
    : profile === "database"
      ? database
      : profile === "e2e"
        ? e2e
        : [...app, ...database, ...e2e];

const results = [];
if (profile === "e2e" || profile === "full") {
  const supabase = spawnSync("supabase", ["status", "-o", "json"], { encoding: "utf8" });
  const browsers = spawnSync("npx", ["playwright", "install", "--list"], { encoding: "utf8" });
  const missing = [];
  if (supabase.error || supabase.status !== 0) missing.push("running local Supabase stack");
  if (browsers.error || browsers.status !== 0 || !/chromium_headless_shell/.test(browsers.stdout))
    missing.push("installed Playwright Chromium browser");
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
    missing.push("local public Supabase environment variables");
  if (missing.length > 0) {
    results.push({
      name: "end-to-end prerequisites",
      status: "blocked",
      exitCode: null,
      detail: missing.join(", "),
    });
    steps = steps.filter(([name]) => name !== "end-to-end tests");
  }
}

for (const [name, command, args] of steps) {
  console.log(`\n[verify] ${name}`);
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
  const status = result.error ? "blocked" : result.status === 0 ? "passed" : "failed";
  results.push({ name, status, exitCode: result.status });
}

console.log("\n[verify] summary");
results.forEach(({ name, status, exitCode, detail }) =>
  console.log(
    `- ${name}: ${status}${exitCode == null ? "" : ` (exit ${exitCode})`}${detail ? ` — ${detail}` : ""}`,
  ),
);
process.exit(results.every((result) => result.status === "passed") ? 0 : 1);
