# Requirement change impact record

- Feature and requirement IDs: `SH-01-R6`, `SH-01-AC6`, `SH-01-AC7`; dependent `STU-05-R4/R5/R7`,
  `STU-05-AC7`–`AC14`.
- Specification path: `workflow/specs/shared/SH-01-foundation.md`.
- Previous reviewed commit or digest: current pre-revision content `a1a660ead71b0565afddf27633c63b6299bc5fa8`;
  prior team-reported approved digest recorded there: `ba6eff99926a74423b8b41f58a7815cacab2a4a1`.
- Proposed revision digest: revised SH-01 draft
  `07f3f1e5d6c0148076157447ccf584edacc3620e`; revised STU-05 draft
  `e871e34b126b0e624e1b88f06f47eac917e548c2`. Prior STU-05 approved digest:
  `74eeb61f192e0073343fed708ad694b671268fbc`.
- Change requester/reference: Joseph's 2026-10-19 confirmed AI spending-limit decisions and subsequent
  accepted admission-day/midnight-attribution and retention recommendations.
- Date: 2026-10-19.
- Status: `draft`.

An editable status does not authenticate approval. Joseph reported team approval of the revised 2026-10-19
quota subset at digest `07f3f1e5d6c0148076157447ccf584edacc3620e`. The broader shared document remains
draft due to separate material authorization and other requirements; the report does not approve all SH-01
requirements, merge, deployment, or sensitive changes. Individual reviewer identity and remote-PR evidence
were not independently verified.

## Behavior change

| ID        | Previous required behavior                                                                                                                                                                                      | Proposed required behavior                                                                                                                                                                             | Reason                                                                      | Material change? |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- | ---------------- |
| SH-01-R6  | 3 admitted Student/minute; 10 admitted app-wide/minute; 10 successful/Student/SGT day; 500 successful/app/SGT day; atomic attempt reservation/finalization/expiry; failures/refusals do not consume daily quota | Atomically reserve daily capacity at admission, attribute a valid response to its admission's SGT day even after midnight, release non-success reservations, and delete minimal metadata after 30 days | Bound shared SoC LLM spend safely and make midnight/retention deterministic | Yes              |
| SH-01-AC6 | Deterministic verification of prior minute/daily limits, Singapore midnight reset, successful-only daily counting, and safe refusal                                                                             | Verify admission-day daily reservation, refusal before an over-cap provider call, original-day finalization after midnight, new-day post-midnight admission, and failure release                       | Make policy testable                                                        | Yes              |
| SH-01-AC7 | Typed failure releases/reconciles an attempt without automatic provider retry, does not consume daily quota, and leaves ordinary workflow usable                                                                | Verify typed safe failure/no false success plus 30-day deletion of allowed minimal metadata                                                                                                            | Prevent false success/credit claims and indefinite metadata retention       | Yes              |

## Decisions and assumptions

- Confirmed: 3 per minute per active Student; 10 admitted app-wide requests per rolling 60 seconds; 10
  daily-capacity reservations per active Student/Asia-Singapore admission day; 500 app-wide daily-capacity
  reservations/admission day; 00:00 SGT reset; atomic capacity reservation/minimal attempt before call;
  one in-flight attempt/Student; original-admission-day finalization even after midnight; failure release;
  trusted expiry/reconciliation without automatic provider retry; 30-day maximum retention of minimal
  metadata; and no prompt/output/raw provider-response storage.
- Proposed: daily limits apply to all gateway features because one team SoC key is shared. Exact schema,
  indexes, expiry duration, cleanup scheduling, and transactional syntax remain implementation choices
  subject to review.
- Unresolved: no product/accounting-policy decision remains; exact implementation design must satisfy the
  confirmed behavioural contract.

## Impact map

| Area                            | Affected paths/contracts/IDs                  | Required follow-up                                                                                                    | Owner                | Status                      |
| ------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------- | --------------------------- |
| Application code                | `src/lib/ai/client.ts`, `src/lib/ai/quota.ts` | Replace placeholders/TODO after renewed spec approval; implement confirmed protocol                                   | developer            | blocked by approval         |
| Acceptance/unit tests           | quota/client/STU-05 tests; `SH-01-AC6/AC7`    | Strengthen isolated deterministic minute/admission-day/failure/expiry/concurrency/30-day-deletion tests               | tester_verifier      | blocked by renewed approval |
| Data model/migrations/integrity | `public.ai_usage` / append-only migration     | Implement minimal attempt state/time/indexes, admission-day reservation and 30-day deletion; no prompt/output storage | developer + reviewer | blocked                     |
| APIs/actions/providers          | `generateText`, Student action                | Preserve typed failures; derive time/identity server-side                                                             | developer            | blocked                     |
| UI/content/accessibility        | STU-05 request form                           | Explain limits/fallback without global usage disclosure                                                               | developer            | blocked                     |
| Security/privacy/AI boundaries  | SH-01/STU-05                                  | Review server-only accounting, fail-closed behaviour and no secret/prompt logging                                     | security reviewer    | pending                     |
| Guides/logs/operations          | handoffs/logs                                 | Record SoC allocation source if policy later changes                                                                  | coordinator          | pending                     |

## Invalidated evidence

- The existing `src/lib/ai/quota.test.ts` TODOs and current `DEFAULT_LIMITS` are not evidence of the new
  requirements and cannot verify them.
- Any previous interpretation of `SH-01-AC6` without concrete numbers/timezone/success accounting is
  stale. No passing implementation evidence exists to invalidate.
- The reported STU-05 approval digest `74eeb61f192e0073343fed708ad694b671268fbc` and reported SH-01
  quota-subset approval are stale after this material reservation/midnight/retention revision.
- The separate prior approval of `SH-01` was already stale due to the recorded profile-authorization
  revision; this material quota revision requires a new review regardless.

## Approval renewal

- Specification review required: recorded. Joseph reported renewed team approval for revised STU-05 and the
  applicable SH-01 quota subset; broader SH-01 remains draft and needs its own review path.
- Sensitive-change review required: yes, eventual shared gateway/accounting/auth or migration changes.
- Data/API consumer sign-off required: yes, any other AI feature owner if shared global quota semantics
  are adopted.
- Other human decision: none; the human decisions are now recorded. Sensitive implementation review
  remains required.

## Ordered follow-up

1. Have tester strengthen isolated pre-code acceptance/security tests under approved STU-05.
2. Only then modify shared gateway/accounting, migration, and STU-05 UI/action code with sensitive review.

Linked implementation task or PR (when available): none.
