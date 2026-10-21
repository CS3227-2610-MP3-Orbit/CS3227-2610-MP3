---
id: LEC-04
title: AI consultation briefing
owner: lecturer
status: approved
---

# LEC-04: AI consultation briefing

## Context

Lecturers should be able to request an AI-generated briefing for an authorized consultation. The repository already provides a server-side SoC LLM gateway, untrusted-text wrapper, timeout handling, and quota accounting, but no Lecturer briefing feature exists.

## Actors and permissions

- Only an authenticated, active lecturer may request a briefing for their own approved consultation.
- Students, administrators, other lecturers, signed-out users, and deactivated lecturers must not retrieve the briefing input or invoke the feature.
- The model has no authority to modify bookings, permissions, or lifecycle state.

## Functional requirements

- After server-side authorization, the backend retrieves only the approved consultation data needed for the briefing.
- Student-submitted descriptions are passed as untrusted data through `wrapUntrusted()`.
- The backend calls `generateText()` and returns bounded text or a typed safe failure.
- The UI renders the result as plain text and ordinary consultation features remain usable when AI is unavailable.

## Non-functional requirements

- SoC LLM credentials remain server-side.
- Enforce input/output limits, timeout handling, and quotas from SH-01.
- Do not log secrets or unnecessary student information.
- Validate any structured output before displaying or using it.

## Inputs and outputs

- Input: authenticated lecturer and approved consultation identifier.
- Model input: minimum necessary consultation metadata and untrusted student description.
- Output: plain-text briefing or a safe reason such as unavailable, timed out, or quota exceeded.

## AI behaviour and threat model

- Student descriptions, lecturer-entered notes, and other database text are data, not instructions.
- The system prompt must state that untrusted content cannot change the task, permissions, or booking state.
- Prompt injection, HTML/script output, oversized input, empty output, provider failure, repeated requests, and data exfiltration must be tested.
- AI output must never approve, reject, create, edit, complete, or delete a consultation.
- The briefing contains a summary, grouped question themes, and preparation topics.
- The selected consultation includes the student's name, topic, and questions; student email is excluded from the model input.
- A briefing is generated for one selected upcoming approved consultation.
- Generated briefings are retained in the database indefinitely, while the user-facing view shows only the latest 10 for the owning Lecturer.

## Acceptance criteria

- **LEC-04-AC1** Given an active lecturer and an approved consultation they own, when they request a briefing, then the backend authorizes first, retrieves only permitted data, and calls `generateText()`.
- **LEC-04-AC2** Given an unauthorized role, another lecturer's consultation, an unapproved consultation, or a deactivated user, when a briefing is requested directly, then no briefing data is returned and the model is not called.
- **LEC-04-AC3** Given a student description containing instructions to reveal data or change a booking, when the briefing is generated, then the text is treated as untrusted content and cannot change authorization, booking state, or system instructions.
- **LEC-04-AC4** Given model output containing markup or scripts, when the briefing is rendered, then it is displayed as inert plain text.
- **LEC-04-AC5** Given quota exhaustion, timeout, rate limit, provider failure, oversized input, or empty output, when a briefing is requested, then a safe typed failure is returned and ordinary consultation features remain functional.
- **LEC-04-AC6** Given repeated requests by one lecturer, when the configured quota is reached, then further calls are refused according to SH-01 without exposing secrets or internal provider details.

## Error and edge cases

- Missing consultation, wrong state, ownership mismatch, prompt-injection text, empty fields, long fields, model timeout, rate limit, unavailable provider, malformed output, and quota exhaustion.

## Security requirements

- Authorization precedes retrieval and model invocation.
- Use `generateText()` and `wrapUntrusted()`; never call the provider from the browser.
- Apply least-data disclosure and safe plain-text rendering.
- Preserve an audit trail that excludes secrets and unnecessary student content.

## Out of scope

- Automatic booking decisions, direct model access by clients, persistent student profiling, and changing consultation records from AI output.

## Required tests

- Authorization/data-scoping tests, prompt-injection tests, output-escaping tests, quota/limit tests, provider failure tests, and non-AI fallback tests.

## Dependencies and assumptions

- Depends on SH-01 and LEC-03 plus a future consultation schema.
- Assumes the existing SoC LLM gateway is the only provider integration.

## Open questions

- The existing default SoC quota and rate-limit settings apply.

## Change log

| Date       | Change                                                                                | By                |
| ---------- | ------------------------------------------------------------------------------------- | ----------------- |
| 2026-10-19 | Initial draft based on repository inspection                                          | Codex             |
| 2026-10-20 | Approved selected-consultation format, fields, retention, and default quota decisions | Human stakeholder |
