# Specification challenge record

- Feature and requirement IDs:
- Draft spec path:
- Draft commit or content digest:
- Original request/reference:
- Shared constraints reviewed:
- Review type: `independent` | `self-review`
- Reviewer or agent:
- Date:

If review was not independently delegated, use `self-review` and say what independent review remains.
This record is review evidence, not human approval.

## Independently derived scenarios

List happy, invalid-input, role/ownership, edge/concurrency, dependency-failure, and AI-abuse scenarios
without relying only on the draft's proposed implementation.

## Findings

| #   | Severity | Affected requirement/AC | Counterexample or question | Why it matters | Proposed clarification | Human input needed | Disposition |
| --- | -------- | ----------------------- | -------------------------- | -------------- | ---------------------- | ------------------ | ----------- |

Label every clarification as a proposal. The reviewer must not silently decide business rules.

## Challenge checklist

- [ ] Scope, non-goals, dependencies, and source-of-truth hierarchy are unambiguous.
- [ ] Confirmed requirements, proposed assumptions, and unresolved decisions are distinct.
- [ ] Requirements are observable, internally consistent, and testable.
- [ ] Actor, role, ownership, authorization order, and data visibility boundaries are complete.
- [ ] Inputs, outputs, trust boundaries, validation, and safe logging are defined.
- [ ] Empty, invalid, conflict, concurrency, dependency, quota, and recovery paths are covered.
- [ ] Resource bounds and abuse cases are proportionate and measurable.
- [ ] AI context, injection, output, disclosure, capability, and side-effect boundaries are covered when relevant.
- [ ] Acceptance criteria could not pass while a material part of user intent is violated.
- [ ] Verification methods distinguish deterministic tests, manual checks, and live-model evaluations.
- [ ] The spec avoids unnecessary implementation detail and scope.
- [ ] Material open findings and required renewed approvals are explicit.

## Readiness recommendation

- Recommendation: `not ready` | `ready for human review`
- Blocking findings:
- Residual risks:
- Required human decisions:
- Next review step:
