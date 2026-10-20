# Requirement change impact: STU-05 structured editable proposal

- Feature and requirement IDs: `STU-05-R2`, `STU-05-R3`, `STU-05-R8`, `STU-05-AC3`,
  `STU-05-AC6`, `STU-05-AC12`, `STU-05-AC16`, `STU-05-AC17`
- Specification path: `workflow/specs/student/STU-05-improve-request.md`
- Previous approved digest: `a8f8c94cffa58bcf88d5721dd211027a4713b98b`
- Reviewed pre-revision working-tree digest: `e3f7a11363bc44e915ade61a152cd81c3af2223881604d5497b060f244164e27`
- Team-reviewed draft digest: `d0c86cfacf4dcd445dd883e7e5c28f120dde58adac7e5a8692d8323ea1ef5feb`
- Final approved specification digest after approval-record formatting:
  `bdbc1e95c3ca95a32b0c2283fde32c289fe09d0978c6f0f263391f5eeff656ec`
- Change requester/reference: Joseph's 2026-10-20 request after manually exercising the SoC LLM UI;
  explicit acceptance of the proposed structured editable draft, Apply, Dismiss, visible originals,
  no auto-submit, and limited-credit disclosure
- Date: 2026-10-20
- Status: `approved`

An editable status does not authenticate approval. Joseph reported on 2026-10-20 that the team approved
the exact revised draft digest `d0c86cfacf4dcd445dd883e7e5c28f120dde58adac7e5a8692d8323ea1ef5feb`.
Reviewer identities and remote protected-PR evidence remain unverified. Prior implementation verification
remains evidence only for the old contract.

## Behavior change

| ID          | Previous required behavior                                 | Proposed required behavior                                                                                                                                                | Reason                                                    | Material change? |
| ----------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------- |
| STU-05-R2   | One labelled text blob; user manually copied or ignored it | Separate editable topic/questions and literal suggestions; explicit Apply/Dismiss; originals stay visible; Apply/Dismiss have no model, persistence or submit side effect | Remove error-prone manual copying while preserving review | Yes              |
| STU-05-R3   | Model returned two labelled plain-text sections            | Provider returns one exact JSON object; the feature validates all fields/bounds and returns only a structured proposal                                                    | Reliable field-level application and fail-closed parsing  | Yes              |
| STU-05-R8   | One Improve control and a generated-text region            | Proposal card, Generate again, one-call/zero-call disclosure, stale-form warning, editable-field errors, literal list, and accessible status behavior                     | Make the AI workflow understandable and usable            | Yes              |
| STU-05-AC3  | Verified labelled advice and no automatic save/submit      | Verifies editable structured proposal with unchanged ordinary fields and still-separate submission                                                                        | Observable UI contract changed                            | Yes              |
| STU-05-AC6  | Verified labelled text shape and literal rendering         | Verifies strict all-or-nothing JSON validation, per-field/list/raw bounds, and literal rendering                                                                          | Security and output contract changed                      | Yes              |
| STU-05-AC12 | Verified fallback preserved the ordinary draft             | Also verifies a failed Generate again preserves any prior successful proposal and makes no automatic retry                                                                | New retry state                                           | Yes              |
| STU-05-AC16 | Not present                                                | Verifies Apply/Dismiss local-only semantics, validation, and stale-form disclosure                                                                                        | Genuinely new user actions                                | Yes              |
| STU-05-AC17 | Not present                                                | Verifies accessible labels/status, duplicate prevention, and accurate one-call/zero-call messaging                                                                        | Genuinely new UI/cost disclosure                          | Yes              |

## Decisions and assumptions

- Confirmed: structured improved topic, improved questions and suggestions; generated fields are editable;
  Apply and Dismiss are explicit; original fields remain visible; AI never auto-submits; generation uses
  limited allowance; Apply/Dismiss use no AI call.
- Confirmed by the reported team approval: exact JSON keys are `topic`, `questions`, and `suggestions`;
  topic/questions reuse STU-02
  200/2,000-character bounds; zero to five suggestions are allowed at up to 500 characters each; raw
  provider output remains at most 6,000 characters; stale-form replacement uses an inline warning before
  the explicit Apply action; failed regeneration retains the prior successful proposal.
- Unresolved feature decisions: none. The independent `RET-05-01` scheduler implementation blocker
  remains unresolved and is not changed by this approval.

## Impact map

| Area                            | Affected paths/contracts/IDs                                                                                                                  | Required follow-up                                                                                                       | Owner                              | Status                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- | --------------------------- |
| Application code                | `src/app/student/slots/[slotId]/request/request-form.tsx`; `src/features/student/bookings/improve-request-{server,validation}.ts`             | Implement only after revised tests; keep Apply/Dismiss client-local                                                      | developer/integration owner        | blocked by tests            |
| Acceptance/unit tests           | Validation and verification tests under `src/features/student/bookings/`; `tests/e2e/student-improve-request.spec.ts`; AC3/AC6/AC12/AC16/AC17 | Replace old labelled-text fixtures; add deterministic component/E2E behavior and call-count coverage                     | tester_verifier                    | required before code        |
| Data model/migrations/integrity | No UI-revision schema change                                                                                                                  | Do not edit migrations; preserve existing quota/accounting tests and retain `RET-05-01` as open                          | none for this revision             | unchanged                   |
| APIs/actions/providers          | `ImproveResult.success`; feature prompt/output parser; possible feature-specific validation in `src/lib/ai/client.ts`                         | Return validated proposal object; reject the whole malformed response before success finalization                        | developer/shared gateway owner     | blocked by tests            |
| UI/content/accessibility        | R2/R8; AC3/AC12/AC16/AC17                                                                                                                     | Add editable labelled proposal, literal suggestions, Apply/Dismiss/regenerate, stale warning, statuses and cost wording  | Student UI owner                   | blocked by tests            |
| Security/privacy/AI boundaries  | R3/R6; AC6                                                                                                                                    | Treat parsed JSON fields as untrusted literal values; no HTML/Markdown; no partial result; no new prompt/log persistence | developer then security_reviewer   | independent review required |
| Guides/logs/operations          | STU-05 plan/latest handoff; `logs/joseph/stu-05.md`                                                                                           | Record exact approval digest, assignments, actual checks and retained limitations                                        | coordinator/requirements architect | approval recorded           |

## Invalidated evidence

- The prior STU-05 approval digest `a8f8c94cffa58bcf88d5721dd211027a4713b98b` does not approve this
  material response/UI contract.
- Existing implementation and screenshots demonstrate the old single-text/manual-copy interface only.
- Existing tests that merely reference `STU-05-AC3`, `STU-05-AC6`, or `STU-05-AC12` are stale for the
  revised wording even if syntactic traceability still finds their IDs.
- Developer/tester/security reports against the old plain-text output cannot establish AC16/AC17 and
  cannot be reused as proof of strict JSON validation, Apply/Dismiss semantics, regeneration retention,
  stale-form disclosure, or revised accessibility/call-cost behavior.
- Existing authorization, quota, accounting, migration, and no-secret evidence is not invalidated unless
  later implementation changes those paths; it must still be regression-checked on the final version.

## Approval renewal

- Specification review required: completed by Joseph's report of team approval for the exact draft digest;
  final approved digest is recorded in the approval handoff after status-only formatting.
- Sensitive-change review required: yes if shared gateway validation changes; security reviewer must also
  verify untrusted structured fields and no new side effects before merge.
- Data/API consumer sign-off required: Student request-form owner and shared AI gateway owner.
- Other human decision: separately resolve or accept the ongoing `RET-05-01` operational blocker.

## Ordered follow-up

1. Approval completed and recorded against the exact reviewed draft digest.
2. Update acceptance/security tests for revised AC3/AC6/AC12 and new AC16/AC17; verify test setup.
3. Implement the strict structured result, editable proposal UI, and client-local Apply/Dismiss behavior.
4. Independently verify the final integrated version; retain unchanged authorization/quota regression
   coverage and report `RET-05-01` truthfully.

Linked implementation task or PR: none; do not merge or deploy.
