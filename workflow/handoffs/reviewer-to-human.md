# Handoff: Reviewer → Human

- Date: 2026-10-19
- Specification reference: `workflow/specs/lecturer/LEC-01-availability.md` (approved)
- Developer handoff reference: `workflow/handoffs/developer-to-reviewer.md` (template is unfilled)
- Reviewer: Tester/Security Reviewer Agent

## Findings

| ID | Severity | Finding | File/evidence | Status |
| --- | --- | --- | --- | --- |
| SEC-01 | High | The migration permits administrator UPDATE/DELETE through RLS, but every application action calls `requireRole("lecturer")`; administrator management is therefore not implemented. | `src/app/lecturer/actions.ts:21,40,64`; migration `:85-89` | Open |
| SEC-02 | High | Audit and notification writes are attempted after mutations, but the migration defines no INSERT policies for either table. With the normal authenticated client these writes are expected to be denied; errors are ignored. Audit records and student notifications are therefore not reliable. | `src/app/lecturer/actions.ts:35,58-59,74-75`; migration `:93-96` | Open |
| SEC-03 | High | Overlap detection is a read-then-write check with no database exclusion/transaction/locking strategy. Concurrent creates or edits can persist overlapping slots, failing AC10. | `src/app/lecturer/actions.ts:31-33,52-56`; migration `:26-28` | Open |
| FUNC-01 | High | The Lecturer UI exposes create and delete only; no edit control or edit form exists, so AC4 is not delivered. | `src/app/lecturer/page.tsx:4,15`; `src/app/lecturer/slot-form.tsx` | Open |
| FUNC-02 | Medium | Delete reads active bookings before ownership authorization. RLS may mask the rows, but the action should authorize/locate the owned slot before querying booking data and use a conditional transaction. | `src/app/lecturer/actions.ts:68-71` | Open |
| FUNC-03 | Medium | Mutation success is returned even when audit or notification insertion fails because those errors are ignored; this violates AC11's no-unreported-partial-failure intent. | `src/app/lecturer/actions.ts:35,58-59,74-75` | Open |
| FUNC-04 | Medium | The migration does not define insert/update policies for bookings or insert policies for notifications/audit, and does not provide booking mutation paths. Required integration coverage cannot be exercised from the delivered feature. | migration `:30-42,44-60,91-96` | Open |

## Acceptance criteria coverage

| Criterion | Evidence | Result |
| --- | --- | --- |
| LEC-01-AC1 | Unit test only validates input/deadline; no executable action/database test; migration not applied. | Partial / unverified |
| LEC-01-AC2 | `requireRole("lecturer")` appears in all three actions; direct role tests unavailable. Admin behavior conflicts with requirement. | Partial / fail for admin path |
| LEC-01-AC3 | Lecturer page query filters `lecturer_id`; no RLS execution test. | Partial |
| LEC-01-AC4 | `updateSlot` exists, but no UI invocation/edit control; notifications/audit writes unverified and likely denied. | Fail |
| LEC-01-AC5 | Delete action exists and uses hard delete; notification/audit reliability and admin path unverified. | Partial |
| LEC-01-AC6 | Ownership predicates exist on update/delete; no direct unauthorized integration test. | Partial |
| LEC-01-AC7 | Confirmation is checked for `status = booked`; no booking/RLS fixture or notification test. | Partial |
| LEC-01-AC8 | Unit overlap tests cover adjacent and genuine overlap; concurrent enforcement absent. | Partial / fail under concurrency |
| LEC-01-AC9 | Unit tests cover reversed interval and deadline; malformed/past/authorization/database cases not covered. | Partial |
| LEC-01-AC10 | No transaction, exclusion constraint, or concurrency test. | Fail |
| LEC-01-AC11 | Generic mutation errors exist, but downstream write errors are ignored; no failure test. | Fail |
| LEC-01-AC12 | Only 4 unit tests exist; no integration, database, or E2E coverage. | Fail |

## Test evidence

- `npm.cmd test` — failed to start: `'vitest' is not recognized as an internal or external command`.
- `npm.cmd run check:spec` — exit code 1. Reported `Specs: 2 Criteria: 19 Covered: 7`; LEC-01-AC1, AC2, AC3, AC4, AC5, AC6, AC7, AC10, AC11, and AC12 had no test; also reported pre-existing missing front matter in LEC-02 through LEC-05.
- `npm.cmd run lint` — failed to start: `'eslint' is not recognized as an internal or external command`.
- `npm.cmd run typecheck` — failed to start: `'next' is not recognized as an internal or external command`.
- `git diff --check` — not run in this review session; developer reported it passed.
- Migration application, database tests, and E2E tests — not run; migration was not applied and no database test environment was available.

## Security findings

- No AI/LLM boundary is used by this feature, so prompt-injection testing is not applicable to slot fields. The feature correctly does not call the SoC LLM.
- RLS is present for slot reads and mutations, but policy execution was not run. Admin mutation policy is broader than the application action path and must be reconciled with explicit admin authorization/audit behavior.
- No secrets or environment files were read.

## Unresolved risks and questions

- Whether administrator actions should use separate admin Server Actions or a shared authorized action path remains unimplemented.
- Whether audit and notification writes should be transactionally coupled to slot mutations is unresolved in code.
- The approved spec still contains open questions about exact error mapping and audit detail.

## Recommended next actions

1. Do not approve or merge this implementation yet.
2. Add the missing edit UI and an explicitly authorized administrator path.
3. Add database-safe overlap enforcement and conditional mutation transactions.
4. Add RLS policies and atomic/reliable notification and audit writes with failure handling.
5. Add unit, integration/database, security, concurrency, and E2E tests, then rerun the blocked commands after dependencies are installed.

## Human decision

- Decision: pending / changes requested / approved
- Decided by:
- Decision date:
- Notes:

The reviewer must not mark this handoff human-approved. Only a human records the final decision.
