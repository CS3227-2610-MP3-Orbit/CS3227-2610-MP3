# STU-04 manage-my-bookings implementation plan

Draft plan for `workflow/specs/student/STU-04-manage-my-bookings.md`. It is not implementation
authorization. Team product decisions are recorded; human review of the exact revised draft remains required.

## Baseline and dependencies

Current branch baseline: `378e421`; existing STU-02 request implementation and its two append-only
migrations are evidence of existing schema/functions, not permission to alter them. Reuse the trusted
Student session boundary, narrow database RPC pattern, status enum, and available-slot predicate. Do not
alter STU-02 history/recovery behaviour without a separate approved impact review.

## Bounded tasks after approval

| Task      | Agent                               | Requirements/criteria   | Work and evidence                                                                                                                                                 | Depends on |
| --------- | ----------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| STU-04-P0 | Human + requirements architect      | R1–R10, AC1–AC12        | Review exact revised digest/proposed API details; approve exact digest; freeze file ownership                                                                     | This draft |
| STU-04-P1 | tester_verifier                     | AC1–AC12                | Add independently owned acceptance/security/concurrency tests and verified role fixtures; record baseline failures                                                | P0         |
| STU-04-P2 | developer                           | R1–R7/R9/R10            | Append a migration with narrow list/detail/edit/cancel RPCs, grants/RLS and conditional owner/state/time/version rules; add Student server/UI code and unit tests | P1         |
| STU-04-P3 | developer                           | R8                      | Add accessible list/detail/edit/cancel views and safe loading/empty/error/conflict/success states                                                                 | P2         |
| STU-04-P4 | tester_verifier + security_reviewer | AC1–AC12                | Independently inspect the frozen implementation commit; execute tests with validated fixtures; report findings/limitations                                        | P3         |
| STU-04-P5 | developer, then relevant verifier   | Confirmed findings only | At most two fix/recheck rounds; return missing requirement to human/spec review                                                                                   | P4         |

## Proposed file ownership after approval

- Developer: `src/app/student/bookings/**`, `src/features/student/bookings/manage-*`, bounded updates
  to Student navigation only if approved, one new `supabase/migrations/<timestamp>_student_manage_bookings.sql`,
  and `workflow/handoffs/stu-04/developer.md`.
- Tester: `src/features/student/bookings/manage-*.test.ts`,
  `supabase/tests/student_manage_bookings.test.sql`,
  `tests/integration/student-manage-bookings*.test.ts`,
  `tests/e2e/student-manage-bookings.spec.ts`, and `workflow/handoffs/stu-04/tester.md`.
- Security reviewer: read-only report to coordinator; no repository writes.
- Requirements architect: this spec, this plan, review challenge, current handoff, and factual Joseph log.
- Coordinator: assigns exact migration timestamp/overlap sequence, records review report, and updates any
  index only if separately assigned.

Shared migrations/authz/RLS/grants and Student navigation require independent teammate/CODEOWNER review.
No CI, deployment, shared auth helper, existing migration, merge, or production access is in scope.

## Verification and handoff

Run `npm run check:spec`, lint, typecheck, relevant unit/pgTAP/integration/E2E checks, migration apply
against a disposable local database, direct table/RPC authorization tests, real two-connection races,
and manual 200% zoom/cross-browser accessibility review. Report actual results; do not substitute mocks
for database ownership/time/concurrency invariants. Each handoff identifies the exact spec digest,
implementation commit/diff, fixture validation, unexecuted checks, and remaining human gates.
