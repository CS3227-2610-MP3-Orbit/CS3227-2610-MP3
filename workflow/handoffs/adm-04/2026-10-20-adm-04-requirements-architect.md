# Handoff: TASK-ADM-04 / ADM-04-R1..R9, AC1..AC14 — requirements_architect → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-ADM-04",
"requirementIds": ["ADM-04-R1", "ADM-04-R2", "ADM-04-R3", "ADM-04-R4", "ADM-04-R5", "ADM-04-R6", "ADM-04-R7", "ADM-04-R8", "ADM-04-R9"],
"status": "incomplete",
"changedFiles": ["workflow/specs/admin/ADM-04-booking-reports-and-ai-summary.md", "workflow/handoffs/adm-04/2026-10-20-adm-04-requirements-architect.md"],
"verification": [
{"check": "Read PRODUCT-SPEC.md Administrator experience section (booking report + AI activity summary)", "result": "passed", "evidence": "digest d9f63461aeb368ffd811ec50e5a595e0c6047ca7, matches ADM-01/ADM-02's citation, no drift"},
{"check": "Read SH-01-foundation.md (AI gateway, wrapUntrusted, UNTRUSTED_DATA_RULE, quota AC6/AC7)", "result": "passed", "evidence": "digest a1a660ead71b0565afddf27633c63b6299bc5fa8, matches ADM-01's citation"},
{"check": "Read src/lib/ai/client.ts, quota.ts, untrusted.ts to confirm generateText's failure modes and that decideQuota is unimplemented", "result": "passed", "evidence": "quota.ts line 39: `throw new Error(\"decideQuota is not implemented yet\")` against the SH-01-AC6 TODO comment; client.ts calls decideQuota before any provider call, so every generateText call fails closed today"},
{"check": "Read supabase/migrations/20261017000000 (profiles/ai_usage), 20261018000000 (courses/course_lecturers/consultation_slots/bookings, booking_status enum, browse_available_slots' SGT date-filter pattern), 20261020140000 (admin_courses RPC/security conventions)", "result": "passed", "evidence": "R2's RPC shape and SGT date handling mirror browse_available_slots; R4/R8 security posture mirrors admin_list_courses' security-definer/search_path=''/current_app_role()='admin'/revoke-then-grant-to-authenticated pattern"},
{"check": "Read ADM-01 and ADM-02 specs for house style (bullet ACs, document control digests, security-definer RPC conventions)", "result": "passed", "evidence": "ADM-04's ACs use the required `- **ADM-04-ACn** (R#; verification; mocked/live) text` bullet form per the coordinator's instruction, matching ADM-01's style rather than ADM-02's table form"},
{"check": "git hash-object on the new spec", "result": "passed", "evidence": "28787d7b7e0bf4f438bbc96610d9c5889909a0c3"},
{"check": "wc -l on the new spec", "result": "passed", "evidence": "282 lines, at the upper edge of the requested ~220-280 line target"},
{"check": "git status shows only the two allowed new files touched by this agent", "result": "passed", "evidence": "`git status --porcelain` shows only the two new untracked files under workflow/specs/admin/ and workflow/handoffs/adm-04/"},
{"check": "npm run check:spec / build / tests / migration creation", "result": "not-run", "evidence": "out of role scope; no application code, test, CI, or migration file touched"}
],
"unresolvedIssues": ["decideQuota (src/lib/ai/quota.ts) is unimplemented, which blocks implementation (not approval) of ADM-04-R5..R8 until SH-01-AC6 passes; ADM-04-R1..R4 (the report) have no such dependency", "RPC/jsonb shape, the starts_at-vs-created_at counting anchor, zero-fill-vs-omit convention, and the 1,200-character output bound are all proposed and need owner review", "the local not_configured guard for a missing SoC LLM key is proposed as a change confined to ADM-04's own feature code, not to the shared src/lib/ai/client.ts module -- flagged for owner/developer confirmation before implementation"]
}
<!-- HANDOFF:END -->

- Date: 2026-10-20
- Task ID: TASK-ADM-04 (GitHub issue #20)
- Requirement / acceptance-criterion IDs: ADM-04-R1..R9 (all new), ADM-04-AC1..AC14 (all new)
- Specification: `workflow/specs/admin/ADM-04-booking-reports-and-ai-summary.md`
- Specification version or commit: content digest `28787d7b7e0bf4f438bbc96610d9c5889909a0c3`
  (`git hash-object`); first draft, no prior digest invalidated.
- Specification status and human approver: `draft`; **not yet approved** — no human approval
  evidence was supplied for this round.
- Relevant context files this round: `workflow/specs/PRODUCT-SPEC.md`,
  `workflow/specs/shared/SH-01-foundation.md`, `workflow/specs/admin/ADM-01-manage-accounts.md`,
  `workflow/specs/admin/ADM-02-manage-courses-and-assignments.md`, `src/lib/ai/client.ts`,
  `src/lib/ai/quota.ts`, `src/lib/ai/untrusted.ts`,
  `supabase/migrations/20261017000000_initial_schema.sql`,
  `supabase/migrations/20261018000000_student_browse_available_slots.sql`,
  `supabase/migrations/20261018020000_student_request_consultation.sql`,
  `supabase/migrations/20261020140000_admin_courses.sql`.
- Allowed edit scope this round: `workflow/specs/admin/ADM-04-booking-reports-and-ai-summary.md`
  and `workflow/handoffs/adm-04/2026-10-20-adm-04-requirements-architect.md`. Nothing else.

## Decisions and assumptions

Owner-confirmed scope (Johannsen, relayed by the coordinator, 2026-10-20): `/admin/reports` page,
preset (7/30-day) or custom (≤92-day) SGT period; one new admin-only aggregate RPC covering counts
by status/course/lecturer/day; counts only, never student identity/topic/questions/rejection
reasons; a "Summarise this period" button generating a plain-text advisory summary via
`generateText` (`feature: "admin_activity_summary"`) built only from that RPC's aggregates (current
plus the preceding equal-length period); course/lecturer names wrapped as untrusted despite being
staff data; output plain-text, length-bounded, not persisted; quota via `decideQuota` (blocked,
owner's own pending TODO against `SH-01-AC6`) gates only the AI half, not the report half; missing
SoC LLM key shows "AI summary unavailable" rather than erroring; no new tables.

Proposed, flagged for owner review (not blocking draft status): the exact RPC/jsonb shape; counting
by slot `starts_at` SGT day (per instruction) versus booking `created_at`, which may suit
non-terminal statuses better; zero-filled `byStatus` vs. omitted zero-count `byCourse`/`byLecturer`
rows; the 1,200-character output bound and truncation marker; a local `not_configured` guard inside
ADM-04's own feature code (not a change to the shared `src/lib/ai/client.ts`) for a missing key.

## Changes

- `workflow/specs/admin/ADM-04-booking-reports-and-ai-summary.md`: new spec, `status: draft`,
  covering both the booking-report and AI-activity-summary halves of `TASK-ADM-04` in one document
  (one LLM feature per role, per the brief). Defines `ADM-04-R1`–`R9`, a single proposed RPC
  `admin_get_booking_report`, two proposed Server Actions (`getBookingReport`,
  `generateActivitySummary`), the AI threat model (prompt injection via admin-entered course/
  lecturer names, data-minimization), and `ADM-04-AC1`–`AC14` in the required bullet form. Records
  the `decideQuota`/`SH-01-AC6` dependency as blocking only `R5`–`R8`'s implementation, not this
  spec's approval.
- `workflow/handoffs/adm-04/2026-10-20-adm-04-requirements-architect.md`: this handoff.

## Evidence

| Command or check                                                                | Result  | Evidence                                                                              |
| ------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------- |
| `git hash-object workflow/specs/admin/ADM-04-booking-reports-and-ai-summary.md` | passed  | `28787d7b7e0bf4f438bbc96610d9c5889909a0c3`                                            |
| `wc -l` on the new spec                                                         | passed  | 282 lines                                                                             |
| Frontmatter `status:` field                                                     | passed  | `draft`                                                                               |
| `git status --porcelain`                                                        | passed  | only the two new files listed above                                                   |
| Confirmed `decideQuota` is unimplemented                                        | passed  | `src/lib/ai/quota.ts` line 39 throws; cited in Dependencies, `R8`, and Open questions |
| Application build/test/lint/CI/migration                                        | not-run | out of role scope; none touched                                                       |

## Changes outside the owner's area

None by this agent. No application code, migration, test, or CI file was touched.

## Findings and open questions

| #   | Severity | Finding                                                                                                      | Status                                          |
| --- | -------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| 1   | Medium   | `decideQuota` (`src/lib/ai/quota.ts`) is unimplemented; blocks `ADM-04-R5`–`R8` implementation/merge only.   | Open, non-blocking for this spec's draft status |
| 2   | Info     | RPC/jsonb shape, counting anchor, zero-fill convention, and output bound are proposed, pending owner review. | Open, non-blocking                              |
| 3   | Info     | The `not_configured` guard is proposed as ADM-04-local code, not a shared `src/lib/ai/client.ts` change.     | Open, flagged for developer confirmation        |

## Next action

Coordinator/owner: review the proposed RPC shape, counting anchor, and output bound; confirm or
revise before this spec moves `draft` → `reviewed`/`approved`. Once approved, the developer role
can implement `R1`–`R4` (the report) immediately; `R5`–`R8` (the AI summary) must wait until
`decideQuota`/`SH-01-AC6` is implemented and passing, per the dependency recorded in the spec.

Handoff evidence: workflow/handoffs/adm-04/2026-10-20-adm-04-requirements-architect.md
