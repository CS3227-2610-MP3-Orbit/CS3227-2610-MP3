# ADM-02 courses and lecturer assignments

## Specification and owner approval — 2026-10-20

- Requested: Administrator management of courses and lecturer assignments (`ADM-02`, GitHub issue
  #19), needed to unblock the lecturer/student booking flow (lecturers can only create slots for
  courses they are assigned to).
- `requirements_architect` drafted `workflow/specs/admin/ADM-02-manage-courses-and-assignments.md`
  against `PRODUCT-SPEC.md`, `SH-02`/`SH-03`/`SH-04`/`SH-05` (draft shared specs), `SH-01`, and
  `ADM-01` (house style for the RPC/security posture).
- Owner approval recorded in the spec's "Document control" (Johannsen, 2026-10-20): course codes are
  upper-cased and trimmed, 2–20 characters, unique across active and deactivated courses; course
  names are 1–200 characters; re-assigning a lecturer inserts a new row rather than overwriting
  history; specific refusal kinds for administrators. Owner approval; independent teammate review
  happens on the implementation pull request, per `workflow/policies/approval-gates.md`.

Generated summary awaiting independent human verification.

## Implementation and bug fixes (PR #32) — 2026-10-21

- Built `/admin/courses`: create a course, edit it, deactivate/reactivate it (courses are never
  deleted); assign/remove an active lecturer (removal sets `is_active = false, ended_at = now()`,
  never a delete, so Jordan's existing assignment-ended trigger still fires and keeps slots/bookings);
  re-assigning inserts a new row so history is kept; list/search/filter courses with their current
  lecturers. Six admin-only `security definer` functions (`search_path = ''`,
  `current_app_role() = 'admin'`), no direct table grants. New append-only migration
  `supabase/migrations/20261020140000_admin_courses.sql`.
- Two bugs found during verification and fixed in this PR (recorded in the PR #32 body):
  1. The lecturer picker always showed "No eligible lecturers" because the page passed
     `activeFilter: true` where `listAccounts` validated the URL form `"true"` (a boolean vs. string
     comparison). Found by re-running the browser test independently after a developer agent had
     first reported it as an environment problem.
  2. Browser tests opened the app on `127.0.0.1`, where the Next 16 dev server blocks client scripts
     (the same `allowedDevOrigins` class of issue SH-07 hit) — click-driven forms never actually ran.
     Tests were switched to `localhost`; the password test now waits for each server response.
- Also added: a "Manage courses" link on `/admin/page.tsx`; `ADM-02` integration tests registered in
  the "Accounts and passwords" CI job; `admin-courses.spec.ts` ignored by the student Playwright
  suite (runs in the admin config instead).
- Verification recorded in the PR body (local, fresh database, head `51b4793`): pgTAP, format/lint/
  typecheck/colour check, 141 unit tests, ADM-02 integration 12/12, ADM-01/SH-06 regression 26/26 and
  11/11, E2E admin (accounts, courses, UI shell) 13/13, E2E change password 3/3, spec traceability
  0 errors.
- Review: Joseph — "Looks good!" (commit `dfa37bc`). Merged 2026-10-21, closes #19.
- Independent `tester_verifier`/`security_reviewer` review of ADM-02 was started on 2026-10-21; it
  had not produced recorded results at the time of this log and is **in progress**, not complete.
  No tester/security handoff for ADM-02 exists in `workflow/handoffs/adm-02/` as of this writing.

Generated summary awaiting independent human verification.
