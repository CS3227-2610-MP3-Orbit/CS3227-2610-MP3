# ADM-03 guidelines and announcements

Evidence for this workstream lives on the still-open branch `origin/feature/admin-announcements`
(PR #38); read via `git show origin/feature/admin-announcements:<path>` and
`git log origin/feature/admin-announcements` from this worktree, since the branch is not yet merged
into `develop`.

## Gap analysis and specification approval — 2026-10-21

- A gap analysis against `PRODUCT-SPEC.md` found that administrator-published guidelines and
  announcements — promised to Administrators ("Publish and edit guidelines and announcements") and
  to Students ("Read current administrator-published consultation guidelines and announcements") —
  had no code, migration, or spec yet, tracked only by GitHub issues #25 (admin, marked "lower
  priority; cut if short on time") and #9 (student).
- `requirements_architect` drafted `workflow/specs/admin/ADM-03-guidelines-and-announcements.md`
  against `PRODUCT-SPEC.md`, issues #25/#9, and the existing `ADM-02`/`ADM-04`/`SH-07` code and
  conventions (append-only migration, admin-only RPC/security posture, archive-over-delete via
  `is_active`, `Badge`/`Dialog`/`EmptyState`/`NAV_GROUPS` UI conventions).
- Johannsen approved the spec on 2026-10-21 with five owner decisions, recorded verbatim in the
  spec's "Document control" ("go" on the five recommendations): (1) `title` 1–120 and `body` 1–2,000
  trimmed characters; (2) a new item starts unpublished and must be explicitly published; (3) direct
  RLS-protected table reads for both the admin list and the reader projection, no new read RPC;
  (4) the reader card appears on both the Student and the Lecturer dashboards; (5) a
  "Communications" sidebar group with a `Megaphone` "Announcements" item. This covered `R1`–`R10`/
  `AC1`–`AC15`.

Generated summary awaiting independent human verification.

## Implementation, environment bug, and CI fix (PR #38, open) — 2026-10-21

- Built `/admin/announcements` under a new "Communications" sidebar group: admins create, edit,
  publish, and unpublish guidelines/announcements (new items start as drafts; nothing is ever
  deleted). Students and lecturers see published items in a card on their dashboard. New table
  `public.announcements` with row-level security (admins read everything including drafts; active
  students/lecturers read only published items; signed-out `anon` has no access); all writes go
  through three admin-only `security definer` functions
  (`admin_create_announcement`/`admin_update_announcement`/`admin_set_announcement_published`), each
  checking the caller's role and running with `search_path = ''`; `execute` granted to `authenticated`
  only, no direct table grants.
- Environment problem found and fixed: the developer agent's session was interrupted by a connection/
  network error and stopped by the coordinator before it committed. Its reported build and e2e
  failures (a Turbopack build refusal, and Base UI dialog backdrops that never released pointer
  events in the admin e2e specs — including pre-existing, unmodified specs) were root-caused to the
  coordinator's own shortcut: this worktree's `node_modules` was a symlink into another worktree's
  `node_modules`, which Turbopack's hermetic workspace-root check refuses to resolve `next` through.
  The coordinator replaced the symlink with a real `npm ci` in this worktree and re-ran every check;
  all of the developer's reported failures disappeared, confirming they were test-environment
  artifacts, not defects in the ADM-03 code (`workflow/handoffs/adm-03/2026-10-21-adm-03-developer.md`).
- CI problem found and fixed: the root `playwright.config.ts` ignored admin specs by exact filename
  (`admin-accounts.spec.ts`, `admin-courses.spec.ts`), so the new `admin-announcements.spec.ts` was
  not covered by that list and also ran in the student end-to-end CI job, against the wrong Supabase
  stack. Fixed by widening the ignore pattern to `**/admin-*.spec.ts`, mirroring the admin config's
  own `testMatch` (commit `1f588fe`, "Run admin browser specs only in the admin Playwright config").
- Verification recorded in the PR #38 body (local): format/lint/types/unit/spec/colours/secrets/
  build 10/10; database lint and 30 new ADM-03 pgTAP checks pass; announcements integration 11/11;
  courses/reports/change-password regression 12/12, 7/7, 11/11; browser tests (admin pages,
  dashboards, announcements) 26/26; accounts integration 25/26 — the one failure
  (`[ADM-01-AC14]`) is local-only, because #33's seed-ID fix changed the seed admin IDs and this
  local database was not reset; CI resets its database, so this is not expected to recur there.
- Status: PR #38 is **open**, stacked on #36 (UI identity) and #37 (ADM-04); its stated merge order
  is #36, then #37, then #38, then the #35 release. It still needs teammate review of the shared
  migration, the CI change, and of the one-card dashboard additions to Joseph's and Jordan's pages.
- Independent `tester_verifier`/`security_reviewer` review of ADM-03 was started on 2026-10-21; it
  had not produced recorded results at the time of this log and is **in progress**, not complete.

Generated summary awaiting independent human verification.
