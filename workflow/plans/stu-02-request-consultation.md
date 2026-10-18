# STU-02 request-consultation implementation plan

Draft execution plan for `workflow/specs/student/STU-02-request-consultation.md`; baseline
`668e7435805b3aec1140653b8ea12d14e2380a68`. No implementation authorization or completed tests claimed.

## Dependencies and current state

Reuse active session checks, Supabase session client, Singapore formatter and browse UI. Existing DB
tables and single-active-slot index are foundations, not a request service. Student overlap safety,
idempotency, request lookup/creation/recovery RPCs, form and confirmation remain planned. Relevant
`SH-01/02/03/05` drafts require reconciliation/review for this slice. STU-01 option-cap/filter-test
follow-up is separate; changing browse to add navigation must preserve its contract. Existing pgTAP
fixtures include blank questions and overlapping historical slots, so assess new-constraint compatibility
before applying a migration; do not silently delete fixtures or existing data to make checks pass.

## Bounded tasks

| Task      | Agent                               | Requirements/criteria                          | Work and evidence                                                                                                                                        | Depends on   |
| --------- | ----------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| STU-02-P0 | Human + requirements_architect      | R1–R10, AC1–AC19                               | Resolve proposals; review exact spec digest and creation subset of SH-05; freeze paths                                                                   | Draft packet |
| STU-02-P1 | tester_verifier                     | AC1–AC19                                       | Add non-skipped acceptance, access and concurrency cases against approved contract; record initial failures                                              | P0           |
| STU-02-P2 | developer                           | R2–R6/R8/R9; AC2–AC14/AC16/AC19                | Append migration: safe lookup/request/recovery, restricted grants, atomic owner/slot/overlap checks, history/key protection; actual two-connection races | P1           |
| STU-02-P3 | developer                           | R1/R5–R10; AC1/AC2/AC4/AC8–AC10/AC12/AC14–AC19 | Strict validation/server action, form and browse link, minimal receipt, recovery and literal accessible states; unit checks                              | P2           |
| STU-02-P4 | tester_verifier + security_reviewer | AC1–AC19                                       | Independently test original approved spec against identified implementation commit/diff; report reproductions/results/limitations                        | P3           |
| STU-02-P5 | developer then relevant verifier    | Confirmed findings only                        | At most two fix/recheck rounds; missing requirement returns to spec review; unresolved issues to human                                                   | P4           |

## Proposed exact edit ownership after approval

No paths below are presently authorized for implementation. Coordinator confirms migration timestamp
and assignment before work. No shared auth helper modification is anticipated.

- Developer: `src/app/student/slots/page.tsx` (request link only),
  `src/app/student/slots/[slotId]/request/page.tsx`,
  `src/app/student/slots/[slotId]/request/loading.tsx`,
  `src/app/student/slots/[slotId]/request/actions.ts`,
  `src/app/student/slots/[slotId]/request/request-form.tsx`,
  `src/features/student/bookings/request-validation.ts`,
  `src/features/student/bookings/request-validation.test.ts`,
  `src/features/student/bookings/request-server.ts`,
  `supabase/migrations/20261018020000_student_request_consultation.sql`,
  `workflow/handoffs/stu-02/developer.md`.
- Tester: `src/features/student/bookings/request-verification.test.ts`,
  `supabase/tests/student_request_consultation.test.sql`,
  `tests/integration/student-request-concurrency.test.ts`,
  `tests/e2e/student-request-consultation.spec.ts`,
  `workflow/handoffs/stu-02/tester.md`. If the new concurrency runner needs configuration/package
  changes, return that exact bounded scope to coordinator before writing; do not hide missing runner
  support or substitute mocks for races.
- Security reviewer: read-only; coordinator records report in
  `workflow/reviews/stu-02/security-review.md`.
- Requirements architect: this spec, this plan, `workflow/reviews/stu-02/specification-challenge.md`,
  `workflow/handoffs/stu-02/latest.md`; material changes reset approval.
- Coordinator: `workflow/INDEX.md`, `logs/joseph/README.md`, `logs/joseph/stu-02.md`, current handoff
  consolidation and recorded security report. Sequence all overlapping writes.

Migration/RLS/grant/authorization changes require independent teammate/CODEOWNER review. Existing
migrations, other role UIs, CI and production settings are excluded. No merge, push or deployment.

## Verification and handoff

Run lint, typecheck, unit tests, `check:spec`, workflow checks, relevant local pgTAP and Playwright,
build, secret/sensitive checks as required by repository gates. Inspect grants/RLS and actual direct
RPC denial. Run simultaneous same-slot, same-Student overlap, idempotent-replay and eligibility-change
tests using real separate PostgreSQL connections and synchronized starts; sequential pgTAP alone is
not concurrency evidence. Verify baseline browse/auth regression and fixture/migration compatibility.
Record manual accessibility/browser checks separately from Chromium automation. No live AI evaluation.

Each role records approved digest, requirement IDs, assigned paths, reviewed implementation commit
(or truthful uncommitted diff digest), actual commands/results, findings/fixes and limitations. Human
approval remains separate; no test result or generated handoff grants it.
