import { describe, expect, it } from "vitest";

import { parseHandoff } from "./lib/handoff.mjs";

function document(data) {
  return `<!-- HANDOFF:BEGIN -->\n${JSON.stringify(data)}\n<!-- HANDOFF:END -->`;
}

describe("structured handoff schema", () => {
  it("[WFG-03-AC3] rejects non-string evidence array entries", () => {
    const result = parseHandoff(
      document({
        schemaVersion: 1,
        taskId: "WFG-TEST",
        requirementIds: [null],
        status: "blocked",
        changedFiles: [123],
        verification: [{ check: "remote", result: "not-run", evidence: "not accessed" }],
        unresolvedIssues: [{}],
      }),
    );
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "requirementIds entries must be non-empty strings",
        "changedFiles entries must be non-empty strings",
        "unresolvedIssues entries must be non-empty strings",
      ]),
    );
  });
});
