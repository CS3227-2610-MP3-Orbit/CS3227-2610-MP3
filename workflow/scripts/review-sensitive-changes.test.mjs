import { describe, expect, it } from "vitest";

import { classifyPaths } from "./review-sensitive-changes.mjs";

describe("sensitive-change classifier", () => {
  it("[WFG-02-AC2] identifies each protected workflow category", () => {
    const result = classifyPaths([
      "src/lib/auth/session.ts",
      ".codex/config.toml",
      ".claude/agents/developer.md",
      ".github/workflows/ci.yml",
      ".github/CODEOWNERS",
      "supabase/migrations/20261018000000_bookings.sql",
      "workflow/scripts/verify.mjs",
      "src/lib/ai/client.ts",
      "package-lock.json",
      ".secretlintrc.json",
    ]);
    expect(result).toHaveLength(10);
    expect(result.flatMap((entry) => entry.categories)).toEqual(
      expect.arrayContaining([
        "authentication/authorization",
        "agent controls",
        "CI/deployment",
        "database migration",
        "workflow enforcement",
        "dependency/tooling",
      ]),
    );
  });

  it("[WFG-03-AC1] leaves ordinary role UI files outside the sensitive gate", () => {
    expect(classifyPaths(["src/app/student/page.tsx"])).toEqual([]);
  });
});
