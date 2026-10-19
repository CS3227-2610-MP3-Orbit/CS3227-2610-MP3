# STU-02 pre-implementation consistency review

- Task: STU-02-P0; independent assigned requirements_architect; 2026-10-18.
- Source: `workflow/specs/student/STU-02-request-consultation.md`, approved content digest
  `f84c874a726d77a3060b15170bf6be1883202691`; team approval reported by Joseph in
  `workflow/handoffs/stu-02/latest.md`.
- Scope: R1–R10 and AC1–AC19, shared permissions, response fields, and unresolved creation decisions.
- Allowed edits: this review and STU-02 approval metadata only. No application/test/shared-spec edits.
- Skill: feature-specification; full skill read. No delegation.

## Result

No blocking contradiction found in the request-only slice. Implementation may begin under the existing
team-reported approval. Proposal labels in the original text are provenance, not unanswered questions.
The metadata update records existing approval and does not change normative behavior.

## Cross-contract findings and dispositions

| Finding                                                                | Severity                 | Evidence and disposition                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Old pending-approval prose                                             | Low                      | STU-02 already has approved frontmatter and exact-digest human-report evidence. Synchronize prose only. Shared draft labels are recorded historical metadata; no shared status or requirement changed.                                                                                                                                                                                  |
| Browse projection versus request lookup                                | Informational            | SH-02/SH-03 explicitly scope their no-mutation/eight-field boundary to browsing. STU-02-R1/R8 separately authorizes eight slot fields plus slotVersion through narrow lookup; receipts contain only bookingId/slotId/status. Do not extend browse responses or direct table grants. SH-01 explicitly permits feature-specific narrow RPCs. No permission override is needed.            |
| Completed bookings called inactive in INT-01                           | Informational            | Inactive status does not promise slot reuse. SH-03-R5, SH-05-R4 and STU-02-R3 explicitly forbid completed-slot reuse, including future legacy records. Implement that common explicit invariant.                                                                                                                                                                                        |
| Shared unresolved mutation decisions                                   | Informational            | STU-02 supplies the approved text/interval/retry/version/timeout contracts. Cancellation, archival, slot duration/horizon and lifecycle remediation concern excluded mutations. Preserve existing bookings; do not invent their workflows.                                                                                                                                              |
| Existing browse code and fixtures differ from some latest requirements | Medium verification risk | Browse schemas still have unbounded option arrays and lecturer name rather than shared displayName; request lookup must follow its own exact approved fields. Existing fixtures include legacy blank questions and overlapping intervals. Preserve regression tests and distinguish fixture incompatibility from feature defects. Separate STU-01 follow-up remains outside this slice. |

## Independently derived test scenarios

- A later-page slot is directly addressable without any reservation on GET/refresh.
- A replay after cancellation returns the old receipt; a fresh intent may reserve again without deleting history.
- Two students race for one slot; one student races for overlapping slots; same-key replay races itself.
- A lock waiter crosses start time, or assignment/profile/course eligibility changes while waiting.
- A wrong-role or deactivated caller invokes lookup/create/recovery directly; no private receipt escapes.
- A response is lost after commit; invalid output must not be presented as definite rollback.
- Unicode code-point boundaries, trim equivalence, duplicate fields, NUL and unknown fields fail safely.
- A changed slot version never silently reserves new details; markup and model instructions remain inert.

## Scoped acceptance and dependency checklist

All 19 STU-02 criteria require evidence: AC1–2 navigation/create; AC3–7 validation/history/conflicts;
AC8–9 role/owner isolation; AC10–13 real concurrent retry/version/lifecycle cases; AC14 uncertainty;
AC15–16 injection/resource/origin boundaries; AC17 accessibility; AC18 no AI; AC19 exact projections.
Do not infer passing criteria from test-name presence.

Shared dependencies: SH-01-AC1/2/3/8; SH-02 current active assignment and catalogue-wide eligibility;
SH-03-R1/R5/R6/R11 and AC8/9/10/18/19/20; SH-05-R2/R4/R5/R8/R9 and
AC3/6/7/9/10/12/13; PRD-01-AC1/2/3/9/10; INT-01 logical request/state contracts.
Full-project traceability and feature-scoped execution must be reported separately. Unimplemented
other-role mutations and unrelated draft criteria are not evidence against these scoped tests.

## Inspected evidence and limitations

Read AGENTS, skill, approval/security policies, STU-02 and plan/latest handoff, SH-01/02/03/05,
PRODUCT/INTEGRATION, challenge/handoff templates, auth/session, browse server, browse migration schema,
and initial pgTAP fixture setup. No application or database tests were executed by this reviewer.
Current schema has table grant denial and a single-active-slot index; no request implementation is
claimed by this preflight. The coordinator owns disposable test infrastructure and runtime evidence.

## Next step

Coordinator assigns test preparation and generator work against this frozen normative specification;
verifiers must validate fixtures/assertions before defect claims and identify their reviewed code version.
Independent human review remains required before sensitive changes merge or deploy.
