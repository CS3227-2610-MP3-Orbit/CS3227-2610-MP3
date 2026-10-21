# ADM-02 courses and lecturer assignments

## Specification and approval (20 Oct)

**Prompts**

- "okay lets go to feature 2 as well as another agent working parallel for the ui. referencing a
  management ui right [calendar screenshot] and what other kind of app should i find reference
  for?"
- "looks good approved lets go ahead." (approving ADM-02 and SH-07 with the agent's recommendations)

**What the agent did**

- Started two `requirements-architect` agents in parallel: ADM-02, and the SH-07 design system
  (logged in `sh-07-ui-design-system.md`).
- Drafted `workflow/specs/admin/ADM-02-manage-courses-and-assignments.md` with 9 requirements and 16
  acceptance criteria:
  - create, edit, deactivate and reactivate courses, never delete them;
  - assign an active lecturer to a course and remove the assignment;
  - list, search and filter courses with their current lecturers;
  - admin-only database functions, and no AI.
- Checked the spec against Jordan's code. Removing an assignment sets it inactive rather than
  deleting it, so Jordan's existing "assignment ended" trigger still fires and keeps the slots and
  bookings.

**What I checked or changed**

- I set the scope (lecturers can only create slots for courses they are assigned to, so this
  unblocks the booking flow) and approved the recommended rules: course codes upper-cased and
  trimmed, 2 to 20 characters, unique even among deactivated courses; names 1 to 200 characters;
  re-assigning a lecturer adds a new row so history is kept.

**Outcome**

- Spec approved on 20 Oct. Decisions are in its "Document control".

_Human verification: pending._

## Build, two bugs, and a CI failure, PR #32 (20 to 21 Oct)

**Prompts**

- "continue please" (after a session restart)
- "[screenshot of the PR page] what is 6/9 task?"
- "hows it going #32 ci fail"
- "can you pull everything from dev and merge to our branches"
- "i have repushed, help me to double check" and "are those approved already?"

**What the agent did**

- A `developer` agent built `/admin/courses` in its own Git worktree, so it could run alongside the
  UI work. It added six admin-only `security definer` functions in migration
  `20261020140000_admin_courses.sql`, with no direct table grants.
- Explained that "6/9 tasks" was the pull-request checklist: the unticked items were teammate review
  of the spec, the guides, and the session logs.

**What I checked or changed**

- **Bug 1, caught by an independent re-run.** The lecturer picker always said "No eligible
  lecturers". The developer agent first reported it as an environment problem. When the coordinator
  re-ran the browser test, it traced the cause to the page passing the boolean `true` where the code
  compared against the text `"true"`.
- **Bug 2.** The browser tests opened the app on `127.0.0.1`, where the Next.js 16 dev server blocks
  client scripts. Click-driven forms had never actually run. The tests were switched to
  `localhost`.
- **CI failure on #32.** 28 of Joseph's concurrency tests failed with `duplicate key ...
courses_code_normalized_idx`: the test data reused course codes, which the new unique index now
  refuses. The fix (`0f25d6c`) gave each test run unique codes. GitHub still showed the old failing
  run because I had not pushed the fix yet; after I pushed, CI passed.
- I asked for the latest `develop` to be merged into our branches before review.

**Outcome**

- Local checks recorded in the PR body: database tests, lint, typecheck, 141 unit tests, ADM-02
  integration 12/12, ADM-01 and SH-06 regression 26/26 and 11/11, browser tests 13/13 and 3/3,
  traceability 0 errors.
- Joseph reviewed ("Looks good!"). PR #32 merged on 21 Oct.

_Human verification: pending._

## Independent tester and security review (21 Oct)

**Prompts**

- "[pasted the agent's note that ADM-02 to ADM-04 had stopped after the developer step] do this
  please. also do up logs, github page, site, user guide and developer guide"
- "fix"

**What the agent did**

- Ran a `tester-verifier` and a read-only `security-reviewer` on ADM-02, after it had already been
  merged. Both passed (`workflow/handoffs/adm-02/2026-10-21-adm-02-*.md`, commit `1f1fbb6`).
- The tester found that `admin-courses.spec.ts` left the courses it created in the shared local
  database. A clean-up step was added that deletes them, and their lecturer assignments, after
  the run (`9f71393`).
- One low finding was accepted and left open: the "two admins at once" check for courses is tested
  with sequential calls, not a true two-connection race.

**What I checked or changed**

- The independent reviews happened after the merge, which is not the order the workflow intends.
  I asked for them when the gap was pointed out, and the findings were fixed on the next branch.

**Outcome**

- ADM-02 has a developer, tester and security handoff. The clean-up fix is in PR #38.

_Human verification: pending._
