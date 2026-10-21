# Handoff: TASK-ADM-02 / ADM-02-R1..R9, AC1..AC16 — requirements_architect → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-ADM-02",
"requirementIds": ["ADM-02-R1", "ADM-02-R2", "ADM-02-R3", "ADM-02-R4", "ADM-02-R5", "ADM-02-R6", "ADM-02-R7", "ADM-02-R8", "ADM-02-R9"],
"status": "incomplete",
"changedFiles": ["workflow/specs/admin/ADM-02-manage-courses-and-assignments.md", "workflow/handoffs/adm-02/2026-10-20-adm-02-requirements-architect.md"],
"verification": [
{"check": "Read PRODUCT-SPEC.md Administrator experience section", "result": "passed", "evidence": "digest d9f63461aeb368ffd811ec50e5a595e0c6047ca7, matches digest ADM-01 cited, no drift"},
{"check": "Read SH-04 (team draft) and identified which requirements ADM-02 adopts/simplifies/defers", "result": "passed", "evidence": "'Relationship to SH-04' section in the spec: adopts R1(partial)/R2/R3/R5/R7, simplifies R1/R6 bounds and capacity, defers R4 to Lecturer specs"},
{"check": "Read SH-02, SH-03, SH-05 for the browse-visibility and mutation-ownership boundary ADM-02 must not redefine", "result": "passed", "evidence": "R3/R5 cite SH-02-R3 derived eligibility and the existing browse_available_slots courses.is_active filter rather than inventing new read logic"},
{"check": "Read supabase/migrations/20261018000000 (courses/course_lecturers schema, existing unique partial index and endpoint trigger)", "result": "passed", "evidence": "confirmed course_lecturers_current_pair_idx already exists (used for R4/AC11 concurrency) and no existing unique index on course code (used for R1's new migration note)"},
{"check": "Read 20261019000000 and 20261020000000 (Jordan's lecturer policies and the deactivation-notice trigger) to confirm R5's removal path fires it correctly and course deactivation does not", "result": "passed", "evidence": "trigger is 'after update of is_active' on course_lecturers/consultation_slots only, not courses; recorded as a non-blocking open item in R3 and 'Open questions'"},
{"check": "Read ADM-01 spec and its migrations (20261020100000, 20261020110000) for the house RPC/security style", "result": "passed", "evidence": "ADM-02's RPCs mirror admin_set_role/admin_list_accounts: security definer, set search_path='', current_app_role()='admin' check, revoke/grant-to-authenticated-only pattern"},
{"check": "git hash-object on the new spec", "result": "passed", "evidence": "6259abc9d5c929bb426f4474d6e3ccffff59daf6"},
{"check": "git status shows only the two allowed files touched by this agent", "result": "passed", "evidence": "`git status --porcelain` shows only `?? workflow/specs/admin/ADM-02-manage-courses-and-assignments.md` before this handoff was added; no app code, test, migration, or CI file touched"},
{"check": "npm run check:spec / build / tests / migration creation", "result": "not-run", "evidence": "out of role scope; no application code, tests, CI, or migration file touched by this agent"}
],
"unresolvedIssues": ["Owner has not yet reviewed the proposed code bounds/normalization (R1), the insert-new-row re-assignment choice (R6), or the admin_list_courses read shape (R7) — none block drafting, all tagged proposed", "Course-deactivation/notification-trigger parity gap is open, non-blocking, and out of the owner-confirmed scope", "Lecturer role-change interaction with ADM-01's admin_set_role is open, non-blocking, deferred"]
}
<!-- HANDOFF:END -->

- Date: 2026-10-20
- Task ID: TASK-ADM-02 (GitHub issue #19)
- Requirement / acceptance-criterion IDs: ADM-02-R1..R9, ADM-02-AC1..AC16 (all new)
- Specification: `workflow/specs/admin/ADM-02-manage-courses-and-assignments.md`
- Specification version or commit: content digest `6259abc9d5c929bb426f4474d6e3ccffff59daf6`
  (`git hash-object`); first draft, no prior digest invalidated.
- Specification status and human approver: `draft`; **not yet approved** — human approval
  evidence was not supplied for this round, matching the assignment's stated state.
- Relevant context files this round: `workflow/specs/PRODUCT-SPEC.md`,
  `workflow/specs/shared/SH-04-course-and-assignment-management.md`,
  `workflow/specs/shared/SH-02-courses-and-lecturer-assignments.md`,
  `workflow/specs/shared/SH-03-slots-bookings-and-availability.md`,
  `workflow/specs/shared/SH-05-slot-and-booking-mutations.md`,
  `workflow/specs/shared/SH-01-foundation.md`,
  `workflow/specs/admin/ADM-01-manage-accounts.md`,
  `supabase/migrations/20261018000000_student_browse_available_slots.sql`,
  `supabase/migrations/20261019000000_lecturer_consultation_availability.sql`,
  `supabase/migrations/20261020000000_lecturer_consultation_completion.sql`,
  `supabase/migrations/20261020100000_admin_account_management.sql`,
  `supabase/migrations/20261020110000_admin_list_accounts.sql`.
- Allowed edit scope this round: `workflow/specs/admin/ADM-02-manage-courses-and-assignments.md`
  and `workflow/handoffs/adm-02/2026-10-20-adm-02-requirements-architect.md`. Nothing else.

## Decisions and assumptions

Owner-confirmed scope (Johannsen, relayed by the coordinator, 2026-10-20): admins create courses
(code+name), edit code/name, deactivate/reactivate; assign an active lecturer-role account to a
course and remove (end) an assignment; list/search/filter courses with their current lecturers.
No AI. Same posture as `ADM-01` — `requireRole("admin")` first on every action, admin-only
security-definer RPCs (no direct table grants), zod `.strict()` validation, generic/typed errors,
UI under `/admin/courses`.

Proposed by this agent, pending owner review (none blocking): code normalized to
`upper(trim(code))`, bounds 2–20 chars (`A-Z0-9/-_`), name 1–200 trimmed chars; code uniqueness
spans active **and** inactive courses; re-assignment after removal inserts a new
`course_lecturers` row rather than reactivating the ended one (justified against the existing
partial unique index, which only constrains active rows per pair); `admin_assign_lecturer` returns
specific refusal reasons (`course_inactive`, `lecturer_wrong_role`, etc.) rather than a
non-enumerating one, because the caller is always an admin who already has full account visibility
under `ADM-01-R2`.

## Changes

- `workflow/specs/admin/ADM-02-manage-courses-and-assignments.md`: new file. Frontmatter
  `status: draft`. Defines `ADM-02-R1`–`R9`, a "Relationship to SH-04" section naming exactly
  which SH-04 requirements are adopted/simplified/deferred, UI/API/data-model/security sections,
  an edge-case table, and `ADM-02-AC1`–`AC16` in the exact bullet form
  `- **ADM-02-ACn** (Rx; method; mocked/live) Given/when/then`.
- This handoff: new file.

## Evidence

| Command or check                                                                                | Result  | Evidence                                                                                               |
| ----------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `git hash-object workflow/specs/admin/ADM-02-manage-courses-and-assignments.md`                 | passed  | `6259abc9d5c929bb426f4474d6e3ccffff59daf6`                                                             |
| Frontmatter `status:` field                                                                     | passed  | `draft`                                                                                                |
| `git status --porcelain` (scope check)                                                          | passed  | only the two allowed files touched by this agent                                                       |
| Inspection: `course_lecturers_current_pair_idx` exists (no new index needed for R4/AC11)        | passed  | confirmed in `20261018000000_student_browse_available_slots.sql`                                       |
| Inspection: deactivation trigger fires on `course_lecturers.is_active`, not `courses.is_active` | passed  | confirmed in `20261020000000_lecturer_consultation_completion.sql`, recorded as non-blocking open item |
| Application build/test/lint/CI/migration                                                        | not-run | out of role scope; none touched                                                                        |

## Changes outside the owner's area

None by this agent. No application code, test, migration, or CI file was created or edited; the
spec only _describes_ a future append-only migration and new RPCs for the developer role to
implement.

## Findings and open questions

| #   | Severity | Finding                                                                                                                                                                                                                         | Status                                |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| 1   | Info     | Proposed code bounds/normalization (`R1`), re-assignment mechanism (`R6`), and `admin_list_courses` shape (`R7`) await owner review.                                                                                            | Open, non-blocking                    |
| 2   | Info     | Course deactivation does not fire the existing lecturer/slot deactivation-notice trigger; no notification is required by the owner-confirmed scope.                                                                             | Open, non-blocking                    |
| 3   | Info     | A lecturer's role changing away from `lecturer` via `ADM-01`'s `admin_set_role` leaves the `course_lecturers` row stored as-is but immediately ineligible through existing derived-eligibility checks; no ADM-02 action needed. | Open, non-blocking                    |
| 4   | Info     | Retention duration, post-use code rename beyond ordinary edit, and physical deletion of a never-used course remain open `SH-04` shared-spec items, outside this task's scope.                                                   | Open, non-blocking, deferred to SH-04 |

## Next action

Human (Johannsen) reviews and approves/requests changes to the draft spec, specifically the three
proposed-tag items in "Decisions and assumptions" above; once approved, the coordinator may hand
this to the developer role to add the append-only migration (RPCs + course-code unique index) and
the `/admin/courses` UI, then to tester_verifier/security_reviewer per the standard workflow.

Handoff evidence: workflow/handoffs/adm-02/2026-10-20-adm-02-requirements-architect.md
