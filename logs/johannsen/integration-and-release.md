# Integration, teammate reviews, and release

## Reviewing Joseph's student AI feature (PR #34) — 2026-10-20

- Joseph's "Student ai review" PR implements the Student "Improve my request with AI" feature:
  AI-assisted rewrite of a consultation topic/questions, reviewed separately before the student
  explicitly applies or dismisses it, server-side AI safeguards (authenticated access, server-only
  credentials, input/output limits, timeout handling, plain-text rendering, prompt-injection
  boundaries), and a daily AI quota.
- Joseph's own verification, recorded in the PR body: `npm run verify -- --profile=app` passed;
  `npm run test:db` passed (64 database tests).
- Johannsen reviewed and approved with "lgtm" on commit `5cedc5c`. Merged 2026-10-20.

Generated summary awaiting independent human verification.

## Reviewing Jordan's lecturer AI briefing (PR #33) — 2026-10-21

- Jordan's "Implement lecturer AI consultation briefings" PR implements `LEC-04`: AI-generated
  consultation summary, grouped question themes, and preparation topics for a selected upcoming
  approved consultation, with lecturer authorization/ownership checks, student email excluded from
  the prompt, prompt-injection safeguards, quota/rate-limit handling, and RLS on the new briefings
  table.
- Johannsen's review (commit `2ce7d05`, state `APPROVED`) found and recorded two problems:
  1. The shared AI quota allowlist (`claim_ai_attempt`) admitted only `student.improve-request`, so
     `lecturer.ai-briefing` would always resolve to `unavailable` before any LLM call. Decision:
     approve #33 with an explanatory comment rather than block it, and fix the allowlist on the
     ADM-04 side so the change lives in one migration — see `logs/johannsen/adm-04-reports-and-ai-summary.md`
     for the fix (commit `9eb2e7f`). Until that merges, briefings show "temporarily unavailable."
  2. Jordan's seed data ("Demo Student Two") reused a protected admin's UUID
     (`12000000-0000-4000-8000-000000000002`). Jordan fixed this by moving the demo-admin seed IDs to
     the `14000000-…` prefix (commit `2ce7d05`, "Fix seeded admin account UUID collision").
     Review comment also flagged, non-blocking: the existing briefing test does not exercise
     `generateLecturerBriefing`/mock `generateText`, so it would not have caught the allowlist gap — a
     suggestion for Jordan to add that coverage, not a blocking requirement.
- Johannsen's review also confirmed: colour token usage, authorization scoping, untrusted-data
  wrapping, and plain-text rendering were all correct.
- Merged 2026-10-21 (`b7eb3b4`).

Generated summary awaiting independent human verification.

## CI fixes during integration — 2026-10-20/2026-10-21

- 2026-10-20 (surfaced while merging ADM-01/SH-06, PR #30): the root Playwright/CI job ran every spec
  in `tests/e2e/`, which broke on account/password specs needing the local stack's secret key.
  Fixed with `testIgnore` entries and a dedicated "Accounts and passwords" CI job that starts a local
  Supabase and runs the relevant integration suites and browser specs without exposing credentials
  (commit `74ce642`). Detail in `logs/johannsen/adm-01-accounts-and-sh-06-password.md`.
- 2026-10-21 (surfaced while building ADM-03, PR #38): the root `playwright.config.ts` ignored admin
  specs by exact filename, so the new `admin-announcements.spec.ts` also ran in the student
  end-to-end job against the wrong Supabase stack. Fixed by widening the ignore pattern to
  `**/admin-*.spec.ts`, mirroring the admin config's own `testMatch` (commit `1f588fe`, "Run admin
  browser specs only in the admin Playwright config"). Detail in
  `logs/johannsen/adm-03-announcements.md`.
- Also during ADM-03's build, a developer agent's reported Turbopack build failure and Base UI
  dialog e2e failures were traced to this worktree's `node_modules` being a symlink into another
  worktree — Turbopack's hermetic workspace-root check refuses to resolve packages outside the
  project root. Fixed with a real `npm ci` per worktree; the coordinator re-ran every check and
  confirmed the failures were environmental, not code defects. Detail in
  `logs/johannsen/adm-03-announcements.md`.

Generated summary awaiting independent human verification.

## Release PR #35, develop → master — 2026-10-21 (open)

- "Release: student, lecturer and admin features with shared UI" bundles everything merged to
  `develop` so far: Student browse/request/manage-bookings plus AI improve-request with a daily
  quota (#11, #12, #13, #34); Lecturer availability, request decisions, consultation status/history
  (#27, #28, #29); Administrator account management and change-own-password (#30), courses and
  lecturer assignment (#32); the shared UI design system (#31); specs/agents/workflow (#4, #14, #26).
  16 new migrations (`20261018000000` … `20261020140000`) run on production when it merges.
- Explicitly **not** in this release: the lecturer AI briefing (#33), noted in the PR body as "still
  in review" at the time #35 was opened.
- Verified-on-development evidence recorded in the PR body: CI passed on each feature PR; every
  `develop` deployment succeeded, including migrations, up to commit `2b1e91f`.
- Pre-merge checklist items the PR body itself flags as outstanding: confirming no duplicate course
  codes exist on production (the new unique index would otherwise fail the deploy, without changing
  anything), and that AI environment variables are set for the Vercel production environment.
- Review: Joseph — "Looks good, ready to be merged to main branch!" (commit `2b1e91f`).
- Status: PR #35 is **open**, not yet merged, as of 2026-10-21. #33 has since merged (2026-10-21,
  after #35 was opened), and #37/#38 are stated in their own PR bodies to need to merge before #35 so
  production does not ship a briefing button that returns "unavailable." This log does not claim #35
  has merged.

Generated summary awaiting independent human verification.
