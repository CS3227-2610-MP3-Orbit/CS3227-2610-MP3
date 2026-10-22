# TASK-FSPEC-01: feature-specification independent challenge

- Feature and requirement IDs: `FSPEC-01` through `FSPEC-08`
- Draft skill: `.codex/skills/feature-specification/SKILL.md`
- Draft baseline: working tree based on `9dae2a00342f159c4211c056ab297fae715451fb`
- Original request: attached prompt supplied by the user
- Shared constraints reviewed: `AGENTS.md`, development-security and approval-gate policies, native agent
  workflow, spec/handoff templates, and the draft skill artifacts
- Review type: `independent`
- Reviewer: separately invoked `tester_verifier` in an explicitly read-only assignment
- Date: 2026-10-17

This record is independent agent evidence, not human approval. The repository has no native role dedicated
to draft-spec challenge; the skill now defaults future reviews to a fresh, read-only
`requirements_architect` assignment from the coordinator and otherwise requires self-review plus a human
handoff.

## Independently derived scenarios

- A developer invokes the skill and asks to edit an approved spec despite developer path restrictions.
- Buggy current behavior conflicts with approved intent and must not become a confirmed requirement.
- A proposed booking rule becomes an unconditional acceptance criterion.
- A material authorization revision leaves frontmatter apparently `approved`.
- An AC passes on a success toast without durable persistence, or proves safe rendering on one path while
  another path sends the same content to an LLM.
- Absent and inaccessible private resources return observably different errors.
- A dirty working tree is changed by a broad formatting command.
- The project-scoped skill is invoked from a stale session or a different checkout.

## Findings and disposition

| ID          | Severity | Affected artifact               | Counterexample or question                                                     | Why it matters                                                   | Proposed clarification                                                                                       | Human input                                          | Disposition                                             |
| ----------- | -------- | ------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------- |
| FSPEC-CH-01 | High     | Skill role/delegation flow      | A developer edits specs or a child delegates review.                           | Violates native role boundaries.                                 | State that the skill grants no authority; route unauthorized callers to impact evidence and the coordinator. | No                                                   | Applied.                                                |
| FSPEC-CH-02 | High     | `Confirmed` definition          | Accidental implementation behavior becomes a business rule.                    | Could legitimize a bug or disclosure.                            | Treat observed behavior only as current-state evidence.                                                      | No                                                   | Applied.                                                |
| FSPEC-CH-03 | High     | Template/example classification | Proposed one-request-per-slot behavior becomes unconditional requirements/ACs. | Obscures authority and can authorize implementation.             | Add classification/source per requirement and mark proposals as review targets.                              | Booking rules still need human decision.             | Applied to workflow and example; product choice open.   |
| FSPEC-CH-04 | High     | Stable IDs                      | Security/UI/NFR bullets lack traceable IDs.                                    | Tests cannot link all normative behavior.                        | Require stable IDs for every normative requirement category.                                                 | No                                                   | Applied.                                                |
| FSPEC-CH-05 | High     | Revision/approval state         | Material auth change leaves canonical status approved.                         | Stale approval may appear current.                               | Make frontmatter canonical, reset material revisions to draft, retain prior digest.                          | No                                                   | Applied.                                                |
| FSPEC-CH-06 | Medium   | Reviewer role                   | `tester_verifier` normally starts from an approved spec.                       | The challenge owner was underspecified.                          | Coordinator assigns a fresh read-only requirements architect; otherwise self-review and handoff.             | Teammate may choose a different future role.         | Applied as default; governance choice open.             |
| FSPEC-CH-07 | Medium   | Status/example IDs              | Impact states and `STU-EX-01` differ from repository vocabulary.               | Tooling/reviewer ambiguity.                                      | Normalize status and use a clearly non-production `EXAMPLE-` prefix.                                         | Canonical production allocation remains human-owned. | Applied.                                                |
| FSPEC-CH-08 | Medium   | Mandatory entry-point auth      | Generic actor table omits `requireRole` at one boundary.                       | A spec may look complete while violating a repository invariant. | Add inherited-control/entry-point mapping and demonstrate it.                                                | No                                                   | Applied.                                                |
| FSPEC-CH-09 | Medium   | Example AC1/AC5                 | Toast passes as persistence; one safe view hides another LLM call.             | Criteria can pass while intent fails.                            | Requery authoritative state and instrument zero provider calls across relevant paths.                        | No                                                   | Applied.                                                |
| FSPEC-CH-10 | Medium   | Private-resource errors         | Absent/inaccessible IDs return distinguishable errors.                         | Enables resource enumeration.                                    | Propose one neutral response; leave exact status/timing to product review.                                   | Yes.                                                 | Proposal recorded; UX decision open.                    |
| FSPEC-CH-11 | Medium   | Logs                            | No explicit destination/data boundary.                                         | Can invent structure or copy sensitive prompt content.           | Use documented task-log convention only; factual metadata, no raw/untrusted/private content.                 | Teammate confirms convention.                        | Skill tightened; current log awaits human verification. |
| FSPEC-CH-12 | Low      | Usage limitations               | Skill is invoked outside the checkout or before session reload.                | Discovery is project/session scoped.                             | Document checkout, trust, fresh-session, and machine limitations.                                            | No                                                   | Applied.                                                |
| FSPEC-CH-13 | Low      | Formatting                      | Broad formatter modifies unrelated dirty files.                                | Damages user-owned work.                                         | Check first; write-format only explicitly authorized paths.                                                  | No                                                   | Applied.                                                |

## Independently observed checks

- Skill structural validation: passed using `python3 .../quick_validate.py`.
- Prettier: passed on reviewed artifacts after the coordinator's formatting pass.
- Spec traceability: passed with existing uncovered-draft warnings; 12 specs, 92 criteria, 13 covered at
  review time.
- Patch hygiene: passed.
- Fresh-session discovery: not run by the reviewer; subsequently run by the coordinator and passed.

## Readiness recommendation

- Recommendation: `ready for human review` after the coordinator applies and revalidates dispositions.
- Blocking agent-authored findings: none after correction.
- Required human decisions: reviewer-role governance if the default is unsuitable; consultation eligibility,
  topic limit, booking uniqueness/state behavior, private-resource error UX, production IDs, and acceptance
  of the task-owned log convention.
- Approval boundary: `.codex` changes require independent teammate review before merge.
