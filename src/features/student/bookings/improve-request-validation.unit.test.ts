import { describe, expect, it } from "vitest";

import {
  parseAdvice,
  parseImproveRequest,
  validateProposalForApply,
} from "./improve-request-validation";

const advice = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({
    topic: "SQL join clarification",
    questions: "Could you explain LEFT JOIN with a small example?",
    suggestions: ["Bring the query that produced the unexpected result."],
    ...overrides,
  });

describe("STU-05 improve request validation", () => {
  it("[STU-05-AC1] accepts only topic and questions and retains no identity or prompt controls", () => {
    expect(
      parseImproveRequest({ topic: " SQL joins ", questions: " Explain LEFT JOINs. " }).data,
    ).toEqual({ topic: "SQL joins", questions: "Explain LEFT JOINs." });
    expect(
      parseImproveRequest({
        topic: "SQL joins",
        questions: "Explain LEFT JOINs.",
        userId: "forged",
      }).success,
    ).toBe(false);
  });

  it("[STU-05-AC6] parses exactly one strict JSON object and returns only validated fields", () => {
    expect(parseAdvice(advice())).toEqual({
      success: true,
      data: {
        topic: "SQL join clarification",
        questions: "Could you explain LEFT JOIN with a small example?",
        suggestions: ["Bring the query that produced the unexpected result."],
      },
    });
    expect(parseAdvice(advice({ suggestions: [] }))).toMatchObject({
      success: true,
      data: { suggestions: [] },
    });
  });

  it("[STU-05-AC6] trims Unicode-aware fields and enforces exact topic/question boundaries", () => {
    expect(parseAdvice(advice({ topic: `  ${"😀".repeat(200)}  ` })).success).toBe(true);
    expect(parseAdvice(advice({ topic: "😀".repeat(201) })).success).toBe(false);
    expect(parseAdvice(advice({ questions: "q".repeat(2_000) })).success).toBe(true);
    expect(parseAdvice(advice({ questions: "q".repeat(2_001) })).success).toBe(false);
    expect(parseAdvice(advice({ topic: "  ", questions: "valid" })).success).toBe(false);
    expect(parseAdvice(advice({ topic: "valid", questions: "\n\t" })).success).toBe(false);
  });

  it("[STU-05-AC6] enforces zero-to-five non-empty suggestions of at most 500 characters", () => {
    expect(parseAdvice(advice({ suggestions: Array(5).fill("s".repeat(500)) })).success).toBe(true);
    expect(parseAdvice(advice({ suggestions: Array(6).fill("valid") })).success).toBe(false);
    expect(parseAdvice(advice({ suggestions: ["s".repeat(501)] })).success).toBe(false);
    expect(parseAdvice(advice({ suggestions: ["  "] })).success).toBe(false);
  });

  it("[STU-05-AC6] rejects malformed, fenced, non-object, missing, wrong-type, and extra-key output as a whole", () => {
    const invalid = [
      "",
      "not json",
      `\`\`\`json\n${advice()}\n\`\`\``,
      `${advice()} trailing prose`,
      JSON.stringify(["topic", "questions", "suggestions"]),
      JSON.stringify({ topic: "valid", questions: "valid" }),
      advice({ topic: 42 }),
      advice({ questions: null }),
      advice({ suggestions: "one suggestion" }),
      advice({ extra: "not allowed" }),
    ];
    for (const value of invalid) expect(parseAdvice(value).success, value).toBe(false);
  });

  it("[STU-05-AC6] rejects NUL, unpaired surrogates, and raw responses over 6,000 characters", () => {
    expect(parseAdvice(advice({ topic: "valid\0topic" })).success).toBe(false);
    expect(parseAdvice(advice({ questions: "bad\ud800value" })).success).toBe(false);
    expect(parseAdvice(`${advice()}${" ".repeat(6_001)}`).success).toBe(false);
  });

  it("[STU-05-AC6] preserves hostile strings literally as data", () => {
    const hostile = "<script>window.compromised=true</script> **not Markdown**";
    expect(
      parseAdvice(advice({ topic: hostile, questions: hostile, suggestions: [hostile] })),
    ).toEqual({
      success: true,
      data: { topic: hostile, questions: hostile, suggestions: [hostile] },
    });
  });

  it("[STU-05-AC16] validates locally edited proposal fields before Apply with field-specific feedback", () => {
    expect(
      validateProposalForApply({
        topic: "  Clarify joins  ",
        questions: "  Could you compare LEFT and INNER JOIN?  ",
        suggestions: ["Bring a sample query."],
      }),
    ).toEqual({
      success: true,
      data: {
        topic: "Clarify joins",
        questions: "Could you compare LEFT and INNER JOIN?",
      },
    });
    expect(validateProposalForApply({ topic: " ", questions: "valid", suggestions: [] })).toEqual({
      success: false,
      field: "topic",
    });
    expect(
      validateProposalForApply({
        topic: "valid",
        questions: "q".repeat(2_001),
        suggestions: [],
      }),
    ).toEqual({ success: false, field: "questions" });
  });
});
