# Handoff: STU-01 CI test stability

Outcome: complete
Task ID: STU-01-CI-TEST-STABILITY
Requirement IDs: STU-01-AC20

## Changed files

- `supabase/tests/student_browse_available_slots.test.sql`: records the global booking count after test fixtures are inserted and compares the post-browse count to that captured value, rather than assuming the global database contains exactly five bookings.
- `workflow/handoffs/stu-01/ci-test-stability.md`: this evidence record.

## Checks run and actual results

- `npx supabase test db --local supabase/tests/student_browse_available_slots.test.sql`: passed; 22/22 pgTAP assertions, including STU-01-AC20.
- `git diff --check -- supabase/tests/student_browse_available_slots.test.sql`: passed; no whitespace errors in the changed test.

## Checks not run and reasons

- GitHub-hosted CI: not run; this local focused result does not claim hosted-CI execution.
- Full project verification: not run; assignment was limited to the failing STU-01 database test.

## Unresolved issues

- None known for the focused count-stability change. The test still intentionally observes the global booking total, but now verifies only the non-mutation invariant required by STU-01-AC20.

## Next action

- Run the repository CI workflow on the branch and review its independent result.
