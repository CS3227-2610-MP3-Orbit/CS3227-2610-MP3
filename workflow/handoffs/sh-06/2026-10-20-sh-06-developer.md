# Handoff: SH-06 / SH-06-R1..R5, AC1..AC7 — developer → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-SH-06",
"requirementIds": ["SH-06-R1", "SH-06-R2", "SH-06-R3", "SH-06-R4", "SH-06-R5", "SH-06-AC1", "SH-06-AC2", "SH-06-AC3", "SH-06-AC4", "SH-06-AC5", "SH-06-AC6", "SH-06-AC7"],
"status": "passed",
"changedFiles": [
"src/lib/auth/session.ts",
"src/components/role-shell.tsx",
"src/app/account/layout.tsx",
"src/app/account/password/page.tsx",
"src/app/account/password/change-password-form.tsx",
"src/app/account/password/actions.ts",
"src/features/account/validation.ts",
"src/features/account/validation.test.ts",
"src/features/account/server.ts",
"src/features/account/server.test.ts",
"tests/integration/sh06-test-helpers.mjs",
"tests/integration/sh06-change-password.test.ts",
"tests/integration/sh06.vitest.config.mts",
"tests/e2e/change-password.spec.ts",
"tests/e2e/change-password.playwright.config.ts",
"workflow/handoffs/sh-06/2026-10-20-sh-06-developer.md"
],
"verification": [
{"check": "npm run lint", "result": "passed", "evidence": "clean"},
{"check": "npm run typecheck", "result": "passed", "evidence": "next typegen + tsc --noEmit clean"},
{"check": "npm test", "result": "passed", "evidence": "14 files passed, 1 skipped; 103 tests passed, 4 pre-existing todo"},
{"check": "npm run check:spec", "result": "passed", "evidence": "0 errors; SH-06-AC1..AC7 all covered"},
{"check": "npx vitest run --config tests/integration/sh06.vitest.config.mts (live local Supabase)", "result": "passed", "evidence": "8/8 passed; 0 leftover sh06- fixture users after"},
{"check": "npx playwright test --config tests/e2e/change-password.playwright.config.ts (real dev server, port 3107)", "result": "passed", "evidence": "2/2 passed, ~5s total"},
{"check": "prettier --write on my files only", "result": "passed", "evidence": "ran after each edit; lint/typecheck/test re-confirmed clean"}
],
"unresolvedIssues": []
}
<!-- HANDOFF:END -->

- Date: 2026-10-20 (fix cycle 1 of 2)
- Task ID: TASK-SH-06
- Requirement / acceptance-criterion IDs: SH-06-R1..R5 (implementation), SH-06-AC1..AC7 (tests)
- Specification: `workflow/specs/shared/SH-06-change-own-password.md`, `status: approved`, owner
  approval 2026-10-20, reviewed HEAD `3c8ba194d06439183318b66ba4824e8dc0521c1f`.
- Specification status and human approver: `approved` by Johannsen (2026-10-20); the shared
  `requireUser()` change still needs independent teammate review per the spec's own note.
- Relevant context files: `src/app/lecturer/slot-form.tsx` (the `useActionState`-bound
  `<form action>` pattern this now follows, per the coordinator's fix-cycle instruction);
  `src/app/login/actions.ts`/`login-form.tsx` (same pattern, simpler); Next 16 docs under
  `node_modules/next/dist/docs/01-app/02-guides/{forms,server-actions}.md`.
- Allowed edit scope: unchanged from the original envelope; no `src/app/admin/**`,
  `src/features/admin/**`, or ADM-01 test paths touched.
- Agent session log: none outside this handoff and the code.

## Decisions and assumptions

Fix cycle 1 replaces the previous submission's form implementation. Per the coordinator's
instruction, `change-password-form.tsx` now binds React 19 `useActionState` directly to
`<form action={formAction}>`, and `actions.ts`'s `submitChangePassword` takes the
`(previousState, formData)` signature `useActionState` requires, calling `requireUser()` first and
then `changeOwnPassword(formData)` (the feature layer's existing `boundedInput`/zod `.strict()`
validation decodes the `FormData` unchanged). This removes the client-side `mounted` lock,
`noValidate`+`preventDefault` imperative submit, and `unstable_rethrow` handling from the previous
attempt entirely: a form whose `action` is a Server Action reference submits as a real POST to
that action even before hydration (progressive enhancement), so there is no window where a click
could fall through to a native GET with passwords in the URL, and `redirect()` inside
`requireUser()`/the action is handled by Next's own action dispatch, not by the client.

Accepted behaviour, not a bug: because the fields are plain (uncontrolled) inputs bound only via
`name`, React 19 resets all of them after every dispatch of a form whose `action` is a function --
on a refusal (e.g. wrong current password) as much as on success. The user must re-type all three
fields after a refusal; nothing is pre-filled, logged, or placed in a URL either way. This differs
from the literal wording of the spec's UC2 ("fields kept for retry") but was explicitly accepted by
the coordinator in the fix-cycle instruction as the correct trade-off for removing the earlier
`mounted`-lock defect, since the two cannot both hold under this framework version's form-action
semantics (confirmed via live e2e testing, not supposition). Flagging this clause gap for the
spec's own record; not re-litigating it here.

Carried from the original submission, still true: `supabase.auth.signOut()` defaults to
`{scope:"global"}`, which would revoke the caller's real session, not just the throwaway
verifier's; fixed with `{scope:"local"}` in `src/features/account/server.ts` (caught by the live
integration test, independently re-verified this cycle: 8/8 still pass).

## Changes (this cycle)

- `src/app/account/password/actions.ts`: `submitChangePassword` rewritten to the
  `(previousState: ChangePasswordState, formData: FormData)` signature; calls `requireUser()`
  first, then `changeOwnPassword(formData)`, returns `{ result }`.
- `src/app/account/password/change-password-form.tsx`: rewritten around
  `useActionState(submitChangePassword, initialState)` bound to `<form action={formAction}>`,
  matching `src/app/lecturer/slot-form.tsx`'s shape. Kept: labelled current/new/confirm fields,
  `autocomplete="current-password"`/`"new-password"`, `aria-invalid`/`aria-describedby`,
  `role="status"`/`aria-live="polite"` outcome region, field-specific and generic error messages,
  `rounded-md border px-3 py-2` styling, a success panel replacing the form (so nothing is left to
  clear on success), `pending` (from `useActionState`) disabling the submit button while
  submitting. Removed: the `mounted` gate, manual `useState` for each password's value, the manual
  `onSubmit`/`preventDefault`/`busy` ref, and `unstable_rethrow` -- none are needed once submission
  goes through the real action-bound form.
- `tests/e2e/change-password.spec.ts`: removed the `toBeEnabled()` wait (no `mounted` lock to wait
  on); the wrong-current-password assertion now expects the current-password field to read back
  `""` after the refusal (reset, per the accepted behaviour above) instead of the retained value.
  AC1/AC5/AC6 assertions otherwise unchanged.

No changes this cycle to `src/lib/auth/session.ts`, `src/components/role-shell.tsx`,
`src/features/account/{validation,server}.ts`, or the integration tests/helpers -- all unchanged
and re-verified.

## Evidence

| Command or check                                                                                          | Result | Evidence                                       |
| --------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------- |
| `npm run lint`                                                                                            | passed | clean                                          |
| `npm run typecheck`                                                                                       | passed | clean; route types generated                   |
| `npm test`                                                                                                | passed | 103 passed, 4 pre-existing todo                |
| `npm run check:spec`                                                                                      | passed | 0 errors; SH-06-AC1..AC7 all covered           |
| `npx vitest run --config tests/integration/sh06.vitest.config.mts` (live local Supabase)                  | passed | 8/8; 0 leftover `sh06-*` fixture users after   |
| `npx playwright test --config tests/e2e/change-password.playwright.config.ts` (real `npm run dev`, :3107) | passed | 2/2, ~5s; no second dev server, no copy needed |

Env for integration/e2e: `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` /
`SUPABASE_SECRET_KEY` exported from `npx supabase status -o json` into the shell for that one
command only, never echoed/printed. Dev server Playwright started on :3107 exited with the test
run (`reuseExistingServer` off in non-CI, Playwright owns teardown); confirmed port 3107 free
afterward.

## Changes outside the owner's area

None. `src/lib/auth/session.ts` is unchanged this cycle (already landed last cycle, still needs
independent teammate review per the spec before merge).

## Findings and open questions

| #   | Severity      | Finding                                                                                                                                       | Status                                                        |
| --- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1   | Medium, fixed | `supabase.auth.signOut()` defaults to `scope:"global"`; left un-scoped it would revoke the caller's real session on every password change.    | Fixed: `{scope:"local"}`; re-verified this cycle.             |
| 2   | Resolved      | Previous cycle's `mounted`-lock defect (button stuck disabled) was real, not a harness artifact, as the coordinator's clean re-run confirmed. | Fixed by switching to `useActionState`+`<form action>`.       |
| 3   | Info          | UC2's "fields kept for retry" does not hold for a refusal under this framework's form-action reset semantics; accepted by the coordinator.    | Accepted; spec's own record should note the actual behaviour. |
| 4   | Info          | Whether a password change should revoke the user's _other_ sessions remains Open, shared with ADM-01-R9; unchanged by this task.              | Carried, non-blocking.                                        |

## Next action

Human/teammate review of the one shared `src/lib/auth/session.ts` change (`requireUser()`) is still
required per the spec before merge. No other follow-up known.

Handoff evidence: workflow/handoffs/sh-06/2026-10-20-sh-06-developer.md
