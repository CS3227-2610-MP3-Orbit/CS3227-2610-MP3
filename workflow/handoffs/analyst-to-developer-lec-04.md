# Analyst-to-Developer Handoff — LEC-04

## Role and review scope

- Role: Requirements Analyst Agent using `consultation-spec`.
- Reviewed: `workflow/specs/lecturer/LEC-04-ai-briefing.md`, the current Lecturer briefing implementation, UI, migration, tests, shared AI/integration specifications, and related consultation code.
- Application code, migrations, and tests were not modified by this review.
- No `.env.local` contents or credentials were read or reported.

## Approved decisions

- The feature targets one selected upcoming, approved consultation owned by the authenticated active Lecturer.
- The briefing contains a summary, grouped question themes, and preparation topics.
- The approved LEC-04 decision records student name, email, topic, and questions as selected-consultation input.
- Generated briefings are retained in the database for the owning Lecturer.
- Existing SoC LLM quota and rate-limit settings apply.
- AI output must remain plain text and must not mutate bookings, permissions, or consultation lifecycle state.

## Criteria coverage assessment

| Criterion | Current evidence | Assessment |
| --- | --- | --- |
| LEC-04-AC1 | Server action calls `requireRole`, scopes booking by lecturer and approved status, then calls `generateText`. | Partial: no direct integration test proves authorization precedes retrieval/model invocation. |
| LEC-04-AC2 | Query and active-user role checks exist. | Partial: no tests prove unauthorized roles, cross-lecturer IDs, deactivated users, or no model call. |
| LEC-04-AC3 | `wrapUntrusted()` escapes angle brackets and the system prompt rejects instructions in data. | Partial: unit boundary test exists; no mocked model/integration test proves booking state and authorization remain unchanged. |
| LEC-04-AC4 | UI renders returned content inside `<pre>` as text. | Partial: no rendered/UI test proves script/markup remains inert. |
| LEC-04-AC5 | Gateway has input limit, timeout, rate-limit, quota, unavailable, and empty-response results; action maps most failures to user-safe text. | Partial: current tests cover only quota decisions; provider failure, oversized input, empty output, persistence failure, and consultation fallback are untested. |
| LEC-04-AC6 | Gateway records usage and refuses quota-exhausted calls. | Partial: quota unit test exists; no action/gateway integration test proves repeated calls, no secret leakage, or configured feature behavior. |

## Current implementation evidence

- `src/features/lecturer/ai-briefing.ts`: server action, ownership/state query, untrusted wrapping, gateway call, typed user-facing failures, and database insert.
- `src/components/briefing-button.tsx`: selected-booking form and plain-text result/error rendering.
- `src/components/consultation-list.tsx`: exposes the briefing action only for `upcoming` consultations.
- `supabase/migrations/20261021000000_lecturer_ai_briefings.sql`: retained briefing table, Lecturer ownership policies, grants, and index.
- `src/features/lecturer/ai-briefing.test.ts`: two unit tests covering escaping/system-rule boundaries and quota decisions.

## Discrepancies and risks

1. **Contact-data policy conflict (blocking):** LEC-04 says name and email are included, but `workflow/specs/TECHNICAL-SPEC.md` and `workflow/specs/INTEGRATION-SPEC.md` say briefing model input excludes student contact details. A human must choose and update the affected specification(s) before final approval/merge.
2. **Retention contract is incomplete:** the migration retains content but does not define retention duration, retrieval UI, deletion, or whether duplicate briefings are acceptable.
3. **Migration/RLS evidence is missing:** the migration has policies, but no database test was found for cross-Lecturer read/insert isolation or ownership consistency between `booking_id` and `lecturer_id`.
4. **Model output validation is incomplete:** the implementation bounds provider output through the gateway but does not validate that required sections are present before persistence/display, despite the spec requiring validation of structured output.
5. **Feature identifier mismatch:** LEC-04 implementation uses `lecturer.ai-briefing`, while the shared integration contract names `lecturer.prepare-briefing`. This affects quota accounting and traceability and requires a decision.
6. **No independent reviewer evidence:** the Developer-to-Reviewer handoff remains an empty template; no independent Tester/Security Reviewer results are recorded.
7. **Existing repository evidence includes encoding artifacts:** several inspected UI files display mojibake punctuation. This is not an LEC-04 requirement issue but should be checked by formatting/build verification.

## Assumptions currently visible

- `requireRole("lecturer")` is the authoritative active-role check.
- “Upcoming” means `starts_at > now` at request time.
- A selected consultation may contain one or more student records according to the current booking model; the implementation currently loads one booking and one student.
- Briefing writes are append-only from the application perspective, with no update/delete grant.

## Unresolved questions before Developer handoff is final

1. Should the model receive student name/email, or must the shared least-data rule exclude them? This is blocking.
2. What retention period and Lecturer retrieval/deletion behavior apply to saved briefings?
3. Should repeated requests create multiple retained rows, or be deduplicated per booking/content/version?
4. Which stable feature identifier is canonical: `lecturer.ai-briefing` or `lecturer.prepare-briefing`?
5. Must the generated text be checked for the three required section headings before it is saved?
6. What database/E2E environments are available to verify RLS and provider-failure behavior?

## Recommended next action

Resolve the blocking data-minimization conflict and the retention/identifier decisions, then revise the approved spec if needed. After human approval, add AC-linked integration, database, UI, and security tests before treating the implementation as ready for independent verification.

## Human approval status

- This assessment is not human approval and does not authorize additional implementation or merge.
