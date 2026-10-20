# STU-05 improve-request implementation plan

Draft plan for `workflow/specs/student/STU-05-improve-request.md`; it is not implementation authority.

## Revised baseline and completed specification gate

- Repository baseline remains commit `4b98534283486b34a3c38ef88866fd5f8652e2d9` with an uncommitted
  STU-05 implementation in the shared working tree.
- Prior approved STU-05 digest: `a8f8c94cffa58bcf88d5721dd211027a4713b98b`. The 2026-10-20
  structured editable-proposal revision was material and temporarily reset the canonical specification to
  `draft`.
- Current implementation returns and renders one plain-text blob. It does not provide the revised strict
  structured result, editable proposal, Apply/Dismiss controls, stale-form warning, or accurate call-cost
  messaging. Existing AC3/AC6/AC12 verification is stale for the revised contract; AC16/AC17 have no tests.
- Joseph reported that the team approved the exact revised draft digest
  `d0c86cfacf4dcd445dd883e7e5c28f120dde58adac7e5a8692d8323ea1ef5feb` and requested
  implementation. This completes `STU-05-UI-P0` as product/specification approval only; it does not
  authorize merge, deployment, credentials, or sensitive shared changes.
- `RET-05-01` remains independently unresolved: the repository has no durable scheduler proving deletion
  of attempt metadata within 30 days.

## Dependency map and bounded tasks

| Task         | Owner                               | Requirements / criteria                       | Allowed work and completion evidence                                                                                                                                                    | Depends on |
| ------------ | ----------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| STU-05-UI-P0 | Human + requirements architect      | R2/R3/R8; AC3/AC6/AC12/AC16/AC17              | Exact strict JSON/result shape, bounds, Apply/Dismiss/regenerate semantics and stale-form disclosure reviewed at the recorded draft digest                                              | Complete   |
| STU-05-UI-P1 | tester_verifier                     | AC3/AC6/AC12/AC16/AC17                        | Replace stale single-text fixtures with strict structured-output cases; add component/E2E tests for editing, Apply, Dismiss, stale overwrite disclosure, accessibility, and call count  | P0         |
| STU-05-UI-P2 | developer                           | R3/R6; AC6                                    | In feature-owned validation/server files, request strict JSON, parse with an exact schema, enforce all bounds, and return only validated structured fields                              | P0, P1     |
| STU-05-UI-P3 | developer, owner of Student UI      | R2/R5/R8; AC3/AC12/AC16/AC17                  | In the request form, add the editable proposal card, literal suggestion list, Apply/Dismiss/Generate-again behavior, source-snapshot warning, labels, announcements and call disclosure | P2         |
| STU-05-UI-P4 | developer, shared gateway owner     | R3/R6; AC4/AC6                                | Reconcile the feature-specific strict JSON validator with shared gateway validation without changing unrelated AI contracts; retain typed failure/release behavior                      | P2         |
| STU-05-UI-P5 | tester_verifier + security_reviewer | Revised AC3/AC6/AC12/AC16/AC17 plus prior ACs | Independently verify the same final code version, including setup/assertion validation, hostile fields, no partial result, no Apply/Dismiss side effect, and unchanged auth/quota rules | P3, P4     |
| STU-05-UI-P6 | developer, then relevant verifier   | Confirmed findings                            | Up to two fix/recheck rounds; return missing requirements or contract changes to specification review                                                                                   | P5         |

`STU-05-UI-P2/P3/P4` overlap in shared result types and must be sequenced under one integration owner
unless separate worktrees and explicit interface ownership prevent overlapping edits. Accounting SQL,
quota values, authentication, environment configuration, and unrelated booking behavior are out of scope.

## Interface contract for implementation review

- Provider text: one strict JSON object with exactly `topic`, `questions`, and `suggestions`.
- Successful Server Action result:
  `{ kind: "success", proposal: { topic: string, questions: string, suggestions: string[] } }`.
- Client-only transitions: Apply validates and copies proposed topic/questions; Dismiss clears only the
  proposal. Neither transition invokes a Server Action, accounting, persistence, or ordinary submission.
- Generate again calls the same protected action exactly once using a new snapshot of the then-current
  ordinary fields. Failure retains the current ordinary form and prior successful proposal.

## File ownership after renewed approval

- Requirements architect: specification, this plan, change-impact record, requirements handoff, and
  factual Joseph log entry only.
- Tester: `src/features/student/bookings/improve-request-*.test.ts`,
  `tests/e2e/student-improve-request.spec.ts`, and tester handoff. Tests change before application code.
- Developer/integration owner: `src/features/student/bookings/improve-request-validation.ts`,
  `src/features/student/bookings/improve-request-server.ts`,
  `src/app/student/slots/[slotId]/request/request-form.tsx`, and `src/lib/ai/client.ts` only if required to
  preserve feature-specific finalization semantics. The coordinator must avoid overlapping writes.
- Security reviewer: read-only report against the approved digest and one identified code version.

No existing migration may be edited. No migration, CI, authentication, environment file, credential,
merge, push, deployment, production data, or live-model call is authorized by this plan.

## Required verification evidence

- Targeted deterministic validation tests for exact keys/types, all field/list/raw bounds, fenced/prose
  output, NUL/unpaired surrogates, hostile literal strings, zero suggestions, and no partial proposal.
- Component/E2E tests proving originals remain visible/unchanged on success, locally edited proposal
  validation, Apply/Dismiss zero-call semantics, suggestions are not copied, stale-form disclosure, failed
  regeneration retention, one-call messaging, duplicate-click prevention, labels/live feedback, and
  separate ordinary submission.
- Existing authorization, quota, accounting, failure-release, database, typecheck, lint, build, formatting,
  and traceability checks must remain green. Report feature-level evidence separately from full-project
  coverage. A live provider call remains optional, separately approved, synthetic, and non-release-gating.
- Independently resolve or explicitly retain `RET-05-01`; this UI revision does not close it.
