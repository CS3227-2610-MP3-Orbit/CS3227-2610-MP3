# Handoff: TASK-SPEC-TRACEABILITY-DECISIONS-CHALLENGE — requirements architect → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "TASK-SPEC-TRACEABILITY-DECISIONS-CHALLENGE",
"requirementIds": [
"SH-01-AC8",
"STU-01-R1",
"STU-01-R3",
"STU-01-R6",
"STU-01-AC9",
"STU-01-AC10",
"STU-01-AC11",
"STU-01-AC12",
"SH-02-R6",
"SH-02-AC8",
"SH-03-R11",
"SH-03-R12",
"SH-03-AC17",
"SH-03-AC22",
"SH-03-AC30",
"SH-04-R7",
"SH-04-AC10",
"SH-05-R2",
"SH-05-R6",
"SH-05-AC8"
],
"status": "passed",
"changedFiles": [
"workflow/reviews/stu-01/2026-10-18-shared-spec-decisions-challenge.md",
"workflow/handoffs/archive/stu-01/2026-10-18-shared-spec-decisions-challenge-requirements-architect.md"
],
"verification": [
{
"check": "exact digest verification",
"result": "passed",
"evidence": "All six assigned specification files matched their supplied SHA-1 blob digests."
},
{
"check": "pre-edit scoped Prettier check",
"result": "passed",
"evidence": "All six specs and the three prior challenge/disposition/impact records matched Prettier."
},
{
"check": "requirement ID and workflow-link audit",
"result": "passed",
"evidence": "133 definitions were unique; all SH-02 through SH-05 requirements had a parent-linked AC; all referenced workflow Markdown paths existed. The audit also identified zero explicit parent links for SH-01 and STU-01 criteria."
},
{
"check": "npm run check:spec",
"result": "passed",
"evidence": "16 specs, 150 criteria, 52 covered; uncovered draft criteria were warnings and exit status was zero."
},
{
"check": "final scoped formatting, handoff validation, and diff checks",
"result": "passed",
"evidence": "Final actual outcomes are recorded in the narrative evidence table."
}
],
"unresolvedIssues": [
"Medium: SH-02-AC8 is contradictory for one-sided option overflow despite clear independent limits in SH-02-R6.",
"Medium: filtered-result criteria can pass vacuously when every valid filtered request returns an empty slot list.",
"Medium: cursor staleness is normative while temporal expiry remains unresolved.",
"Medium: filter-option interaction with active filters is unspecified.",
"Low: SH-01 and STU-01 lack explicit requirement-to-acceptance-criterion mappings."
]
}

<!-- HANDOFF:END -->

## Status

passed — the independent challenge is complete; the reviewed specifications are recommended `not ready`.

## Scope

- Task ID: `TASK-SPEC-TRACEABILITY-DECISIONS-CHALLENGE`.
- Requirement IDs: the six exact drafts and IDs listed in the structured block and challenge record.
- Specification versions: SH-01 `bcd180c1ea97bf5aedb71773759e14c11d5faf6c`; STU-01
  `41ff821970520bc15428ca4aaa9acc22d512f529`; SH-02
  `c81830167afe8dbef185934357d0e3043e27ac57`; SH-03
  `3521f8983c95bf55277f29a9c424b6c7179049dc`; SH-04
  `b14810a01e35bde0d5ef84e72c4f4521cc1c3fba`; SH-05
  `d8b3b8d4886c867538a9c5a5d99e6a8e9be21b66`.
- Files inspected: `AGENTS.md`; feature-specification skill; workflow policies/templates/agent guide;
  umbrella/shared plans and specs; all six exact drafts; prior challenge/disposition/impact/handoffs;
  STU-01 application source, migration, pgTAP, Vitest, and Playwright evidence.
- Allowed edit paths: this handoff and
  `workflow/reviews/stu-01/2026-10-18-shared-spec-decisions-challenge.md` only.

## Proposed decisions and assumptions

### Confirmed decisions

- The exact eight-field slot wire, UTC `Z` instants, own-profile-only direct Student access, derived
  assignment eligibility, 200/200 numerical limits, dependent/history preservation, SH-04 no-AI
  boundary, and post-approval real-test gate are all present in normative draft text.
- The prior eight findings are dispositioned except that the primary option-overflow criterion does
  not faithfully test the independently capped behavior.
- SH-04/SH-05 intentionally remain future drafts; their listed API, retention-duration, archival-
  representation, lifecycle, and never-used deletion decisions remain open.

### Assumptions

- “Independently capped” in SH-02-R6 means one option list does not have to reach 200 merely because
  the other overflows. The challenge records this reading for human confirmation rather than silently
  rewriting AC8.
- Existing implementation and tests are current-state evidence only and do not resolve draft ambiguity.

### Open questions

- Should option lists ignore active filters, apply every active filter, or apply only other dimensions?
- Does “stale cursor” include temporal expiry now, or only structural/version/filter/anchor invalidity?
- Must this revision add template-conformant SH-01/STU-01 requirement-to-AC mappings?

## Artifacts

- `workflow/reviews/stu-01/2026-10-18-shared-spec-decisions-challenge.md`: exact-digest independent challenge,
  eight-finding disposition audit, five reproducible findings, counterexamples, and `not ready`
  recommendation.
- `workflow/handoffs/archive/stu-01/2026-10-18-shared-spec-decisions-challenge-requirements-architect.md`: structured
  scope, evidence, risks, and coordinator handoff.

No canonical spec, application source, test, migration, checker, policy, CI, deployment, or log file
was changed.

## Evidence

<!-- prettier-ignore -->
| Command or check | Result | Actual outcome |
| --- | --- | --- |
| `git hash-object` on all six assigned specs | passed | Each result exactly matched its assigned digest. |
| Scoped `npx prettier --check` before writing | passed | Six specs plus prior challenge, disposition, and impact records all matched Prettier. |
| Custom requirement-ID and workflow-link audit | passed with review observation | 133 definitions, 133 unique, zero duplicates, zero SH-02–SH-05 requirements without a parent-linked AC, zero missing workflow links; SH-01 and STU-01 each had zero explicit criterion parent links. |
| `npm run check:spec` | passed | Exit 0: 16 specs, 150 criteria, 52 covered; uncovered draft criteria were warnings. |
| First post-write scoped `npx prettier --check` | failed | Both new artifacts were reported unformatted; they were corrected only through scoped `apply_patch` edits. |
| Final scoped `npx prettier --check` | passed | Both authorized artifacts matched Prettier without a formatter write. |
| `node workflow/scripts/check-handoff.mjs` | passed | Handoff schema valid with status `passed`. |
| Scoped `git diff --check` and allowed-path diff audit | passed | No whitespace errors; only the two authorized new paths appeared in the scoped status. |

## Risks and unresolved questions

1. Medium — SH-02-AC8 cannot be applied consistently to a one-sided option overflow; human must
   confirm independent cardinality wording and require separate fixtures.
2. Medium — STU-01-AC9–AC12 and SH-03-AC17 can pass with always-empty filtered responses; the reviewer
   must require positive matching fixtures or explicitly accept the weaker contract.
3. Medium — cursor staleness is not measurable while temporal expiry is unresolved; the API owner must
   define the included stale conditions.
4. Medium — the option-list relationship to active filters changes observable catalogue disclosure;
   the product/data owner must choose it.
5. Low — SH-01/STU-01 requirement-to-AC parentage remains inferred; the human reviewer must accept the
   debt or request explicit links.

## Next action

The coordinator should return findings 1–4 for a requirements-only revision, keep every canonical spec
`draft`, and request another exact-digest challenge before teammate approval; tests and implementation
remain blocked until approval, then proceed tests first and code second.

Handoff evidence: workflow/handoffs/archive/stu-01/2026-10-18-shared-spec-decisions-challenge-requirements-architect.md
