import { describe, expect, it } from "vitest";

import { checkTraceability, findReferences, parseSpec } from "./check-traceability.mjs";

const spec = (status) =>
  parseSpec(
    `---\nid: STU-01\ntitle: Example\nowner: x\nstatus: ${status}\n---\n\n` +
      "- **STU-01-AC1** first\n- **STU-01-AC2** second\n",
    "STU-01.md",
  );

describe("traceability check", () => {
  it("reads the id, status and criteria of a spec", () => {
    expect(spec("draft")).toMatchObject({
      id: "STU-01",
      status: "draft",
      criteria: ["STU-01-AC1", "STU-01-AC2"],
    });
  });

  it("treats todo and skipped tests as pending, not covering", () => {
    const refs = findReferences('it("[STU-01-AC1] a")\nit.todo("[STU-01-AC2] b")', "a.test.ts");
    expect(refs.map((ref) => ref.pending)).toEqual([false, true]);
  });

  it("only warns about uncovered criteria while a spec is a draft", () => {
    const result = checkTraceability([spec("draft")], []);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toHaveLength(2);
  });

  it("fails when an approved spec has an uncovered criterion", () => {
    const refs = findReferences('it("[STU-01-AC1] a")', "a.test.ts");
    expect(checkTraceability([spec("approved")], refs).errors).toEqual([
      "STU-01-AC2 (approved) has no test",
    ]);
  });

  it("fails when a test references a criterion no spec defines", () => {
    const refs = findReferences('it("[STU-01-AC9] gone")', "a.test.ts");
    expect(checkTraceability([spec("draft")], refs).errors).toEqual([
      "a.test.ts:1: references unknown criterion STU-01-AC9",
    ]);
  });
});
