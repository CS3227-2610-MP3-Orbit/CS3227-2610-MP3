import { readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  claimAttempt: vi.fn(),
  finalizeAttempt: vi.fn(),
  markAttemptIndeterminate: vi.fn(),
  releaseAttempt: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("openai", () => ({
  default: class OpenAI {
    chat = { completions: { create: mocks.create } };
  },
  APIConnectionTimeoutError: class APIConnectionTimeoutError extends Error {},
  RateLimitError: class RateLimitError extends Error {},
}));
vi.mock("./attempts", () => ({
  claimAttempt: mocks.claimAttempt,
  finalizeAttempt: mocks.finalizeAttempt,
  markAttemptIndeterminate: mocks.markAttemptIndeterminate,
  releaseAttempt: mocks.releaseAttempt,
}));

import { generateText } from "./client";

const request = {
  userId: "80000000-0000-4000-8000-000000000001",
  feature: "student.improve-request",
  system: "Fixed instructions",
  input: "Wrapped draft",
};

describe("STU-05 structured gateway output", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.claimAttempt.mockResolvedValue({ kind: "claimed", id: "attempt-1" });
    mocks.finalizeAttempt.mockResolvedValue(true);
    mocks.releaseAttempt.mockResolvedValue(true);
  });

  it("[STU-05-AC6] finalizes a strict valid proposal exactly once", async () => {
    const text = JSON.stringify({ topic: "Topic", questions: "Question", suggestions: [] });
    mocks.create.mockResolvedValue({ choices: [{ message: { content: text } }] });

    await expect(generateText(request)).resolves.toEqual({ ok: true, text });
    expect(mocks.finalizeAttempt).toHaveBeenCalledOnce();
    expect(mocks.releaseAttempt).not.toHaveBeenCalled();
  });

  it.each([
    ["legacy labelled output", "Improved draft: Topic\nSuggestions: Bring an example"],
    ["fenced JSON", '```json\n{"topic":"T","questions":"Q","suggestions":[]}\n```'],
    ["unknown key", '{"topic":"T","questions":"Q","suggestions":[],"extra":true}'],
    ["partial invalid field", '{"topic":"T","questions":"Q","suggestions":[""]}'],
  ])("[STU-05-AC6] releases rather than finalizes %s", async (_name, text) => {
    mocks.create.mockResolvedValue({ choices: [{ message: { content: text } }] });

    await expect(generateText(request)).resolves.toEqual({ ok: false, reason: "invalid_output" });
    expect(mocks.releaseAttempt).toHaveBeenCalledOnce();
    expect(mocks.finalizeAttempt).not.toHaveBeenCalled();
  });

  it("[STU-05-AC6] measures the raw provider response before trimming whitespace", async () => {
    const valid = JSON.stringify({ topic: "T", questions: "Q", suggestions: [] });
    mocks.create.mockResolvedValue({
      choices: [{ message: { content: `${" ".repeat(6_001)}${valid}` } }],
    });

    await expect(generateText(request)).resolves.toEqual({ ok: false, reason: "invalid_output" });
    expect(mocks.releaseAttempt).toHaveBeenCalledOnce();
    expect(mocks.finalizeAttempt).not.toHaveBeenCalled();
  });
});

it("[STU-05-AC4] keeps the shared gateway's 4,000-character input, 600-token output, and 20-second timeout limits", () => {
  const source = readFileSync(join(process.cwd(), "src/lib/ai/client.ts"), "utf8");

  expect(source).toContain("const REQUEST_TIMEOUT_MS = 20_000");
  expect(source).toContain("const MAX_INPUT_CHARS = 4_000");
  expect(source).toContain("const MAX_OUTPUT_TOKENS = 600");
  expect(source).toMatch(/request\.input\.length\s*>\s*MAX_INPUT_CHARS/);
  expect(source).toMatch(/max_tokens:\s*MAX_OUTPUT_TOKENS/);
});

it("[STU-05-AC1] uses only the server-side SOCLAAS provider configuration names", () => {
  const source = readFileSync(join(process.cwd(), "src/lib/ai/client.ts"), "utf8");

  expect(source).toContain("process.env.SOCLAAS_BASE_URL");
  expect(source).toContain("process.env.SOCLAAS_API_KEY");
  expect(source).toContain("process.env.SOCLAAS_MODEL");
  expect(source).not.toMatch(/process\.env\.SOC_LLM_/);
  expect(source).not.toMatch(/NEXT_PUBLIC_SOCLAAS_/);
});
