# Handoff: TASK-ADM-01 / ADM-01-R1..R9, AC1..AC22 — requirements_architect → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-ADM-01",
"requirementIds": ["ADM-01-R1", "ADM-01-R2", "ADM-01-R3", "ADM-01-R4", "ADM-01-R5", "ADM-01-R6", "ADM-01-R7", "ADM-01-R8", "ADM-01-R9"],
"status": "incomplete",
"changedFiles": ["workflow/specs/admin/ADM-01-manage-accounts.md", "workflow/handoffs/adm-01/2026-10-19-adm-01-requirements-architect.md"],
"verification": [
{"check": "Noted the spec had been approved (status: approved) at commit 7f6c579, content at draft commit 1b373c9, and that application code (src/features/admin/accounts/, a new migration, a new pgTAP test file) exists untracked from other agents' work", "result": "passed", "evidence": "git log showed 7f6c579 'Approve ADM-01 spec (owner approval)' at HEAD; git status --porcelain showed the untracked implementation files, none of which this agent touched"},
{"check": "Read src/features/admin/accounts/password.ts to cite generateInitialPassword() accurately in R9", "result": "passed", "evidence": "confirmed 24-char A-Z/a-z/0-9 generator via crypto.randomInt, matching the coordinator's description exactly"},
{"check": "Set frontmatter status: approved -> draft (material change)", "result": "passed", "evidence": "spec frontmatter now reads status: draft"},
{"check": "Kept the prior approval line, marked superseded, citing commit 7f6c579", "result": "passed", "evidence": "Document control 'Approval' bullet retains the 1b373c9 approval record and adds '**Superseded**: approval at 7f6c579 superseded by the ADM-01-R9 change...'"},
{"check": "Added ADM-01-R9 (admin resets another user's password): confirmed capability; protected-admin refusal tagged 'Proposed - pending owner confirmation' per the coordinator's own correction mid-instruction", "result": "passed", "evidence": "spec 'Functional requirements' R9 section"},
{"check": "Recorded R9's session-revocation question as Open, non-blocking, with residual risk", "result": "passed", "evidence": "R9 paragraph's final sentence and 'Open questions blocking approval' non-blocking list"},
{"check": "Updated UI description for the shared one-time-password panel (Copy + Done, applies to R1 and R9)", "result": "passed", "evidence": "UI description section, new sentence"},
{"check": "Updated API contract: resetPassword({targetId}) action with forbidden_self_change/forbidden_protected/forbidden_or_not_found", "result": "passed", "evidence": "'API and boundary contracts' section"},
{"check": "Updated Data model note: R9 uses auth.admin.updateUserById via the service-role client, no new table/column", "result": "passed", "evidence": "'Data model and integrity rules' section"},
{"check": "Added two Edge-case rows and AC18-AC22 (continuing from AC17) per the requested list", "result": "passed", "evidence": "'Edge cases' table and 'Acceptance criteria' table"},
{"check": "Added the R9 protected-admin-refusal confirmation as the one blocking open item; added change-log row", "result": "passed", "evidence": "'Open questions blocking approval' and 'Change log' sections"},
{"check": "git hash-object on revised spec", "result": "passed", "evidence": "eaeb988ae03b27eb48447a7485be7eaad3e494bb"},
{"check": "git status shows only this spec and handoff among allowed paths touched by this agent", "result": "passed", "evidence": "`git status --porcelain` shows ` M workflow/specs/admin/ADM-01-manage-accounts.md` plus unrelated untracked files from other agents (not edited by this agent)"},
{"check": "npm run check:spec / build / tests / migration creation", "result": "not-run", "evidence": "out of role scope; no application code, tests, CI, or migration file touched"}
],
"unresolvedIssues": ["ADM-01-R9's protected-admin refusal is the coordinator's own proposal, not yet owner-confirmed; blocking re-approval", "Whether a password reset (R9) should revoke the target's existing sessions is Open, non-blocking", "ADM-01-R8's is_protected mechanism remains open implementation detail, non-blocking", "Lecturer-deactivation interaction with Joseph's tables remains non-blocking, deferred"]
}
<!-- HANDOFF:END -->

- Date: 2026-10-19 (fourth round, same day)
- Task ID: TASK-ADM-01 (GitHub issue #18)
- Requirement / acceptance-criterion IDs: ADM-01-R1..R9 (R9 new), ADM-01-AC1..AC22 (AC18-AC22 new)
- Specification: `workflow/specs/admin/ADM-01-manage-accounts.md`
- Specification version or commit: content digest `eaeb988ae03b27eb48447a7485be7eaad3e494bb`
  (`git hash-object`); supersedes the approved draft content at commit `1b373c9` (digest `da79c65`)
  and the approval recorded at commit `7f6c579`. Reviewed repository HEAD at start of this round:
  `7f6c579` (branch `feature/admin-registration`).
- Specification status and human approver: reset from `approved` to `draft` by this agent per the
  coordinator's explicit instruction, because `ADM-01-R9` is a material requirement change. The
  prior Johannsen approval record is retained in Document control, marked superseded.
- Relevant context files this round: `src/features/admin/accounts/password.ts` (read to cite
  `generateInitialPassword()` accurately); git log/status (to confirm the approval commit and the
  untracked implementation files other agents have added). No other new reads.
- Allowed edit scope this round: `workflow/specs/admin/ADM-01-manage-accounts.md`, this handoff,
  `workflow/specs/shared/SH-06-change-own-password.md`, and
  `workflow/handoffs/sh-06/2026-10-19-sh-06-requirements-architect.md`. Nothing else was touched;
  the untracked `src/features/admin/accounts/`, the new migration, and the new pgTAP test file
  visible in `git status` belong to other agents' work and were not edited by this agent.

## Decisions and assumptions

Owner decisions 2026-10-19, relayed verbatim in substance by the coordinator: `ADM-01-R9` is
confirmed — an admin resets another user's password using the same generator
(`generateInitialPassword()`) and one-time-reveal UI as account creation; refused for the caller's
own account (must use the new `SH-06`), an unknown target, and non-admin/signed-out callers.
Implementation is server-side (`auth.admin.updateUserById`) after `requireRole("admin")` and a
server-side self/protected check; never logged or stored.

The sub-rule refusing a reset on the protected recovery administrator (`ADM-01-R8`) is explicitly
**not** an owner decision yet — the coordinator's message proposed it and said it is being put to
the owner — so this agent tagged it "Proposed — pending owner confirmation" rather than confirmed,
and listed it as the one item blocking re-approval.

The question of whether a reset should revoke the target's other sessions was given to this agent
as explicitly Open/non-blocking, and is recorded that way, with its residual risk stated.

## Changes

- `workflow/specs/admin/ADM-01-manage-accounts.md`: frontmatter `approved` → `draft`; prior approval
  bullet kept and marked superseded; added `ADM-01-R9`; updated the Document control
  confirmed/proposed summary, UI description, API contract, Data model note, two Edge-case rows,
  five new ACs (AC18–AC22), "Open questions blocking approval" (R9's protected-admin rule now the
  one blocking item), and a change-log row.
- `workflow/specs/shared/SH-06-change-own-password.md` (new): see its own handoff for detail.
- This handoff: revised for round 4.

## Evidence

| Command or check                                                 | Result  | Evidence                                                                                   |
| ---------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------ |
| `git log --oneline -3`                                           | passed  | confirmed HEAD `7f6c579` "Approve ADM-01 spec", parent `1b373c9` "Draft ADM-01..."         |
| `cat src/features/admin/accounts/password.ts`                    | passed  | confirmed 24-char generator exactly as the coordinator described                           |
| `git hash-object workflow/specs/admin/ADM-01-manage-accounts.md` | passed  | `eaeb988ae03b27eb48447a7485be7eaad3e494bb`                                                 |
| Frontmatter `status:` field                                      | passed  | now `draft`                                                                                |
| `git status --porcelain`                                         | passed  | only this spec modified by this agent; other listed paths are other agents' untracked work |
| Application build/test/lint/CI/migration                         | not-run | out of role scope; none touched                                                            |

## Changes outside the owner's area

None by this agent. `src/features/admin/accounts/`, `supabase/migrations/20261019000000_admin_account_management.sql`,
and `supabase/tests/admin_account_management.test.sql` appear as untracked files in `git status` —
they are other agents' (developer/tester) work in progress, not created, read in detail, or
modified by this requirements-architect round.

## Findings and open questions

| #   | Severity | Finding                                                                                                                                                                                                                                                                       | Status               |
| --- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 1   | Medium   | `ADM-01-R9`'s refusal for the protected recovery admin is a coordinator proposal awaiting explicit owner confirmation; implementation should not assume it is settled.                                                                                                        | Blocking re-approval |
| 2   | Info     | Whether a password reset revokes the target's other sessions is unresolved (Supabase admin API limits).                                                                                                                                                                       | Open, non-blocking   |
| 3   | Info     | The spec was approved and then implementation apparently began (untracked feature/migration/test files) before this material change; the coordinator should confirm whether that in-progress work needs to be reconciled against `ADM-01-R9` and the restored `draft` status. | Flag for coordinator |

## Next action

Human (Johannsen) confirms or revises the protected-admin refusal in `ADM-01-R9`, then re-approves
the spec. The coordinator should also confirm whether the already-started implementation (visible
as untracked files) proceeds, pauses, or is reconciled against this draft before further work, since
`AGENTS.md` requires spec → tests → code and this spec is no longer `approved`.

Handoff evidence: workflow/handoffs/adm-01/2026-10-19-adm-01-requirements-architect.md
