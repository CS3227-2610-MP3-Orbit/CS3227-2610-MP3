# ADM-04 administrator booking reports and AI activity summary

Evidence for this workstream lives on the still-open branch `origin/feature/admin-reports` (PR #37);
read via `git show origin/feature/admin-reports:<path>` and `git log origin/feature/admin-reports`
from this worktree, since the branch is not yet merged into `develop`.

## Specification and owner decisions a–d — 2026-10-20/2026-10-21

- Requested: an administrator Reports page with booking counts for a chosen period, and an optional
  AI summary of those counts (`ADM-04`, GitHub issue #20).
- `requirements_architect` drafted `workflow/specs/admin/ADM-04-booking-reports-and-ai-summary.md`
  against `PRODUCT-SPEC.md`, `SH-01` (AI gateway/quota), and `ADM-01`/`ADM-02` (RPC/security house
  style); scope confirmed by Johannsen via the coordinator on 2026-10-20.
- On 2026-10-21, Johannsen approved the spec with four owner decisions, recorded verbatim in the
  spec's "Document control" ("lets do a, b,c,d approve"): (a) count bookings by the slot's
  `starts_at`, not the booking's `created_at`; (b) zero-fill `byDay` and `byStatus` for every day/
  status in range, but `byCourse`/`byLecturer` list only rows with at least one booking; (c) cap the
  AI summary output at 1,200 characters; (d) a local `not_configured` guard runs before any provider
  call when no AI key is configured. This covered `R1`–`R10`/`AC1`–`AC15`.
- The spec also records that the shared AI quota dependency (`claim_ai_attempt`, one 100-successful-
  response SGT-daily capacity) was already resolved on `develop` by STU-05/PR #34.

Generated summary awaiting independent human verification.

## Quota allowlist gap found while reviewing Jordan's PR #33 — 2026-10-21

- While reviewing Jordan's "Implement lecturer AI consultation briefings" (PR #33), Johannsen found
  that `claim_ai_attempt`'s feature allowlist admitted only `student.improve-request`, so
  `lecturer.ai-briefing` would always resolve to `unavailable` before any LLM call — the briefing
  button would never work as shipped.
- Decision: approve #33 anyway with an explanatory review comment, and fix the allowlist on ADM-04's
  side rather than add a second competing migration. Johannsen's PR #33 review (commit `2ce7d05`,
  state `APPROVED`): "`claim_ai_attempt` from #34 only admits `student.improve-request`, so
  `lecturer.ai-briefing` gets `unavailable` before the LLM is called. I'm fixing this on my side. The
  ADM-04 (admin reports) migration re-creates `claim_ai_attempt` to admit all three features
  (student, admin, lecturer) on the same shared 100/day quota, with a pgTAP test for each. ... Until
  ADM-04 merges, briefings will show the 'temporarily unavailable' message."
- Fix landed on `feature/admin-reports`: `R10`/`AC15` added to the ADM-04 spec on 2026-10-21, re-
  creating `claim_ai_attempt` verbatim except the allowlist now admits `student.improve-request`,
  `admin.activity-summary`, and `lecturer.ai-briefing` on the same shared count, advisory lock, and
  in-flight guard. Commit `9eb2e7f` "Admit the lecturer AI briefing in the shared AI quota
  allowlist." A new pgTAP suite (`supabase/tests/admin_booking_reports.test.sql`) covers the
  allowlist and the shared limit for all three features inside a rolled-back transaction, plus
  direct-RPC refusal checks.
- Related seed collision also found during the same review: Jordan's #33 seed data ("Demo Student
  Two") reused a protected admin's UUID (`12000000-0000-4000-8000-000000000002`). Jordan fixed it by
  moving the demo-admin seed IDs to the `14000000-…` prefix and updating the matching test fixture
  (commit `2ce7d05`, "Fix seeded admin account UUID collision").

Generated summary awaiting independent human verification.

## Implementation (PR #37, open) — 2026-10-21

- Built `/admin/reports`: last 7/30 days or a custom range up to 92 days; counts by status, course,
  lecturer, and day; a "Summarise this period" AI comparison against the preceding period, labelled
  "AI-generated — advisory," capped at 1,200 characters, never stored, immediate "unavailable" with
  no call when no AI key is configured.
- New append-only migration `supabase/migrations/20261021100000_admin_booking_reports.sql`:
  `admin_get_booking_report` (`security definer`, `search_path = ''`, admin-only, 92-day bound,
  execute granted to `authenticated` only) plus the re-created `claim_ai_attempt` described above.
  Privacy: the report and the prompt contain only counts and course/lecturer names — never student
  names, topics, questions, or rejection reasons — and names are wrapped with `wrapUntrusted`.
- Developer handoff (`workflow/handoffs/adm-04/2026-10-21-adm-04-developer.md`) self-reported one
  process violation: ran `npx supabase status -o json` directly once while sanity-checking the stack,
  printing the local stack's `ANON_KEY`/`SECRET_KEY`/`SERVICE_ROLE_KEY`/`JWT_SECRET` to its own tool
  output. These are local-only disposable dev-stack keys, never logged/committed/sent elsewhere, but
  the explicit "never print any key" instruction was still broken; every later credential load used
  the mandated silent pipe. Left open for the owner/coordinator to decide on local-stack key
  rotation.
- Verification recorded in the PR #37 body (local): `npm run verify -- --profile=app` and
  `--profile=database` both passed (all steps); pgTAP 196 passed across 12 files after the allowlist
  amendment; 212 unit tests (38 new); spec traceability 0 errors, every `AC1`–`AC15` covered by a
  real test; ADM-04 integration 7/7; ADM-01/ADM-02/SH-06 regression 26/26, 12/12, 11/11; E2E admin
  15/15 (including two new reports specs). Not run: a live AI summary call against a real key (no
  key available locally), and the student-request-concurrency suite (needs its own disposable
  stack).
- Status: PR #37 is **open**. The PR body explicitly requires it to merge before the #35 release,
  otherwise production would ship #33's briefing button while it still returns "unavailable."

Generated summary awaiting independent human verification.

## Completed-booking count bug fix (R11/AC16) — 2026-10-21

- Bug: LEC-03 derives a booking's "completed" state from the slot's end time without writing that
  state back to the row, so `byStatus`, which counted from the stored `status` column alone, always
  reported 0 completed bookings regardless of how many had actually ended.
- Johannsen approved the fix spec-first: `ADM-04-R11`/`AC16` added and owner-approved 2026-10-21
  ("also fix the bug"), recorded in the spec's change log as "`byStatus` derives `completed` for
  ended `approved` bookings, matching LEC-03-R4; stored status alone always reported 0 completed."
- Order followed, per the coordinator addendum in the developer handoff: spec (R11/AC16, owner-
  approved) → a failing test first (`[ADM-04-AC16]`, failed with a completed-count delta of 0
  against an expected 1) → a new append-only migration
  `20261021110000_admin_booking_reports_derived_completion.sql` using `now()` inside the function
  (so it stays `STABLE` rather than needing `VOLATILE`) → recheck.
- Results after the fix: admin-reports integration 8/8; unit tests 230/230; pgTAP pass; Prettier,
  lint, typecheck, and `check:spec` all pass; `supabase db lint` adds no new warning for
  `admin_get_booking_report` (pre-existing LEC-03 warnings unchanged). Commit `9db775e` "Count ended
  approved bookings as completed in the admin report." Local apply used `psql` directly against the
  shared stack's existing `create or replace` function (migration history not repaired locally,
  since the shared stack already holds other branches' migrations); CI applies the migration through
  a full `db reset`.
- Independent `tester_verifier`/`security_reviewer` review of ADM-04 was started on 2026-10-21; it
  had not produced recorded results at the time of this log and is **in progress**, not complete.

Generated summary awaiting independent human verification.
