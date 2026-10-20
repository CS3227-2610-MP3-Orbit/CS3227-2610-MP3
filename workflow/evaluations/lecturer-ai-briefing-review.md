# LEC-04 Tester/Security Reviewer Report

Date: 2026-10-20  
Scope: independent review of the implemented Lecturer AI Consultation Briefing.  
Reviewer: Tester/Security Reviewer Agent  
Specification: `workflow/specs/lecturer/LEC-04-ai-briefing.md` (approved)

## Overall result

**Changes required before approval.** TypeScript and the focused unit tests pass, but the
implementation does not yet have sufficient executable evidence for authorization, RLS,
provider failures, output validation, retention, or UI behavior. Two security findings are
high priority because the database insert policy does not bind retained rows to an active
Lecturer-owned booking.

No `.env.local` contents or credentials were read. No application code was modified during
this review. Database and E2E tests were not run.

## Commands and evidence

| Check | Expected result | Observed result | Status |
| --- | --- | --- | --- |
| Focused Vitest: `ai-briefing.test.ts`, `untrusted.test.ts`, `quota.test.ts` | AI boundary and quota tests pass | 2 files passed; 6 tests passed; 4 tests todo; `ai-briefing.test.ts` contains only two boundary tests | Partial |
| `npm.cmd run typecheck` | TypeScript succeeds | `next typegen` and `tsc --noEmit` passed | Pass |
| `npm.cmd run check:spec` | Traceability check completes | Completed: 24 specs, 243 criteria, 127 covered; warnings for many draft specs, including unrelated files | Partial |
| `npm.cmd run format:check` | Repository is formatted | 23 files reported by Prettier, including `LEC-04-ai-briefing.md` | Fail |
| `npm.cmd run lint` | Lint succeeds | Completed without reported errors | Pass |
| Database/RLS tests | Policies and ownership are exercised against Supabase | Not run; no database environment was used | Unverified |
| E2E tests | Lecturer UI and inert output are exercised in a browser | Not run | Unverified |

## Acceptance-criteria coverage

| Criterion | Expected | Evidence reviewed | Result |
| --- | --- | --- | --- |
| LEC-04-AC1 | Active owner is authorized before permitted retrieval and model call | `requireRole`, approved-status filter, lecturer ownership predicate in `src/features/lecturer/ai-briefing.ts:22-36` | Partial; no action/model mock test proves ordering |
| LEC-04-AC2 | Unauthorized, cross-owner, wrong-state, and inactive requests return no data and do not call model | Server query and `requireRole` exist | Partial; no direct role, ownership, deactivation, or no-call tests |
| LEC-04-AC3 | Prompt injection remains data and cannot mutate state or instructions | `wrapUntrusted` escaping and `UNTRUSTED_DATA_RULE`; one hostile-input unit assertion | Partial; no mocked provider test proves behavior and no state-invariance test |
| LEC-04-AC4 | Markup/script output is inert plain text | React `<pre>` rendering in `briefing-button.tsx` | Partial; no rendered UI/XSS test, and provider output is not validated before persistence |
| LEC-04-AC5 | Quota, timeout, rate-limit, provider, oversized, and empty failures are safe | Gateway failure types and action message mapping | Partial; only pure quota tests run |
| LEC-04-AC6 | Repeated requests stop at configured quota without secret leakage | `claimUsage` and `decideQuota` implementation; pure quota test | Partial; no repeated server-action/gateway integration test |

## Findings

| ID | Severity | Finding | Evidence | Status |
| --- | --- | --- | --- | --- |
| SEC-LEC04-01 | High | The briefing retention INSERT policy allows any authenticated user to insert a row whose `lecturer_id` equals their own user ID. It does not require an active Lecturer role, and it does not verify that `booking_id` belongs to that Lecturer or is approved/upcoming. A student or other authenticated user could therefore create misleading retained rows directly through Supabase if table grants/RLS are reachable. | `supabase/migrations/20261021000000_lecturer_ai_briefings.sql:16-18` | Open |
| SEC-LEC04-02 | High | Retention ownership is not enforced as a relationship between `lecturer_id` and `booking_id`. The Server Action uses the correct user ID, but database policy is the final boundary for direct requests and future call paths. | Same migration; insert only checks `lecturer_id = auth.uid()` | Open |
| FUNC-LEC04-03 | Medium | Provider output is saved and displayed without checking the required `Summary`, `Grouped question themes`, and `Preparation topics` sections or an explicit output length/content policy. The gateway limits tokens, but the specification requires output validation. | `src/features/lecturer/ai-briefing.ts:61-85`; `src/lib/ai/client.ts:101-145` | Open |
| SEC-LEC04-04 | Medium | Student email is loaded through the admin auth client and passed to the model. This matches the human decision recorded in LEC-04, but conflicts with the shared technical/integration least-data rule that excludes contact details. The conflict must be resolved explicitly before approval. | `src/features/lecturer/ai-briefing.ts:51-58`; analyst handoff discrepancy 1 | Open decision |
| TEST-LEC04-05 | Medium | The AI-specific test suite does not exercise the Server Action, model invocation, authorization denial, database insert, failure mapping, UI rendering, or non-mutation behavior. Its AC labels overstate coverage. | `src/features/lecturer/ai-briefing.test.ts:5-21` | Open |
| TEST-LEC04-06 | Medium | No database or E2E evidence verifies RLS isolation, retained-row access, selected consultation behavior, or inert rendering. | No DB/E2E run in this review | Unverified |
| OPS-LEC04-07 | Low | Repository-wide formatting fails, including the approved LEC-04 spec. This is a CI readiness issue rather than an application security defect. | `npm.cmd run format:check` reported 23 files | Open |

## Security review

- Authorization is present in the Server Action via `requireRole("lecturer")`, and the booking
  query scopes by approved status and `consultation_slots.lecturer_id` before the model call.
- Untrusted fields are wrapped and angle brackets are escaped. The system prompt explicitly says
  not to follow instructions in those fields.
- The provider is called from server-side code, not from the browser. The browser receives only
  the action result.
- The UI uses React text rendering inside `<pre>`, which is a good inert-rendering boundary, but
  it still needs a browser test.
- The quota gateway has input, timeout, rate-limit, empty-response, and usage-accounting paths;
  these were not exercised end to end in this review.
- The migration has RLS enabled and select/update/delete grants are restricted, but the insert
  policy is insufficiently role- and booking-scoped as described above.
- No AI-generated action mutation path was found in the reviewed implementation.

## Required follow-up

1. Strengthen the retention boundary: allow only active Lecturers and enforce that the referenced
   booking belongs to the same Lecturer and is approved/upcoming, preferably through a server-only
   insert/RPC or an RLS policy using a security-definer ownership check.
2. Resolve the student contact-data conflict between LEC-04 and the shared technical/integration
   specifications, then update the approved specification and handoff.
3. Validate the model output before saving/displaying it, including required sections, bounded
   length, and safe failure for malformed output.
4. Add mocked Server Action tests for role/ownership/state denial, no model call on denial, prompt
   injection, provider failures, quota behavior, persistence failures, and no booking mutation.
5. Add Supabase database tests for RLS and ownership consistency, and Playwright coverage for the
   selected consultation and inert plain-text output.
6. Format the changed repository files and rerun the full verification workflow.

## Handoff and human decision

The existing `workflow/handoffs/developer-to-reviewer.md` is still an unfilled template, so the
Developer-to-Reviewer handoff does not preserve implementation test evidence or known limitations.
This report records the independent review evidence; it is not human approval.

Human decision: pending / changes requested / approved  
Decided by:  
Decision date:  
Notes:
