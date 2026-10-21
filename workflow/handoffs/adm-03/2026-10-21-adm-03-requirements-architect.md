# Handoff: TASK-ADM-03 / ADM-03-R1..R10, AC1..AC15 — requirements_architect → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-ADM-03",
"requirementIds": ["ADM-03-R1", "ADM-03-R2", "ADM-03-R3", "ADM-03-R4", "ADM-03-R5", "ADM-03-R6", "ADM-03-R7", "ADM-03-R8", "ADM-03-R9", "ADM-03-R10"],
"status": "incomplete",
"changedFiles": ["workflow/specs/admin/ADM-03-guidelines-and-announcements.md", "workflow/handoffs/adm-03/2026-10-21-adm-03-requirements-architect.md"],
"verification": [
{"check": "Read PRODUCT-SPEC.md for the Administrator 'Publish and edit guidelines and announcements' and Student 'Read current administrator-published consultation guidelines and announcements' promises, and the open question on maximum announcement length", "result": "passed", "evidence": "digest d9f63461aeb368ffd811ec50e5a595e0c6047ca7; lines ~23, ~51, ~87, ~104, ~161 cited in the spec's Document control and R1/Open questions"},
{"check": "Read GitHub issues #25 (admin) and #9 (student) via `gh issue view`", "result": "passed", "evidence": "#25 'Admin: Publish guidelines and announcements (optional)', explicitly 'Lower priority; cut if short on time'; #9 'Student: Read guidelines' (Core Workflow MVP milestone); both cited as untrusted/informational content, not authority, consistent with AGENTS.md"},
{"check": "Confirmed no existing announcements code/migration/spec exists anywhere in the repo", "result": "passed", "evidence": "`grep -ril announcement` across non-node_modules TS/TSX/SQL/MD files returned only PRODUCT-SPEC.md and unrelated planning docs, never application code or a migration"},
{"check": "Read ADM-02's migration (20261020140000_admin_courses.sql) for the house RPC/security style", "result": "passed", "evidence": "ADM-03's proposed RPCs mirror admin_create_course/admin_set_course_active exactly: security definer, set search_path='', current_app_role()='admin' check first, revoke-then-grant-to-authenticated-only, no-delete/archive-over-delete via a boolean flag"},
{"check": "Read ADM-02's app/feature code (page.tsx, create-course-dialog.tsx, courses-list.tsx, course-row.tsx, actions.ts, validation.ts, server.ts) for the Server Action/zod/UI conventions this spec reuses", "result": "passed", "evidence": "ADM-03's proposed createAnnouncement/updateAnnouncement/setAnnouncementPublished Server Actions, zod .strict() safeText/text(max) validation, and Table->=md/Card<md + Dialog-create UI description mirror these files directly"},
{"check": "Read initial_schema.sql's profiles RLS policies ('read own'/'active users read staff'/'admin reads all') to find the direct-table-read pattern for multi-role access", "result": "passed", "evidence": "ADM-03's proposed 'announcements: admin reads all' / 'announcements: active users read published' policies are the same (select public.current_app_role()) shape, used instead of a new admin-list RPC"},
{"check": "Read SH-01-foundation.md for requireRole/requireUser and current_app_role() semantics (null when signed out or deactivated)", "result": "passed", "evidence": "src/lib/auth/session.ts confirms requireUser() exists for role-agnostic active-only actions; cited for the reader projection's authorization boundary (R5/R10) and the deactivated-user edge case"},
{"check": "Read SH-07-ui-design-system.md and src/components/app-nav.ts, empty-state.tsx, status-badge.ts for nav/Badge/EmptyState conventions", "result": "passed", "evidence": "current NAV_GROUPS.admin has Overview/People/Teaching/Insights groups; proposed a new 'Communications' group between Teaching and Insights with a Megaphone-icon 'Announcements' item; Badge/statusBadgeVariant/EmptyState reused as specified"},
{"check": "Read src/app/student/page.tsx and src/app/lecturer/page.tsx for dashboard layout and the existing whitespace-pre-wrap <pre> plain-text precedent (lecturer AI briefings)", "result": "passed", "evidence": "cited as the precedent for R8's never-render-as-HTML rule and the proposed dashboard card placement"},
{"check": "Checked .github/CODEOWNERS for the student/lecturer review boundary the reader-card implementation will cross", "result": "passed", "evidence": "digest 879f936455b52ea7910c1258ad92f4e25b57334a; confirmed src/app/student/** owned by @josephkwok001 and src/app/lecturer/** by @JordanGoh4, cited in R10 and the UI description"},
{"check": "git hash-object on the new spec (after npx prettier --write)", "result": "passed", "evidence": "40a6c8f50215786f2efd467720e6c022621976d0"},
{"check": "npx prettier --write on both new files", "result": "passed", "evidence": "spec reformatted (table column widths only, no content change); this handoff file written already formatted"},
{"check": "git status shows only the two allowed files touched by this agent", "result": "passed", "evidence": "`git status --porcelain` shows only `?? workflow/specs/admin/ADM-03-guidelines-and-announcements.md` before this handoff was added; no app code, test, migration, or CI file touched"},
{"check": "npm run check:spec / build / tests / migration creation", "result": "not-run", "evidence": "out of role scope; no application code, tests, CI, or migration file touched by this agent"}
],
"unresolvedIssues": ["Owner has not yet reviewed any proposed item: title/body bounds and default-draft-on-create (R1), the RLS-only read-path choice replacing a seventh RPC (R4/R5/R9), the exact reader ordering/cap rule (R9), or extending the reader card to the Lecturer dashboard beyond PRODUCT-SPEC.md's current wording (R10) — none block drafting, all tagged proposed", "Whether the Lecturer-dashboard half of R10/AC14 should be cut given issue #25 is explicitly marked lower-priority/cuttable and PRODUCT-SPEC.md's Lecturer section does not yet mention this feature, is open and non-blocking", "This spec proposes closing PRODUCT-SPEC.md's open question on maximum announcement length via ADM-03-R1, without editing PRODUCT-SPEC.md itself (outside this agent's allowed write scope) — a human maintainer must apply that edit separately if accepted"]
}
<!-- HANDOFF:END -->

- Date: 2026-10-21
- Task ID: TASK-ADM-03 (GitHub issues #25, #9)
- Requirement / acceptance-criterion IDs: ADM-03-R1..R10, ADM-03-AC1..AC15 (all new)
- Specification: `workflow/specs/admin/ADM-03-guidelines-and-announcements.md`
- Specification version or commit: content digest `40a6c8f50215786f2efd467720e6c022621976d0`
  (`git hash-object`, taken after `npx prettier --write`); first draft, no prior digest invalidated.
- Specification status and human approver: `draft`; **not yet approved** — no human approval
  evidence was supplied for this round, matching the assignment's stated state.
- Relevant context files this round: `workflow/specs/PRODUCT-SPEC.md`,
  `workflow/specs/shared/SH-01-foundation.md`, `workflow/specs/shared/SH-07-ui-design-system.md`,
  `workflow/specs/admin/ADM-02-manage-courses-and-assignments.md`,
  `workflow/specs/admin/ADM-04-booking-reports-and-ai-summary.md`,
  `supabase/migrations/20261017000000_initial_schema.sql`,
  `supabase/migrations/20261018000000_student_browse_available_slots.sql`,
  `supabase/migrations/20261020140000_admin_courses.sql`, `src/components/app-nav.ts`,
  `src/components/empty-state.tsx`, `src/lib/status-badge.ts`, `src/lib/auth/session.ts`,
  `src/app/admin/courses/page.tsx`, `src/app/admin/courses/create-course-dialog.tsx`,
  `src/app/admin/courses/courses-list.tsx`, `src/app/admin/courses/course-row.tsx`,
  `src/app/admin/courses/actions.ts`, `src/features/admin/courses/validation.ts`,
  `src/features/admin/courses/server.ts`, `src/app/admin/page.tsx`, `src/app/student/page.tsx`,
  `src/app/lecturer/page.tsx`, `.github/CODEOWNERS`, GitHub issues #25 and #9.
- Allowed edit scope this round: `workflow/specs/admin/ADM-03-guidelines-and-announcements.md`
  and `workflow/handoffs/adm-03/2026-10-21-adm-03-requirements-architect.md`. Nothing else.

## Decisions and assumptions

Owner-confirmed scope (Johannsen, relayed by the coordinator, 2026-10-21, grounded in
`PRODUCT-SPEC.md` and GitHub issues #25/#9): admins create/edit/publish/unpublish guidelines and
announcements; no hard delete; any active signed-in user reads only published items; no AI.

Proposed by this agent, pending owner review (none blocking): `title` 1–120 / `body` 1–2000
trimmed-character bounds, closing `PRODUCT-SPEC.md`'s open question on maximum announcement
length; a new item starts unpublished and must be explicitly published; the admin list and the
reader projection both use a direct RLS-protected table `select` rather than a new RPC (two new
`select` policies, mirroring `profiles`'s "admin reads all"/"active users read staff" shape,
instead of a seventh RPC); the reader's exact content rule (all published guidelines + 5 newest
published announcements, newest-first); a new "Communications" nav group; and — the most material
open item — extending the reader card to the Lecturer dashboard, which goes beyond what
`PRODUCT-SPEC.md`'s Lecturer section currently promises and was only in the coordinator's scoped
ask, not in either filed issue.

## Changes

- `workflow/specs/admin/ADM-03-guidelines-and-announcements.md`: new file. Frontmatter
  `status: draft`. Defines `ADM-03-R1`–`R10`, UI/API/data-model/security sections, an edge-case
  table, and `ADM-03-AC1`–`AC15` in the exact bullet form `- **ADM-03-ACn** (Rx; method;
mocked/live) Given/when/then`, mirroring `ADM-02`'s and `ADM-04`'s house style and depth.
- This handoff: new file.

## Evidence

| Command or check                                                                         | Result  | Evidence                                                                                             |
| ---------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| `git hash-object workflow/specs/admin/ADM-03-guidelines-and-announcements.md`            | passed  | `40a6c8f50215786f2efd467720e6c022621976d0`                                                           |
| `npx prettier --write` on the new spec                                                   | passed  | reformatted table column widths only; no content change                                              |
| Frontmatter `status:` field                                                              | passed  | `draft`                                                                                              |
| `git status --porcelain` (scope check)                                                   | passed  | only the two allowed files touched by this agent                                                     |
| Inspection: no prior announcements code/migration/spec exists anywhere in-tree           | passed  | `grep -ril announcement` across TS/TSX/SQL/MD hit only `PRODUCT-SPEC.md` and unrelated planning docs |
| Inspection: `profiles` RLS has a direct "admin reads all" `select` policy pattern        | passed  | confirmed in `20261017000000_initial_schema.sql`; reused for the proposed read-path design           |
| Inspection: `.github/CODEOWNERS` boundary for `src/app/student/**`/`src/app/lecturer/**` | passed  | confirmed `@josephkwok001`/`@JordanGoh4` ownership; cited in R10                                     |
| Application build/test/lint/CI/migration                                                 | not-run | out of role scope; none touched                                                                      |

## Changes outside the owner's area

None by this agent. No application code, test, migration, or CI file was created or edited; the
spec only _describes_ a future append-only migration, three new RPCs, and UI changes (including a
cross-boundary reader card touching `src/app/student/**`/`src/app/lecturer/**`) for the developer
role to implement, each still subject to its owner's CODEOWNERS review at that time.

## Findings and open questions

| #   | Severity | Finding                                                                                                                                                                                                                   | Status                       |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| 1   | Info     | Proposed title/body bounds, default-draft-on-create, RLS-only read-path, reader ordering/cap, and nav placement all await owner review.                                                                                   | Open, non-blocking           |
| 2   | Medium   | Extending the reader card to the Lecturer dashboard goes beyond `PRODUCT-SPEC.md`'s current Lecturer wording and issue #25's own scope note ("cut if short on time"); worth an explicit yes/no given the Friday deadline. | Open, needs owner decision   |
| 3   | Info     | This spec proposes closing `PRODUCT-SPEC.md`'s open question on maximum announcement length, but does not itself edit `PRODUCT-SPEC.md` (outside this agent's allowed scope).                                             | Open, non-blocking, deferred |
| 4   | Info     | No AI touches this feature; `ADM-04` remains the Administrator's only AI feature, per the owner-confirmed no-AI boundary.                                                                                                 | Resolved, informational      |

## Next action

Human (Johannsen) reviews and approves/requests changes to the draft spec, specifically the five
decisions raised in this handoff's final summary (bounds/defaults, read-path shape, Lecturer-card
scope, nav placement, and the PRODUCT-SPEC open-question closure); once approved, the coordinator
may hand this to the developer role to add the append-only migration (table + RLS + 3 RPCs) and
the `/admin/announcements` UI plus the two dashboard reader cards, then to
tester_verifier/security_reviewer per the standard workflow — flagging the reader-card PR for
Joseph's/Jordan's required CODEOWNERS review.

Handoff evidence: workflow/handoffs/adm-03/2026-10-21-adm-03-requirements-architect.md
