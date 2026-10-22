#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const rules = [
  {
    category: "authentication/authorization",
    pattern: /^(src\/lib\/(auth|ai)\/|src\/app\/login\/|src\/proxy\.ts$|supabase\/.*polic)/,
  },
  {
    category: "agent controls",
    pattern: /^(AGENTS\.md$|CLAUDE\.md$|\.codex\/|\.claude\/|workflow\/(agents|hooks|policies)\/)/,
  },
  {
    category: "CI/deployment",
    pattern: /^(\.github\/|vercel\.json$|workflow\/scripts\/setup-)/,
  },
  { category: "database migration", pattern: /^supabase\/migrations\// },
  { category: "workflow enforcement", pattern: /^workflow\/scripts\// },
  {
    category: "dependency/tooling",
    pattern: /^(package(?:-lock)?\.json$|npm-shrinkwrap\.json$|\.secretlintrc\.json$)/,
  },
];

export function classifyPaths(files) {
  return [...new Set(files.filter(Boolean))].sort().flatMap((file) => {
    const categories = rules.filter((rule) => rule.pattern.test(file)).map((rule) => rule.category);
    return categories.length ? [{ file, categories }] : [];
  });
}

function gitFiles(args) {
  return execFileSync("git", args, { encoding: "utf8" }).split("\n").filter(Boolean);
}

function filesFromArguments(argv) {
  const explicit = argv.indexOf("--files");
  if (explicit !== -1) return argv.slice(explicit + 1);
  const base =
    argv.find((arg) => arg.startsWith("--base="))?.slice("--base=".length) ??
    process.env.SENSITIVE_BASE ??
    (process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : null);
  if (base) return gitFiles(["diff", "--name-only", `${base}...HEAD`]);
  return [
    ...gitFiles(["diff", "--name-only", "HEAD"]),
    ...gitFiles(["ls-files", "--others", "--exclude-standard"]),
  ];
}

function main() {
  let classified;
  try {
    classified = classifyPaths(filesFromArguments(process.argv.slice(2)));
  } catch {
    console.error("Sensitive-change classification failed; treat the change as review-required.");
    process.exitCode = 2;
    return;
  }

  if (classified.length === 0) {
    console.log("Sensitive-change review: not triggered by the inspected paths.");
    return;
  }
  console.log("Sensitive-change review: REQUIRED before merge or sensitive operation.");
  classified.forEach(({ file, categories }) => console.log(`- ${file}: ${categories.join(", ")}`));
  console.log("This classifier identifies the gate; GitHub review settings enforce it remotely.");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
