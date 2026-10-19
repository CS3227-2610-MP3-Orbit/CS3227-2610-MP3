# Requirement change impact record

- Feature and requirement IDs:
- Specification path:
- Previous reviewed commit or digest:
- Proposed revision digest:
- Change requester/reference:
- Date:
- Status: `draft` | `reviewed` | `approved`

An editable status does not authenticate approval. Record the reviewer and protected-PR evidence in the
project handoff when a human accepts the change.

A material change resets the canonical specification frontmatter to `draft` and invalidates the prior
approval until renewed human review is recorded. Preserve the previous approved commit or digest.

## Behavior change

| ID  | Previous required behavior | Proposed required behavior | Reason | Material change? |
| --- | -------------------------- | -------------------------- | ------ | ---------------- |

Preserve existing IDs when the concept remains the same. Allocate a new ID for a genuinely new concept;
do not renumber unaffected requirements or criteria.

## Decisions and assumptions

- Confirmed:
- Proposed:
- Unresolved:

## Impact map

| Area                            | Affected paths/contracts/IDs | Required follow-up | Owner | Status |
| ------------------------------- | ---------------------------- | ------------------ | ----- | ------ |
| Application code                |                              |                    |       |        |
| Acceptance/unit tests           |                              |                    |       |        |
| Data model/migrations/integrity |                              |                    |       |        |
| APIs/actions/providers          |                              |                    |       |        |
| UI/content/accessibility        |                              |                    |       |        |
| Security/privacy/AI boundaries  |                              |                    |       |        |
| Guides/logs/operations          |                              |                    |       |        |

## Invalidated evidence

List acceptance criteria, test results, reviews, digests, approvals, screenshots, or evaluations that are
now stale. Use `None` only after checking each relevant evidence source.

## Approval renewal

- Specification review required:
- Sensitive-change review required:
- Data/API consumer sign-off required:
- Other human decision:

## Ordered follow-up

1. Revise and review the specification.
2. After human approval, revise acceptance/security tests.
3. Only then revise implementation and documentation.

Linked implementation task or PR (when available):
