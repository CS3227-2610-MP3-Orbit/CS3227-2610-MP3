# Handoff: STU-06-SPEC revision — requirements architect → coordinator and human reviewer

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "STU-06-SPEC-REVISION",
"requirementIds": [
"STU-06-R1",
"STU-06-R2",
"STU-06-R3",
"STU-06-R4",
"STU-06-R5",
"STU-06-R6",
"STU-06-R7",
"STU-06-R8",
"STU-06-R9",
"STU-06-R10",
"STU-06-AC1",
"STU-06-AC2",
"STU-06-AC3",
"STU-06-AC4",
"STU-06-AC5",
"STU-06-AC6",
"STU-06-AC7",
"STU-06-AC8"
],
"status": "incomplete",
"changedFiles": [
"workflow/specs/student/STU-06-read-guidelines-and-announcements.md",
"workflow/handoffs/stu-06/latest.md"
],
"verification": [
{
"check": "GitHub PR evidence inspection",
"result": "passed",
"evidence": "PR #38 is OPEN at 9f71393245c755300dba5e47f1350f9ff09f8ff7 with reported CI checks successful; PR #36 is MERGED and PR #37 is OPEN."
},
{
"check": "approved ADM-03 and PR #38 implementation/test review",
"result": "passed",
"evidence": "Revision aligns with ADM-03-R5/R7/R8/R9/R10 and AC7/8/11/12/13/14/15; observed code remains open-PR evidence only."
},
{
"check": "format, whitespace and spec-traceability checks",
"result": "passed",
"evidence": "Prettier check and git diff --check passed; npm run check:spec exited 0 with 31 specs, 353 criteria, and 218 covered. Draft STU-06 criteria remain expected warnings until approval/tests."
}
],
"unresolvedIssues": [
"Exact revised STU-06 digest needs explicit teammate approval; the PR #38 review comment is not assumed to approve this later document.",
"Student-specific empty/unavailable rendering and responsive/accessibility criteria AC6/AC7 are not fully covered by ADM-03's acceptance tests."
]
}
<!-- HANDOFF:END -->

- Date: 2026-10-22
- Task ID: `STU-06-SPEC-REVISION`
- Requirement / acceptance-criterion IDs: `STU-06-R1`–`R10`, `STU-06-NFR1`–`NFR4`,
  `STU-06-AC1`–`AC8`
- Specification: `workflow/specs/student/STU-06-read-guidelines-and-announcements.md`
- Specification version: prior digest `90b4f675591b3f7e3c092ace75dec0f938aa84f2` invalidated;
  revised digest `62b193c5c6c78abf97c1f5d931b29395c2d8babd`
- Specification status and human approver: `draft`; exact revision not explicitly approved
- Relevant evidence: approved ADM-03 and implementation at open PR #38 head
  `9f71393245c755300dba5e47f1350f9ff09f8ff7`; PR #36 merged; PR #37 open
- Allowed edit scope: STU-06 spec and this handoff only
- Agent session log: none edited

## Decisions and assumptions

Confirmed by approved ADM-03: `guideline | announcement`; title 1–120/body 1–2,000 trimmed;
boolean publication; no scheduling/hard delete; direct RLS reads; active users read published only; all
guidelines plus newest five announcements by `created_at DESC, id DESC`; bucketed
`id/title/body/updatedAt` arrays; full plain text with line breaks; Student dashboard card; safe
empty/unavailable states; no AI.

No product decision remains open. The revision stays draft because the exact STU-06 digest has not been
explicitly approved in this turn.

## Changes

- Replaced obsolete first-draft proposals with approved ADM-03.
- Removed standalone route/nav, 50-item cap, `publishedAt`, hidden ID, Student-only shared reader, and
  obsolete lifecycle questions.
- Recorded PR #38's implementation as open/unmerged evidence, not current `develop` behavior.
- Mapped shared criteria to ADM-03 tests and isolated Student-specific AC6/AC7 gaps.
- Changed no code, test, migration, shared/admin spec, plan, CI, or log.

## Evidence

| Command or check                                              | Result | Evidence                                                                                                      |
| ------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| `gh pr view 38`                                               | passed | OPEN at specified head; reported Verify, Database rules, End-to-end, and Accounts/passwords checks successful |
| `gh pr view 36` / `gh pr view 37`                             | passed | PR #36 MERGED; PR #37 OPEN                                                                                    |
| Inspect approved ADM-03 at PR #38 head                        | passed | Confirmed relevant R5/R7/R8/R9/R10 and AC7/8/11/12/13/14/15                                                   |
| Inspect shared reader/card/schema/tests and verifier handoffs | passed | Confirmed implementation evidence and Student-specific AC6/AC7 gap                                            |
| `npx prettier --check` on the two authorized paths            | passed | Both files use Prettier style                                                                                 |
| `git diff --check`                                            | passed | No whitespace errors                                                                                          |
| `npm run check:spec`                                          | passed | Exit 0: 31 specs, 353 criteria, 218 covered; draft STU-06 warnings are expected pending approval/tests        |

## Changes outside the owner's area

None. Only the two authorized STU-06 workflow files changed.

## Findings and open questions

| #   | Severity          | Finding                                                                           | Status                               |
| --- | ----------------- | --------------------------------------------------------------------------------- | ------------------------------------ |
| 1   | High (gate)       | Exact revised STU-06 digest lacks explicit teammate approval                      | Open; blocks approved status         |
| 2   | Medium (coverage) | ADM-03 tests do not fully assert Student empty/unavailable card states            | Open STU-06-AC6 gap                  |
| 3   | Medium (coverage) | Maximum-bound responsive/accessibility behavior lacks ADM-03 coverage             | Open STU-06-AC7 gap                  |
| 4   | Info              | PR #38 contains conforming code but is open/unmerged                              | Evidence only; absent from `develop` |
| 5   | Info              | Tester noted misleading duplicate AC12 labeling; sound evidence exists separately | Preserve limitation when citing AC12 |

## Next action

Joseph/team reviews the exact revised STU-06 digest. After approval, add only AC6/AC7 coverage or record
its limitation, then verify against the final integrated PR #38 version. Do not duplicate existing
ADM-03 database/shared-reader tests solely to change their labels.

## Human review

- Reviewed by: pending exact STU-06 review
- Decision: not yet made
- Notes: Joseph's PR #38 “Looks good!” is implementation-review evidence, not silently converted into
  approval of this later STU-06 revision.
