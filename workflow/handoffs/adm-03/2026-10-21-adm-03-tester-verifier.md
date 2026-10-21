# Handoff: TASK-ADM-03 / ADM-03-R1..R10, AC1..AC15 — tester_verifier → coordinator

<!--
Keep this JSON block valid. The completion hook validates structure, not truth or approval.
Use [] for no changed files or no unresolved issues. "blocked" and "not-run" are honest results.
-->
<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-ADM-03",
"requirementIds": ["ADM-03-R1", "ADM-03-R2", "ADM-03-R3", "ADM-03-R4", "ADM-03-R5", "ADM-03-R6", "ADM-03-R7", "ADM-03-R8", "ADM-03-R9", "ADM-03-R10"],
"status": "passed",
"changedFiles": [],
"verification": [
{"check": "npm run lint", "result": "passed", "evidence": "0 errors/warnings"},
{"check": "npm run typecheck", "result": "passed", "evidence": "next typegen + tsc --noEmit clean"},
{"check": "npx vitest run --exclude 'workflow/**'", "result": "passed", "evidence": "Test Files 36 passed; Tests 268 passed, incl. admin/announcements and shared/announcements unit files"},
{"check": "npm run check:spec", "result": "passed", "evidence": "0 errors; ADM-03-AC1..AC15 all covered by a non-skipped test; exit code 0"},
{"check": "npx supabase test db", "result": "passed", "evidence": "Files=13 Tests=226 Result: PASS, incl. supabase/tests/admin_announcements.test.sql (30 pgTAP assertions, ok)"},
{"check": "eval \"$(npx supabase status -o json | node tests/integration/local-supabase-env.mjs)\" && npm run test:admin-announcements:integration", "result": "passed", "evidence": "Test Files 1 passed; Tests 11 passed"},
{"check": "ADMIN_E2E_PORT=3104 npx playwright test --config tests/e2e/admin.playwright.config.ts", "result": "passed (1 unrelated pre-existing failure)", "evidence": "run 1: 25/26 passed, the only failure is [SH-07-AC1]/[SH-07-AC20] (ui-shell.spec.ts, a different in-flight feature, not ADM-03); all three admin-announcements.spec.ts tests passed, covering AC1/AC2/AC3/AC5/AC6/AC14"},
{"check": "post-run DB hygiene check (service-role read)", "result": "passed", "evidence": "0 stray announcements rows, 0 stray adm03- fixture users/profiles after every run"}
],
"unresolvedIssues": [
"[ADM-03-AC12]'s dedicated unit test in src/features/admin/announcements/presentation.test.ts is mislabeled: it tests truncatedAnnouncementBody's word-boundary behavior, not the inert-HTML-rendering property the AC actually describes. The real AC12 evidence lives in a separate test in server.test.ts (a static source scan asserting the rendered components never use dangerouslySetInnerHTML/a Markdown renderer, and that the reader card uses whitespace-pre-wrap) -- that test is sound, but the mislabeled one in presentation.test.ts could mislead a traceability tool or a future reader into thinking two independent AC12 proofs exist when only one does.",
"The admin list's own truncated body preview (truncatedAnnouncementBody) collapses newlines to spaces by design (comment: 'a preview only'), so the literal spec wording in R8/AC12's edge-case table ('line breaks preserved ... on both the admin list and the reader card') is not met by the admin list row/card itself -- only by the Edit dialog's textarea and the reader card. This is a defensible, documented design choice (the admin can always see the full body with real line breaks via Edit) and creates no security issue, but it is an undocumented deviation from the spec's literal text that the spec owner should either accept explicitly or ask to be fixed."
]
}
<!-- HANDOFF:END -->

## Status

passed

## Scope and gate

- Task/requirement IDs: TASK-ADM-03 (issues #25, #9), ADM-03-R1..R10, ADM-03-AC1..AC15.
- Spec reviewed: `workflow/specs/admin/ADM-03-guidelines-and-announcements.md`, front matter
  `status: approved`, owner Johannsen, 2026-10-21, covering R1-R10/AC1-AC15 as written.
- Implementation/handoffs reviewed: `workflow/handoffs/adm-03/2026-10-21-adm-03-requirements-architect.md`,
  `workflow/handoffs/adm-03/2026-10-21-adm-03-developer.md`.
- No test, fixture, product code, or migration file was modified during this review. A tiny
  read-only Node probe (service-role queries only) was used in the scratchpad dir to confirm no
  stray fixture rows were left on the shared stack; it wrote no file under the project tree and
  was discarded.
- This review is independent: every count below was produced by running the suite myself.

## AC → test traceability

| AC   | Requirement | Test(s)                                                                                                                                                | Layer                      | Judgment                                                                                                                                                                                                                                                                                                                         |
| ---- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1  | R1          | `tests/integration/admin-announcements.test.ts`; e2e                                                                                                   | live DB + e2e              | Sound: confirms the real stored row's `created_by`/`updated_by`/`is_published` after a real create.                                                                                                                                                                                                                              |
| AC2  | R1          | `src/features/admin/announcements/validation.test.ts`; e2e                                                                                             | unit + e2e                 | Sound: every bound (`kind` enum, 1/120 title, 1/2000 body, NUL byte, unpaired surrogate) is checked at both boundaries, plus a real field-level error in the browser.                                                                                                                                                            |
| AC3  | R2          | `tests/integration/admin-announcements.test.ts`; e2e                                                                                                   | live DB + e2e              | Sound: edits with a _different_ admin as editor, checks `updated_by` is the editor and `is_published` is unchanged, against the real row.                                                                                                                                                                                        |
| AC4  | R2          | `tests/integration/admin-announcements.test.ts`                                                                                                        | live DB                    | Sound: a random unknown UUID is refused with `forbidden_or_not_found`.                                                                                                                                                                                                                                                           |
| AC5  | R3          | `supabase/tests/admin_announcements.test.sql`; `tests/integration/admin-announcements.test.ts`; e2e                                                    | pgTAP + live DB + e2e      | Sound: publish → unpublish → republish cycle checked against the real row at every layer; pgTAP separately proves the row survives unpublish.                                                                                                                                                                                    |
| AC6  | R4          | `tests/integration/admin-announcements.test.ts`; e2e                                                                                                   | live DB (security) + e2e   | Sound: asserts the exact allowlisted key set via `Object.keys(...).sort()` and that both a draft and a published id are present.                                                                                                                                                                                                 |
| AC7  | R5          | `supabase/tests/admin_announcements.test.sql`; `tests/integration/admin-announcements.test.ts`                                                         | pgTAP + live DB            | Sound: a lecturer/student/anon direct PostgREST `select` against a real draft row returns zero rows, re-checked by both layers.                                                                                                                                                                                                  |
| AC8  | R5          | `tests/integration/admin-announcements.test.ts`; `src/features/shared/announcements/server.test.ts`                                                    | live DB + unit             | Sound: live test reads the real reader projection as a real student and a real lecturer session.                                                                                                                                                                                                                                 |
| AC9  | R6          | `supabase/tests/admin_announcements.test.sql`; `tests/integration/admin-announcements.test.ts`                                                         | pgTAP (security) + live DB | Sound: covers Server-Action redirects, a direct non-admin RPC call (grant intact, role check refuses it), and a direct `anon` call (`42501` before the function body runs).                                                                                                                                                      |
| AC10 | R6          | `supabase/tests/admin_announcements.test.sql`                                                                                                          | pgTAP (security)           | Sound: checks the full privilege matrix directly (`insert`/`update`/`delete` revoked from both roles, `select` granted only to `authenticated`, `execute` on each RPC granted only to `authenticated`) — not inferred from behavior.                                                                                             |
| AC11 | R7          | `src/features/admin/announcements/server.test.ts`; `src/features/shared/announcements/server.test.ts`; `tests/integration/admin-announcements.test.ts` | unit (mocked) + live DB    | Sound: unit asserts `generateText` is never called on any path (admin or reader); integration asserts a real `ai_usage` count delta of zero.                                                                                                                                                                                     |
| AC12 | R8          | `src/features/admin/announcements/server.test.ts` (real check); `src/features/admin/announcements/presentation.test.ts` (mislabeled)                   | unit (static source scan)  | **Partial, see finding 1.** The real proof (`server.test.ts`) is sound — it reads the actual shipped component source and asserts no `dangerouslySetInnerHTML`/Markdown import, plus `whitespace-pre-wrap` on the reader card. The test bearing the `[ADM-03-AC12]` tag in `presentation.test.ts` tests something else entirely. |
| AC13 | R9          | `tests/integration/admin-announcements.test.ts`                                                                                                        | live DB                    | Sound and rigorous: 2 guidelines + 6 announcements seeded with distinct `created_at` values; asserts the exact newest-first ordering and that the oldest announcement is excluded, not just a count.                                                                                                                             |
| AC14 | R10         | e2e (`tests/e2e/admin-announcements.spec.ts`)                                                                                                          | e2e (live browser)         | Sound: publishes real items via the UI, then signs in as the real seeded student and lecturer accounts and reads both dashboard cards.                                                                                                                                                                                           |
| AC15 | R5          | `supabase/tests/admin_announcements.test.sql`; `tests/integration/admin-announcements.test.ts`                                                         | pgTAP (security) + live DB | Sound: pgTAP flips a real profile's `is_active` mid-session and re-reads with the _same_ still-valid JWT, proving RLS (not just app logic) revokes access instantly; the vitest test adds the Server-Action-redirect half.                                                                                                       |

Every AC has at least one live-DB or pgTAP test backing its database-layer claim; no AC rests on a
mock alone where the spec demanded live-DB evidence.

## Commands run and actual results

- `npm run lint` → passed, 0 errors/warnings.
- `npm run typecheck` → passed.
- `npx vitest run --exclude 'workflow/**'` → Test Files 36 passed; Tests 268 passed.
- `npm run check:spec` → 0 errors, exit code 0; every ADM-03-AC1..AC15 covered.
- `npx supabase test db` → `Files=13, Tests=226 ... Result: PASS` (incl.
  `admin_announcements.test.sql`, reports "ok").
- `eval "$(npx supabase status -o json | node tests/integration/local-supabase-env.mjs)" && npm run test:admin-announcements:integration`
  → Test Files 1 passed; Tests 11 passed.
- `eval "..." && ADMIN_E2E_PORT=3104 npx playwright test --config tests/e2e/admin.playwright.config.ts`
  → 25 passed, 1 failed (`[SH-07-AC1]`/`[SH-07-AC20]`, unrelated `ui-shell.spec.ts` sign-in flow,
  a different in-flight feature). All three `admin-announcements.spec.ts` tests passed:
  `[ADM-03-AC1][AC3][AC5][AC6]`, `[ADM-03-AC2]`, `[ADM-03-AC14]`.
- Post-run service-role query: `announcements` table had 0 rows matching this session's or the
  developer's fixture title patterns after every run; 0 stray `adm03-`-prefixed auth users/profiles.

## Findings

| #   | Severity                                                           | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Reproduction                                                                                                                                                                                                                                                                        |
| --- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Low (test labeling)                                                | The test tagged `[ADM-03-AC12]` in `src/features/admin/announcements/presentation.test.ts` ("truncatedAnnouncementBody never drops a word...") does not test the AC's actual claim (inert rendering of HTML/script markup). The genuine AC12 evidence is a separate, correctly-targeted static source scan in `src/features/admin/announcements/server.test.ts` (reads the real component files, asserts no `dangerouslySetInnerHTML`/Markdown renderer, and that `whitespace-pre-wrap` is present). No functional gap exists — the real check is sound — but a traceability tool keyed only on the bracketed tag would double-count AC12 as having two independent proofs when only one actually tests the claim. | `src/features/admin/announcements/presentation.test.ts:20`; compare with the real check at `src/features/admin/announcements/server.test.ts:178`.                                                                                                                                   |
| 2   | Low (spec-literal deviation, documented in code, not in a handoff) | `truncatedAnnouncementBody` (`src/features/admin/announcements/presentation.ts`) collapses all whitespace, including newlines, into single spaces for the admin list's preview. R8/the edge-case table's literal wording ("line breaks preserved ... on both the admin list and the reader card") is therefore not met by the admin list row itself — only by the Edit dialog's textarea (native line-break preservation) and the reader card (explicit `whitespace-pre-wrap`). This is inert plain text either way (no security impact), and the code comment explains the intent ("a preview only"), but no handoff records this as an accepted deviation from the spec's literal text.                          | `src/features/admin/announcements/presentation.ts:14-23` (docblock + `body.replace(/\s+/g, " ")`); confirmed `whitespace-pre-wrap` appears only in `src/components/announcements-card.tsx`, not in `src/app/admin/announcements/announcement-table-row.tsx`/`announcement-row.tsx`. |

No defect was found in `ADM-03`'s product code, migration, RLS policies, or RPC behavior. Both
findings above are documentation/labeling nits, not functional or security defects.

## Changes

None — read-only verification. No test, fixture, product code, or migration file was modified.

## Gaps and unresolved questions

- Finding 2 is a judgment call for the spec owner: either accept the admin-list preview's
  whitespace-collapsing as an intentional, documented deviation (recommended — a single-line
  preview is a reasonable UX choice and the full body with real line breaks stays one click away),
  or ask the developer to preserve line breaks in the row preview too.
- No other coverage gaps found; AC13's cap/ordering edge case and AC15's RLS-instant-revocation
  edge case — the two trickiest invariants in this spec — are both exercised rigorously, not just
  asserted.

## Next action

Coordinator: this feature can proceed — no functional or security defect was found and every
automated check (lint, typecheck, unit, pgTAP, live-DB integration, e2e) passes independently of
the developer's own report. Optionally ask for finding 1's test label to be corrected (move the
`[ADM-03-AC12]` tag off the truncation test and keep it only on the real source-scan test) and for
finding 2 to be either fixed or explicitly accepted by the spec owner.

Handoff evidence: workflow/handoffs/adm-03/2026-10-21-adm-03-tester-verifier.md

## Coordinator follow-up (2026-10-21)

- Finding 1 (mislabelled `[ADM-03-AC12]` test): resolved. The truncation test is now untagged, and a
  new `[ADM-03-AC12]` test proves the admin preview keeps `<script>`/`<b>` markup as literal text
  while collapsing line breaks. Unit run: 19/19 in `src/features/admin/announcements`.
- Finding 2 (admin list collapses line breaks): resolved spec-side. R8, AC12 and the edge-case table
  now state that the admin list shows a one-line preview (≤140 characters, whitespace collapsed,
  `…` on a cut) and that full-text views keep line breaks; owner-approved, change log updated.
