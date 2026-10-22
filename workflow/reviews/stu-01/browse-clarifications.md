# STU-01 browse clarifications: impact, self-review, and follow-up plan

- Task: `STU-01-CLARIFY-FOUR`; requirements architect; 2026-10-18.
- Source: Joseph requested resolving the four immediately preceding recommendations.
- Review type: self-review; no independent review or human approval is claimed.
- Canonical specifications remain `draft`; STU-01 version is `0.3-draft`.
- Latest handoff: `workflow/handoffs/stu-01/latest.md` (maintained by coordinator).

## Specification versions

SHA-256 digests, captured before revision and after formatting:

| Specification                                                     | Before                                                             | After                                                              |
| ----------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `workflow/specs/student/STU-01-browse-available-slots.md`         | `c99db57f5e4cf978b5253cedf8ac16de51bcd6a3bce40583ef092d97e632aa23` | `316c02fa860a1d9c0e32d00e9db9dd04868f5f8466e3dedeab090f47cd4498a8` |
| `workflow/specs/shared/SH-02-courses-and-lecturer-assignments.md` | `d88bd1e8cbac09257fca27aac912bf18f1ebe69d722f42c0e51dbab724d44571` | `17f4965b9d897ea6f6bcf413201fb897651cbc215f7606cdef14736ba78fc754` |
| `workflow/specs/shared/SH-03-slots-bookings-and-availability.md`  | `e860e7a224d68b0b481c31970ace6cc808a5b1a1a4b20208097cd7a338007505` | `1fc85fd9337a037c59e0d893503555ae2ca38abd9ba06dc1e809a86785e60110` |

Prior reported approvals/digests remain preserved in each canonical document. These revised digests
require teammate review; the user's product direction does not authenticate that review.

## Confirmed decisions and impact

| Requirement/criterion                            | Previous ambiguity                                                   | Confirmed resolution                                                                                                         | Impact                                                                                                                                          |
| ------------------------------------------------ | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `SH-02-R6/AC8`, `SH-03-R11/AC30`, `STU-01-R3/R6` | AC8 could require 200 of both option types when only one exceeds 200 | Independently return `min(200, eligible distinct options)` for each type, deterministic ordering                             | SQL aggregation and response limits need follow-up; asymmetric catalogue tests required                                                         |
| `STU-01-AC9`–`AC12`, `SH-03-AC17`                | “Every result matches” permits an always-empty implementation        | Known eligible matching ID must appear; otherwise-eligible nonmatches must be excluded for each filter and combination       | Strengthen database/integration fixtures and assertions; request-argument mocks alone are insufficient                                          |
| `SH-03-R12/AC22`, `STU-01-R3/R5/AC13/AC14`       | Undefined stale cursor and validation location                       | Unsupported version or unavailable anchor at its bound ordering position; no token-age expiry; restart retains valid filters | Existing SQL checks anchor/version; expand controlled change and recovery tests; syntax validation distinguished from trusted anchor validation |
| `SH-02-R6/AC8`, `SH-03-R11`, `STU-01-R3`         | Whether selected filters/page constrain dropdowns                    | Options derive from all available slots before selected filters/page                                                         | Existing SQL already uses independent option queries; add invariance and empty-results tests                                                    |

All four choices are confirmed by the conversation. No new product assumptions or unresolved product
choices were introduced. Existing field allowlists, role checks, no-AI rules, and no-mutation rules
remain binding. A cursor cannot confer authorization or disclose the reason its anchor became hidden.

## Inspected implementation and limits

- `supabase/migrations/20261018000000_student_browse_available_slots.sql`: version/binding and current
  anchor checks exist; no token-age expiry is implemented. Option CTEs omit selected filters/cursor,
  but aggregate without a 200-option limit. Do not edit this existing migration.
- `src/features/student/slots/server.ts`: option arrays have no maximum-length schema constraint.
- `src/features/student/slots/validation.ts` and `validation.test.ts`: syntax checks and valid-filter
  preservation exist; those checks alone cannot prove signed cursor or database availability rules.
- `src/features/student/slots/verification.test.ts`: filter argument forwarding is mocked; it does
  not establish database result inclusion/exclusion.
- `supabase/tests/student_browse_available_slots.test.sql`: lecturer/course assertion counts bad
  rows and can pass with no results; date/combined checks assert counts, not exact matching IDs and
  partial-match exclusions. New criteria are stronger than these existing checks.
- Existing handoff and `workflow/plans/2026-10-17-first-vertical-slice.md` inspected; the latter is an
  announcement proposal and does not govern this browse follow-up.

## Self-review scenarios and disposition

| Scenario                                                                 | Expected outcome                                                                          | Disposition                                                         |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 201 represented courses, 2 lecturers; reverse counts                     | 200/2 options; 2/200 options                                                              | Explicit in AC8; old symmetric-cap wording removed                  |
| Zero, 199, 200, 201 eligible options of each type                        | Exact independent counts, deterministic first entries, no truncation metadata             | Explicit boundary scenarios                                         |
| Filter implementation always returns empty                               | Known matching ID assertion fails for each filter and combination                         | Vacuous success removed                                             |
| Fully matching slot plus three slots differing in only one dimension     | Full match included, all partial matches excluded                                         | Tests AND semantics without relying solely on result counts         |
| Selected date has no matches but other available slots exist             | Empty slot list, unchanged globally eligible dropdowns                                    | Empty selected results distinguished from empty global availability |
| Anchor reserved/deleted/edited/inactive/elapsed or version unsupported   | No partial response; generic restart retains filters                                      | Stale definition and privacy recovery explicit                      |
| Older cursor, anchor still eligible; unrelated slot changes              | Cursor remains valid if signature/binding/version valid                                   | No implicit TTL or frozen-snapshot requirement                      |
| Wrong role, malformed input, stored script/instructions, database outage | Existing authorization, syntax refusal, plain-text/no-AI, typed failure rules still apply | No expansion of permission or AI action                             |

No unresolved ambiguity remains among these four items. This is a self-review, not an independent
security/functional verification. Historical challenge files are preserved unchanged.

## Separate bounded follow-up implementation plan

1. Independent teammate reviews these exact draft digests. Prior approval and historical passing
   results do not establish compliance with materially revised criteria.
2. Developer adds criterion-linked tests before changing behavior: asymmetric/threshold option
   fixtures (`SH-02-AC8`, `SH-03-AC30`), positive and negative filter IDs (`STU-01-AC9`–`AC12`,
   `SH-03-AC17`), cursor-age/anchor changes and safe recovery (`SH-03-AC22`, `STU-01-AC13`), and
   filter/page-independent dropdown fixtures (`SH-02-AC8`).
3. Developer adds a new append-only migration capping distinct option results after deterministic
   sorting; bound server response arrays. Preserve student authorization, exact projections,
   filter independence, no side effects, and existing 20-slot pagination.
4. Tester independently runs targeted unit, database, and browser recovery checks; security reviewer
   inspects RPC authorization, grants, safe cursor errors, unchanged data boundaries, and response
   limits. Coordinator records real results and any fixes in the existing latest handoff/log.

Proposed bounded edit paths for the follow-up (not modified by this specification task):

- Developer: one newly named migration under `supabase/migrations/`; `src/features/student/slots/server.ts`;
  `src/features/student/slots/verification.test.ts`; `supabase/tests/student_browse_available_slots.test.sql`;
  `tests/e2e/student-browse-available-slots.spec.ts`. UI changes are unnecessary unless recovery tests
  establish a concrete gap, in which case coordinator scopes `src/app/student/slots/page.tsx` separately.
- Tester and security reviewer: read-only verification of those paths and original revised specs;
  report findings to coordinator. No overlapping edits or additional delegation.
- Coordinator: existing `workflow/handoffs/stu-01/latest.md`, `logs/joseph/stu-01.md`, workflow index.

Dependencies: local test Supabase and synthetic fixtures, active-Student auth, protected browse RPC,
existing cursor signing, current unit/pgTAP/Playwright setup. No new AI dependency or production access.
Migration changes require independent sensitive-change review before merge. No merge or deployment is
part of this task. Application, database, and browser tests were not run for this document-only task.

## Verification evidence

- Initial check-only Prettier reported STU-01 formatting differences; only that assigned spec was
  formatted. Final formatting check and traceability outcomes are recorded in the coordinator handoff.
- `npm run check:spec`: passed, 16 specs, 150 criteria, 53 covered; draft gaps remain warnings.
  This checks ID references, not adequacy or passing behavior of the revised acceptance tests.
