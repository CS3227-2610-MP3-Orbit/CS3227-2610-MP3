# STU-04 CI E2E selector correction

Outcome: incomplete
Task ID: STU-04-CI-E2E-SELECTORS
Requirement IDs: STU-04-AC1, STU-04-AC3, STU-04-AC12

## Reviewed evidence

- GitHub Actions pull-request run `39190847546`, job `117863079086`.
- GitHub Actions push run `39190760309`, job `117862802372`.
- Both reported the same assertion mismatch in
  `tests/e2e/student-manage-bookings.spec.ts`: the test searched for standalone `pending` and
  `approved` text while the booking list visibly renders `Status: pending` and `Status: approved`.

## Changed files

- `tests/e2e/student-manage-bookings.spec.ts`: changed only the two incorrect exact-text selectors
  to match the complete visible status labels. The test still requires both booking states to be
  displayed and retains its hostile-text non-execution assertion.
- `workflow/handoffs/stu-04/tester-ci-e2e.md`: records this correction and its evidence.

## Checks run and actual results

- `npx prettier --check tests/e2e/student-manage-bookings.spec.ts workflow/handoffs/stu-04/tester-ci-e2e.md`:
  passed; both files use Prettier formatting.
- `git diff --check`: passed with no whitespace errors.
- `npm run typecheck`: passed; Next.js route generation and `tsc --noEmit` completed.
- Static rendering check: `src/app/student/bookings/page.tsx` renders `Status: {b.status}` and the
  updated exact selectors match the resulting visible labels.

## Checks not run and reasons

- GitHub-hosted E2E: requires a new pushed commit and Actions run.

## Unresolved issues

- The correction is not considered verified by GitHub Actions until a new hosted run passes.

## Next action

- Coordinator should include this test correction in the branch and rerun GitHub Actions.
