# Handoff: SH-06 / SH-06-R1..R5, AC1..AC7 — requirements_architect → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "SH-06-SPEC",
"requirementIds": ["SH-06-R1", "SH-06-R2", "SH-06-R3", "SH-06-R4", "SH-06-R5"],
"status": "incomplete",
"changedFiles": ["workflow/specs/shared/SH-06-change-own-password.md", "workflow/handoffs/sh-06/2026-10-19-sh-06-requirements-architect.md"],
"verification": [
{"check": "Drafted SH-06 using workflow/specs/_TEMPLATE.md headings, short form as instructed", "result": "passed", "evidence": "all template headings present; `wc -l` = 161 lines against a ~120-160 target, one line over after six trimming passes (203 -> 182 -> 181 -> 178 -> 169 -> 166 -> 165 -> 164 -> 161)"},
{"check": "Read src/lib/auth/session.ts and roles.ts (from ADM-01 round-1 reading) to confirm requireRole(role) takes exactly one role and no requireUser()-equivalent exists", "result": "passed", "evidence": "confirmed in a prior round; only requireRole(role) and getCurrentUser() exist, so SH-06-R5 correctly proposes a new helper rather than assuming one exists"},
{"check": "Read src/components/role-shell.tsx to describe the header link location accurately", "result": "passed", "evidence": "confirmed header renders user name + a 'Sign out' form; SH-06 proposes a 'Change password' link alongside it, not an invented UI element"},
{"check": "Captured all coordinator-specified content: current-password verification via server-side sign-in attempt, 12-72 length bounds, no first-login forcing, requireUser() flagged as shared src/lib change, rate limiting via Supabase, generic errors, session-stays-valid/Open behaviour, out-of-scope list", "result": "passed", "evidence": "present in R1-R5, Security requirements, Non-goals, and Open questions sections"},
{"check": "Added AC1-AC7 exactly matching the requested coverage (per-role success, wrong current password, too-short/mismatch, signed-out direct call, old-password-fails, no password in logs)", "result": "passed", "evidence": "'Acceptance criteria and verification' table"},
{"check": "Spec created as status: draft, owner: team, author requirements_architect", "result": "passed", "evidence": "frontmatter"},
{"check": "git hash-object on new spec", "result": "passed", "evidence": "e328ed0c7d10e701b8bc7b04bcde8181f79f8704"},
{"check": "git status shows only this spec and its handoff as new files from this agent", "result": "passed", "evidence": "`git status --porcelain` lists `?? workflow/specs/shared/SH-06-change-own-password.md` alongside unrelated untracked files from other agents, none edited here"},
{"check": "npm run check:spec / build / tests", "result": "not-run", "evidence": "out of role scope; no application code, migration, or test file created for this spec"}
],
"unresolvedIssues": ["Exact route (/account/password) and the requireUser() helper name/contract are proposed, not owner-fixed", "Password length bounds (12-72) are this agent's proposal, not an explicit owner decision", "Whether a password change should revoke other existing sessions is Open, shared with ADM-01-R9's identical question"]
}
<!-- HANDOFF:END -->

- Date: 2026-10-19
- Task ID: none assigned yet (created alongside `TASK-ADM-01` per owner decision 2026-10-19, relayed
  by the coordinator)
- Requirement / acceptance-criterion IDs: SH-06-R1..R5 (new), SH-06-AC1..AC7 (new)
- Specification: `workflow/specs/shared/SH-06-change-own-password.md`
- Specification version or commit: content digest `e328ed0c7d10e701b8bc7b04bcde8181f79f8704`
  (`git hash-object`); reviewed repository HEAD `7f6c579` (branch `feature/admin-registration`).
- Specification status and human approver: `draft`; not yet approved by any human.
- Relevant context files: `workflow/specs/_TEMPLATE.md` (headings); `SH-01-foundation.md` (session/
  role contract this spec sits alongside); `src/lib/auth/session.ts`/`roles.ts` and
  `src/components/role-shell.tsx` (read in earlier rounds of this session, re-used here for
  accuracy, not re-read).
- Allowed edit scope: `workflow/specs/shared/SH-06-change-own-password.md` (create), this handoff
  (create), plus `workflow/specs/admin/ADM-01-manage-accounts.md` and its handoff (covered in that
  handoff). Nothing else.
- Agent session log: none written outside the allowed paths; this handoff is the record.

## Decisions and assumptions

Owner decisions 2026-10-19, relayed by the coordinator: any signed-in active user (incl. the
protected recovery administrator) may change their own password; current password must be verified
server-side first (no SMTP available for email reauthentication); no forced password change on
first login.

Proposed by this agent, flagged for review rather than assumed as settled: the exact route
(`/account/password`) and a new `requireUser()` authorization helper (a shared `src/lib/auth`
change needing its own team review, not implemented here); password bounds of 12–72 characters;
the current-password-verification mechanism (a throwaway-client sign-in attempt before
`auth.updateUser`). Left explicitly Open and non-blocking, per the coordinator's instruction: whether
a password change should revoke the user's other existing sessions.

## Changes

- `workflow/specs/shared/SH-06-change-own-password.md` (new, `draft`): a short shared spec for any
  active user to change their own password, independent of `ADM-01-R9`'s admin-initiated reset.
  Covers authorization for "any active role" (not a single `requireRole`), current-password
  verification, new-password rules, UI, API contract, security notes (generic errors, no logging,
  Supabase-rate-limit reliance), edge cases, and 7 acceptance criteria.
- `workflow/handoffs/sh-06/2026-10-19-sh-06-requirements-architect.md` (new): this handoff.

## Evidence

| Command or check                                                     | Result  | Evidence                                                       |
| -------------------------------------------------------------------- | ------- | -------------------------------------------------------------- |
| `git hash-object workflow/specs/shared/SH-06-change-own-password.md` | passed  | `e328ed0c7d10e701b8bc7b04bcde8181f79f8704`                     |
| `wc -l workflow/specs/shared/SH-06-change-own-password.md`           | passed  | 161 lines (target ~120-160; one line over after six trims)     |
| `git status --porcelain`                                             | passed  | file listed as new (`??`); no other path touched by this agent |
| Frontmatter `status:`/`owner:`/`author`                              | passed  | `draft` / `team` / `requirements_architect` as instructed      |
| Application build/test/lint/CI                                       | not-run | out of role scope; no code or migration created                |

## Changes outside the owner's area

None by this agent. This is a new shared spec under `workflow/specs/shared/`; no file under `src/`,
`supabase/migrations/`, `.github/`, or any test directory was created or modified for SH-06. Its
proposed `requireUser()` helper is explicitly flagged in the spec as a future `src/lib/` change
needing separate team review before implementation — it was not added here.

## Findings and open questions

| #   | Severity | Finding                                                                                                                                                                    | Status                             |
| --- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 1   | Info     | `requireUser()` does not exist yet; `SH-06-R5` proposes it but any implementation of SH-06 depends on that shared-library change landing first and getting its own review. | Open, flagged in spec              |
| 2   | Info     | Password-length bounds (12–72) are this agent's proposal, not confirmed by the owner.                                                                                      | Open, non-blocking per coordinator |
| 3   | Info     | Session-revocation-on-change is Open and shared with `ADM-01-R9`'s identical, non-blocking question.                                                                       | Open, non-blocking                 |

## Next action

Human (Johannsen/team) reviews and, if satisfied, approves `SH-06` and confirms or adjusts the
proposed route, helper, and length bounds. Implementation (including the `requireUser()` helper)
should wait for that approval, per `AGENTS.md` ("spec → tests → code").

Handoff evidence: workflow/handoffs/sh-06/2026-10-19-sh-06-requirements-architect.md
