# Handoff: STU-05 live-model prompt fix — coordinator → Student owner

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "STU-05-LIVE-PROMPT-FIX",
"requirementIds": ["STU-05-R3"],
"status": "passed",
"changedFiles": ["src/features/student/bookings/improve-request-server.ts", "workflow/handoffs/stu-05/2026-10-22-live-model-prompt-fix.md"],
"verification": [
{"check": "live SoC LLM call with the exact system prompt (model default), before the fix", "result": "failed", "evidence": "questions returned as a JSON array, so parseAdvice rejected it and the UI showed 'AI advice is temporarily unavailable'"},
{"check": "live SoC LLM call with the clarified prompt (model default), 6 runs", "result": "passed", "evidence": "6/6 responses parsed as the exact { topic, questions, suggestions } shape, 1.4-1.8 s each"},
{"check": "npx vitest run src/features/student", "result": "passed", "evidence": "59 passed"},
{"check": "prettier and eslint on the changed file", "result": "passed", "evidence": "no findings"}
],
"unresolvedIssues": ["The deployed SOCLAAS_MODEL must be 'default' (or another non-reasoning model); qwen3.5:9b spends the 600-token budget on hidden reasoning and returns empty content."]
}

<!-- HANDOFF:END -->

- Date: 2026-10-22
- Specification: `workflow/specs/student/STU-05-improve-request.md` (approved). The spec already
  requires `{ "topic": string, "questions": string, "suggestions": string[] }`; this change only makes
  the system prompt state that `questions` is one string. No requirement, validation or bound changed.

## What was found

Testing the deployed configuration against the real SoC LLM on 22 Oct showed two separate problems:

1. **Model.** `qwen3.5:9b` is a reasoning model. With the gateway's 600-token output limit it spent
   every token on hidden reasoning and returned empty content (`finish_reason: length`), so every AI
   call failed. The server ignores `chat_template_kwargs.enable_thinking`. The `default` model does
   not reason first and answers in about 1.5 seconds. `SOCLAAS_MODEL` was changed to `default` in the
   environment configuration, not in code.
2. **Prompt.** With `default`, the model sometimes returned `questions` as an array of strings. The
   strict parser correctly rejected it. The prompt now says each question goes on its own line
   inside the one `questions` string, never an array.

The strict parser was deliberately left unchanged, so malformed output is still refused.

## Next decision

Joseph to review and merge.
