# Handoff: TASK-ADM-01 / ADM-01-R1..R8, AC1..AC17 — requirements_architect → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-ADM-01",
"requirementIds": ["ADM-01-R1", "ADM-01-R2", "ADM-01-R3", "ADM-01-R4", "ADM-01-R5", "ADM-01-R6", "ADM-01-R7", "ADM-01-R8"],
"status": "incomplete",
"changedFiles": ["workflow/specs/admin/ADM-01-manage-accounts.md", "workflow/handoffs/adm-01/2026-10-19-adm-01-requirements-architect.md"],
"verification": [
{"check": "Rounds 1-2: initial reads and round-1 revision (credential/RPC/admin-creation confirmed, R7 added proposed)", "result": "passed", "evidence": "see prior round evidence; unchanged for this round"},
{"check": "Moved ADM-01-R7 from proposed to confirmed per owner decision 2026-10-19", "result": "passed", "evidence": "spec R7 heading now reads 'confirmed; source: owner decision 2026-10-19'"},
{"check": "Added ADM-01-R8 (protected recovery administrator) as instructed, capability confirmed / mechanism proposed", "result": "passed", "evidence": "spec 'Functional requirements' R8; is_protected column/index/migration-time-marking explicitly tagged proposed, not the capability"},
{"check": "Data model updated: admin_set_role/admin_set_active also refuse is_protected targets; migration adds profiles.is_protected with partial unique index, marks earliest admin, keeps policy drop", "result": "passed", "evidence": "spec 'Data model and integrity rules' section"},
{"check": "API error shapes include forbidden_protected; listAccounts returns isProtected", "result": "passed", "evidence": "spec 'API and boundary contracts' section"},
{"check": "Added AC15 (pgTAP: other admin refused on protected target), AC16 (pgTAP: no role can write is_protected), AC17 (unit+e2e: list UI hides/disables controls on protected row); kept AC14", "result": "passed", "evidence": "spec 'Acceptance criteria' table rows AC14-AC17"},
{"check": "Added Security note: protected-account credential leak is an accepted risk requiring the service-role key", "result": "passed", "evidence": "spec 'Security requirements' accepted-risks bullet"},
{"check": "Updated Edge cases for protected-admin self-attempt and other-admin-targets-protected cases", "result": "passed", "evidence": "spec 'Edge cases and failure paths' table, two new rows"},
{"check": "Removed the R7-pending-confirmation open question (now resolved); kept lecturer-deactivation interaction as non-blocking note; added R8 mechanism as the one remaining non-blocking implementation detail", "result": "passed", "evidence": "spec 'Open questions blocking approval' section"},
{"check": "Spec status stays draft", "result": "passed", "evidence": "frontmatter `status: draft` unchanged"},
{"check": "Spec length <= ~270 lines", "result": "passed", "evidence": "`wc -l` = 270 after five trimming passes (282 -> 279 -> 276 -> 274 -> 271 -> 270)"},
{"check": "git hash-object on revised spec", "result": "passed", "evidence": "4113107efe36a8af7119f5c32428b4abf745e314"},
{"check": "git status shows only the two allowed paths changed", "result": "passed", "evidence": "`git status --porcelain` lists only workflow/specs/admin/ADM-01-manage-accounts.md and workflow/handoffs/adm-01/"},
{"check": "npm run check:spec / build / tests / migration creation", "result": "not-run", "evidence": "out of role scope; no application code, tests, CI, or migration file touched"}
],
"unresolvedIssues": ["ADM-01-R8's is_protected mechanism (column/index/migration-time marking) is implementation detail, open for review", "Lecturer-deactivation interaction with course_lecturers/consultation_slots/bookings remains a non-blocking open item for that feature's own spec"]
}
<!-- HANDOFF:END -->

- Date: 2026-10-19 (third round, same day)
- Task ID: TASK-ADM-01 (GitHub issue #18)
- Requirement / acceptance-criterion IDs: ADM-01-R1..R8 (R8 new, R7 now confirmed),
  ADM-01-AC1..AC17 (AC15-AC17 new)
- Specification: `workflow/specs/admin/ADM-01-manage-accounts.md`
- Specification version or commit: content digest `4113107efe36a8af7119f5c32428b4abf745e314`
  (`git hash-object`), superseding round-2 digest `4e1850a0bcb1c1a33e39701d5655e24ace2427aa`;
  reviewed repository HEAD unchanged at `3c8ba194d06439183318b66ba4824e8dc0521c1f`.
- Specification status and human approver: `draft`; not yet approved by any human.
- Relevant context files: unchanged from round 1; no new files read this round.
- Allowed edit scope: `workflow/specs/admin/ADM-01-manage-accounts.md` and this handoff only.
- Agent session log: none written outside the allowed paths; this handoff is the record.

## Decisions and assumptions

Owner decisions 2026-10-19, relayed verbatim in substance by the coordinator: (1) `ADM-01-R7`
(no zero-active-admin outcome, including two admins concurrently demoting/deactivating each other) is
confirmed. (2) New `ADM-01-R8`: exactly one protected recovery administrator per environment; no one,
including itself, can change its role or deactivate it through the app or `admin_set_role`/
`admin_set_active`; the protection flag is settable only by a migration or the service-role
script/SQL; the list UI hides/disables its controls; `R8` implies `R7` whenever a protected admin
exists, and `R7` stays as defence in depth otherwise. The exact mechanism (`profiles.is_protected`
column, unique partial index, migration-time marking of the earliest admin) is tagged `proposed` as
instructed — the capability is confirmed, the mechanism is not.

Unchanged, non-blocking: lecturer-deactivation interaction with Joseph's `course_lecturers`/
`consultation_slots`/`bookings` remains for that feature's own spec.

## Changes

- `workflow/specs/admin/ADM-01-manage-accounts.md` (revised, still `draft`): moved `ADM-01-R7` to
  confirmed; added `ADM-01-R8` (capability confirmed, mechanism proposed); updated `ADM-01-R3` to
  also exclude the protected admin as a target; updated Data model (RPCs additionally refuse
  `is_protected` targets; migration adds the `is_protected` column/index/marking); updated API error
  shapes (`forbidden_protected`, `isProtected` field); updated UI description (protected badge,
  disabled controls); added two Security accepted-risk notes; added two Edge-case rows; added
  `ADM-01-AC15`-`AC17`; emptied "Open questions blocking approval" of the R7 item, leaving only the
  R8-mechanism and lecturer-deactivation non-blocking notes; added a change-log row.
- `workflow/handoffs/adm-01/2026-10-19-adm-01-requirements-architect.md` (revised): this handoff.

## Evidence

| Command or check                                                 | Result  | Evidence                                   |
| ---------------------------------------------------------------- | ------- | ------------------------------------------ |
| `git hash-object workflow/specs/admin/ADM-01-manage-accounts.md` | passed  | `4113107efe36a8af7119f5c32428b4abf745e314` |
| `wc -l workflow/specs/admin/ADM-01-manage-accounts.md`           | passed  | 270 (coordinator's stated max)             |
| `git status --porcelain`                                         | passed  | only the two allowed paths listed          |
| Frontmatter `status:` field                                      | passed  | still `draft`                              |
| Application build/test/lint/CI/migration                         | not-run | out of role scope; none touched            |

## Changes outside the owner's area

None. No file under `src/`, `supabase/migrations/`, `.github/`, or any test directory was created or
modified; `is_protected` and the RPCs remain a proposed migration description, not a migration file.

## Findings and open questions

| #   | Severity | Finding                                                                                                                              | Status             |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| 1   | Info     | `ADM-01-R8`'s exact mechanism is implementation detail tagged `proposed`; the capability itself is owner-confirmed and not blocking. | Open, non-blocking |
| 2   | Info     | Lecturer-deactivation interaction with Joseph's tables remains unresolved, by design, for that feature's own spec.                   | Open, non-blocking |

## Next action

Human (Johannsen) reviews the revised draft and, if satisfied, approves it (status → `reviewed`/
`approved`), optionally confirming or adjusting `ADM-01-R8`'s proposed mechanism during implementation
review. No implementation, including the proposed migration, should begin before that approval, per
`AGENTS.md` ("spec → tests → code").

Handoff evidence: workflow/handoffs/adm-01/2026-10-19-adm-01-requirements-architect.md
