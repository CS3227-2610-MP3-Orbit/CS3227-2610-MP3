# Handoff: TASK-ADM-01 / ADM-01-R1..R10, AC1..AC25 — requirements_architect → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-ADM-01",
"requirementIds": ["ADM-01-R1", "ADM-01-R2", "ADM-01-R3", "ADM-01-R4", "ADM-01-R5", "ADM-01-R6", "ADM-01-R7", "ADM-01-R8", "ADM-01-R9", "ADM-01-R10"],
"status": "incomplete",
"changedFiles": ["workflow/specs/admin/ADM-01-manage-accounts.md", "workflow/handoffs/adm-01/2026-10-19-adm-01-requirements-architect.md"],
"verification": [
{"check": "Found the spec already reflected owner's 2026-10-20 confirmation of R9's protected-admin refusal and re-approval (status: approved) before this round began", "result": "passed", "evidence": "Document control and change log already showed a 2026-10-20 Johannsen re-approval row; ACs were already in the required bullet form through AC22"},
{"check": "Added ADM-01-R10 (password reset ends the target's sessions via new admin_revoke_sessions RPC) per owner decision 2026-10-20 ('fix those issues', security review item B)", "result": "passed", "evidence": "spec 'Functional requirements' R10 section, confirmed, resolving R9's prior open session-revocation question"},
{"check": "Recorded the documented access-token-validity limitation (not a requirement) shared with SH-06-R6", "result": "passed", "evidence": "R10 section and Security requirements 'Documented limitation' bullet"},
{"check": "Updated Technical constraints, Data model (admin_revoke_sessions: search_path='', admin-only, refuses self/protected, deletes auth.sessions rows, execute to authenticated only), API (password_reset_sessions_not_revoked result), Security, and Edge cases (2 new rows)", "result": "passed", "evidence": "respective sections updated"},
{"check": "Added AC23-AC25 continuing existing bullet-form numbering (pgTAP refusal, pgTAP success-removes-sessions, integration refresh-token-fails)", "result": "passed", "evidence": "'Acceptance criteria and verification' section, same bullet form as AC1-AC22"},
{"check": "Fixed stale 'Review evidence'/'Open questions' text that still referenced the already-resolved R9 confirmation as blocking", "result": "passed", "evidence": "'Human input required' and 'Open questions blocking approval' sections rewritten to reflect current approved state"},
{"check": "Kept frontmatter status: approved throughout; added a dated 2026-10-20 re-approval bullet in Document control and a change-log row reading 'Security review findings; owner approved 2026-10-20'", "result": "passed", "evidence": "Document control new 'Re-approval' bullet; Change log final row"},
{"check": "git hash-object on revised spec", "result": "passed", "evidence": "c2f2768047588d52248ebfea44bf734bbb0080b6"},
{"check": "git status shows only this spec and handoff among allowed paths touched by this agent", "result": "passed", "evidence": "`git status --porcelain` shows ` M workflow/specs/admin/ADM-01-manage-accounts.md` plus unrelated untracked files from other agents, not edited here"},
{"check": "npm run check:spec / build / tests / migration creation", "result": "not-run", "evidence": "out of role scope; no application code, tests, CI, or migration file touched"}
],
"unresolvedIssues": ["ADM-01-R8's is_protected mechanism remains open implementation detail, non-blocking", "Lecturer-deactivation interaction with Joseph's tables remains non-blocking, deferred", "Supabase public sign-up residual risk remains non-blocking, out of scope"]
}
<!-- HANDOFF:END -->

- Date: 2026-10-20 (fifth round)
- Task ID: TASK-ADM-01 (GitHub issue #18)
- Requirement / acceptance-criterion IDs: ADM-01-R1..R10 (R10 new), ADM-01-AC1..AC25 (AC23-AC25 new)
- Specification: `workflow/specs/admin/ADM-01-manage-accounts.md`
- Specification version or commit: content digest `c2f2768047588d52248ebfea44bf734bbb0080b6`
  (`git hash-object`); supersedes the prior digest `eaeb988ae03b27eb48447a7485be7eaad3e494bb`.
  Status stays `approved` throughout this round (material addition, owner pre-approved).
- Specification status and human approver: `approved`; Johannsen said "fix those issues," approving
  the automated security review's findings (items A/B/C in the coordinator's message; this spec
  covers item B, `ADM-01-R10`, and the shared documented limitation).
- Relevant context files this round: none newly read; built directly on the spec's existing content
  and this session's prior reads of `src/features/admin/accounts/password.ts`.
- Allowed edit scope this round: `workflow/specs/admin/ADM-01-manage-accounts.md`,
  `workflow/specs/shared/SH-06-change-own-password.md`, and both specs' handoffs. Nothing else.

## Decisions and assumptions

Owner decision 2026-10-20, relayed by the coordinator: approve three automated-security-review
findings. For ADM-01 (item B): `ADM-01-R10` — after an admin's password reset, revoke all of the
target's sessions/refresh tokens via a new admin-only security-definer RPC
`admin_revoke_sessions(target_id uuid)` (`set search_path = ''`, admin-only, refuses self and the
protected recovery admin, deletes the target's `auth.sessions` rows, `execute` to `authenticated`
only); if revocation fails after the password changed, return the distinct
`password_reset_sessions_not_revoked` rather than plain success.

Documented, not required (shared with `SH-06-R6`): an access token already issued stays valid until
it expires (≤ 1 hour default) because `getCurrentUser()` verifies it locally; only the refresh token
is revoked immediately. Mitigation for suspected compromise: deactivate first (`ADM-01-R6`,
immediate), then reset.

## Changes

- `workflow/specs/admin/ADM-01-manage-accounts.md`: added a dated 2026-10-20 "Re-approval" bullet
  and a "Confirmed" note in Document control; added `ADM-01-R10`; updated Technical constraints,
  Data model (new RPC), API error shapes, Security requirements (documented-limitation bullet), and
  two Edge-case rows; added `ADM-01-AC23`–`AC25` in the required bullet form; corrected stale
  "Review evidence"/"Open questions" text that still described the now-resolved R9 item as blocking;
  added a change-log row reading "Security review findings; owner approved 2026-10-20". Status
  stays `approved`.
- `workflow/specs/shared/SH-06-change-own-password.md`: see its own handoff.
- This handoff: revised for round 5.

## Evidence

| Command or check                                                 | Result  | Evidence                                                                                   |
| ---------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------ |
| `git hash-object workflow/specs/admin/ADM-01-manage-accounts.md` | passed  | `c2f2768047588d52248ebfea44bf734bbb0080b6`                                                 |
| Frontmatter `status:` field                                      | passed  | `approved`, unchanged by this round                                                        |
| `git status --porcelain`                                         | passed  | only this spec modified by this agent; other listed paths are other agents' untracked work |
| Application build/test/lint/CI/migration                         | not-run | out of role scope; none touched                                                            |

## Changes outside the owner's area

None by this agent. The untracked `src/features/admin/accounts/`, migration, and pgTAP test file
visible in `git status` remain other agents' in-progress work; `admin_revoke_sessions` is only
described in this spec, not implemented here.

## Findings and open questions

| #   | Severity | Finding                                                                                                                                                                   | Status                         |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| 1   | Info     | `ADM-01-R8`'s exact `is_protected` mechanism remains implementation detail, non-blocking.                                                                                 | Open, non-blocking             |
| 2   | Info     | Lecturer-deactivation interaction with Joseph's tables remains deferred to that feature's spec.                                                                           | Open, non-blocking             |
| 3   | Low      | The already-started implementation (untracked files noted in round 4) now needs to additionally account for `ADM-01-R10`'s new RPC before it can match the approved spec. | Flag for coordinator/developer |

## Next action

Coordinator confirms the in-progress implementation is updated to add `admin_revoke_sessions` and
the `password_reset_sessions_not_revoked` result per `ADM-01-R10`, then proceeds through
tester/security review as usual. No further spec change is pending on this agent's side.

Handoff evidence: workflow/handoffs/adm-01/2026-10-19-adm-01-requirements-architect.md
