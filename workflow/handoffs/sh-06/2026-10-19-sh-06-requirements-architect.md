# Handoff: SH-06 / SH-06-R1..R7, AC1..AC12 — requirements_architect → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "SH-06-SPEC",
"requirementIds": ["SH-06-R1", "SH-06-R2", "SH-06-R3", "SH-06-R4", "SH-06-R5", "SH-06-R6", "SH-06-R7"],
"status": "incomplete",
"changedFiles": ["workflow/specs/shared/SH-06-change-own-password.md", "workflow/handoffs/sh-06/2026-10-19-sh-06-requirements-architect.md"],
"verification": [
{"check": "Round 1 (2026-10-19): drafted SH-06 with R1-R5, AC1-AC7; status draft", "result": "passed", "evidence": "see prior round evidence; superseded by owner approval before this round began"},
{"check": "Found the spec already reflected owner's 2026-10-20 acceptance of the round-1 proposals and status: approved before this round began", "result": "passed", "evidence": "Document control and change log already showed a 2026-10-20 Johannsen approval row; ACs already in the required bullet form through AC7"},
{"check": "Added SH-06-R6 (other sessions end via signOut({scope:\"others\"}), current session stays valid) per owner decision 2026-10-20, security review item A", "result": "passed", "evidence": "spec 'Functional requirements' R6 section"},
{"check": "Added SH-06-R7 (claim-then-count rate limit: 5 failures/15 min, new password_change_attempts table, RLS-locked to service role like ai_usage) per security review item C", "result": "passed", "evidence": "spec 'Functional requirements' R7 section, including the stated per-IP-vs-per-account rationale"},
{"check": "Recorded the documented access-token-validity limitation (not a requirement), shared with ADM-01-R10", "result": "passed", "evidence": "R6 section and Security requirements 'Documented limitation' bullet"},
{"check": "Updated UI description, Technical constraints, Data model (new migration for password_change_attempts), API (otherSessionsEnded, rate_limited), Security, and Edge cases (3 new rows)", "result": "passed", "evidence": "respective sections updated"},
{"check": "Added AC8-AC12 continuing existing bullet-form numbering (two-session integration test, unit decision logic, integration correct-password-still-refused, integration success-clears-attempts, pgTAP table-access-denial)", "result": "passed", "evidence": "'Acceptance criteria and verification' section, same bullet form as AC1-AC7"},
{"check": "Kept frontmatter status: approved throughout; added a dated 2026-10-20 re-approval bullet in Document control and a change-log row reading 'Security review findings; owner approved 2026-10-20'", "result": "passed", "evidence": "Document control new 'Re-approval' bullet; Change log final row"},
{"check": "git hash-object on revised spec", "result": "passed", "evidence": "f03c2a69039620e5942069edbb61f7f4b4480d23"},
{"check": "git status shows only this spec and handoff among allowed paths touched by this agent", "result": "passed", "evidence": "`git status --porcelain` shows ` M workflow/specs/shared/SH-06-change-own-password.md` plus unrelated untracked files from other agents, not edited here"},
{"check": "npm run check:spec / build / tests / migration creation", "result": "not-run", "evidence": "out of role scope; no application code, migration, or test file created"}
],
"unresolvedIssues": ["requireUser() still does not exist; SH-06 implementation depends on that shared src/lib/auth change landing and being reviewed separately", "password_change_attempts migration needs independent review before merge", "Password length bounds (12-72) remain this agent's original proposal, accepted by the owner on 2026-10-20 but not independently re-verified"]
}
<!-- HANDOFF:END -->

- Date: 2026-10-20 (second round)
- Task ID: none assigned yet (created alongside `TASK-ADM-01`)
- Requirement / acceptance-criterion IDs: SH-06-R1..R7 (R6, R7 new), SH-06-AC1..AC12 (AC8-AC12 new)
- Specification: `workflow/specs/shared/SH-06-change-own-password.md`
- Specification version or commit: content digest `f03c2a69039620e5942069edbb61f7f4b4480d23`
  (`git hash-object`); supersedes the prior digest `e328ed0c7d10e701b8bc7b04bcde8181f79f8704`.
  Status stays `approved` (material addition, owner pre-approved via "fix those issues").
- Specification status and human approver: `approved`; Johannsen's 2026-10-20 "fix those issues"
  covers this spec's two new requirements (security review items A and C).
- Relevant context files this round: none newly read; built on the spec's existing content.
- Allowed edit scope this round: `workflow/specs/shared/SH-06-change-own-password.md`,
  `workflow/specs/admin/ADM-01-manage-accounts.md`, and both specs' handoffs. Nothing else.

## Decisions and assumptions

Owner decision 2026-10-20, relayed by the coordinator: approve three automated-security-review
findings. For SH-06 (items A and C): `SH-06-R6` — after a successful own-password change, every
other session is signed out via `signOut({scope: "others"})`, the current session stays signed in,
and the success message says so. `SH-06-R7` — at most 5 failed current-password verifications per
user per rolling 15 minutes, 6th refused before calling Supabase Auth, backed by a new
`password_change_attempts` table (RLS enabled, no policies, privileges revoked from
anon/authenticated, written by the service-role client like `ai_usage`), using a claim-then-count
protocol (insert before verifying, delete on success) so only failures count and parallel attempts
cannot all slip past the limit together.

Documented, not required (shared with `ADM-01-R10`): an access token already issued for another
session stays valid until it expires (≤ 1 hour default); only the refresh token is revoked
immediately.

## Changes

- `workflow/specs/shared/SH-06-change-own-password.md`: added a dated 2026-10-20 "Re-approval"
  bullet in Document control; added `SH-06-R6` and `SH-06-R7`; updated UI description, Technical
  constraints, Data model (new `password_change_attempts` migration), API contract
  (`otherSessionsEnded`, `rate_limited`), Security requirements, and three Edge-case rows; added
  `SH-06-AC8`–`AC12` in the required bullet form; added a change-log row reading "Security review
  findings; owner approved 2026-10-20". Status stays `approved`.
- `workflow/specs/admin/ADM-01-manage-accounts.md`: see its own handoff (`ADM-01-R10`, the matching
  admin-side session-revocation requirement).
- This handoff: revised for round 2.

## Evidence

| Command or check                                                     | Result  | Evidence                                                                                   |
| -------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------ |
| `git hash-object workflow/specs/shared/SH-06-change-own-password.md` | passed  | `f03c2a69039620e5942069edbb61f7f4b4480d23`                                                 |
| Frontmatter `status:` field                                          | passed  | `approved`, unchanged by this round                                                        |
| `git status --porcelain`                                             | passed  | only this spec modified by this agent; other listed paths are other agents' untracked work |
| Application build/test/lint/CI/migration                             | not-run | out of role scope; none touched                                                            |

## Changes outside the owner's area

None by this agent. `password_change_attempts` and the `requireUser()` helper remain proposed in
the spec text only; no migration, library code, or test file was created or modified here.

## Findings and open questions

| #   | Severity | Finding                                                                                                                                                            | Status                 |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| 1   | Info     | `requireUser()` still does not exist; implementation of all of SH-06 depends on that shared `src/lib/auth` change landing and getting its own team review first.   | Open, flagged in spec  |
| 2   | Low      | The new `password_change_attempts` table/migration is a security-sensitive, shared-area change needing independent teammate review before merge, per `AGENTS.md`.  | Flag for reviewer      |
| 3   | Info     | Password-length bounds (12–72) remain this agent's original proposal; the owner accepted them on 2026-10-20 but they were not independently re-derived this round. | Accepted, non-blocking |

## Next action

Coordinator/developer implement `requireUser()`, the `password_change_attempts` migration, and the
`SH-06-R6`/`R7` logic together with `ADM-01-R10`'s session revocation, then route through
tester/security review as usual. No further spec change is pending on this agent's side.

Handoff evidence: workflow/handoffs/sh-06/2026-10-19-sh-06-requirements-architect.md
