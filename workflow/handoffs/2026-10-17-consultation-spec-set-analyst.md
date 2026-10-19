# Handoff: PRD-01/TEC-01/SHR-01/INT-01/PLN-01 — analyst → human reviewers

- Date: 2026-10-17
- Specs: `workflow/specs/{PRODUCT-SPEC,TECHNICAL-SPEC,SHARED-TECHNICAL-SPEC,INTEGRATION-SPEC,PLAN}.md`
  (status at handoff: draft)
- Agent session log: Not yet recorded; add the verified session summary under `logs/` before merge.

## What was done

- Converted the proposed three-role consultation system into five structured system-level specs.
- Defined the product workflow, role capabilities, permissions, booking states, failure behaviour,
  AI data boundaries, shared non-functional controls, logical data/contracts, and execution plan.
- Added testable acceptance criteria and separated unresolved product decisions into open questions.
- Required smaller role/shared specs to be approved before feature implementation.

## Evidence

- Read the existing spec template, `SH-01`, traceability checker, analyst instructions, and handoff
  template before drafting.
- `npm run check:spec` passed: `Specs: 6  Criteria: 41  Covered: 5`. It reported expected warnings
  for uncovered criteria in these draft specs; draft criteria are not enforced until approval.

## Changes outside the owner's area

None. Only `workflow/specs/` and `workflow/handoffs/` were changed.

## Findings and open questions

| #   | Severity | Finding                                                                                 | Status |
| --- | -------- | --------------------------------------------------------------------------------------- | ------ |
| 1   | High     | Student provisioning and course-enrolment authorization are not decided.                | Open   |
| 2   | High     | Cancellation cutoff and application timezone can change transition behaviour.           | Open   |
| 3   | High     | Exact field lengths and SoC LLM quota limits are not confirmed.                         | Open   |
| 4   | Medium   | Account invitation and self-role/deactivation rules need administrator-owner decisions. | Open   |
| 5   | Medium   | Data/log retention, accessibility target, and supported scale/browsers need agreement.  | Open   |
| 6   | Medium   | Existing `SH-01` is draft although foundation implementation has started.               | Open   |

## Human review

- Reviewed by:
- Decision: approved / changes requested
- Notes:
