# Handoff: STU-05-IMPLEMENT-R1 — developer → coordinator

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "STU-05-IMPLEMENT-R1",
"requirementIds": ["STU-05-R1", "STU-05-R2", "STU-05-R3", "STU-05-R4", "STU-05-R5", "STU-05-R6", "STU-05-R7", "STU-05-R8", "STU-05-AC1", "STU-05-AC14", "SH-01-R6", "SH-01-AC6", "SH-01-AC7"],
"status": "incomplete",
"changedFiles": ["src/lib/ai/client.ts", "src/lib/ai/quota.ts", "src/lib/ai/attempts.ts", "src/features/student/bookings/improve-request-validation.ts", "src/features/student/bookings/improve-request-server.ts", "src/features/student/bookings/improve-request-validation.unit.test.ts", "src/app/student/slots/[slotId]/request/actions.ts", "src/app/student/slots/[slotId]/request/request-form.tsx", "supabase/migrations/20261019000000_student_improve_request_ai.sql", "workflow/handoffs/stu-05/developer.md", "logs/joseph/stu-05.md"],
"verification": [
{"check": "npm run typecheck", "result": "passed", "evidence": "Next route types and TypeScript completed successfully."},
{"check": "focused STU-05 unit tests", "result": "passed", "evidence": "3 files / 7 tests passed: quota, gateway-constants, validation."},
{"check": "tester-owned improve-request-verification.test.ts", "result": "failed", "evidence": "6 tests fail before action evaluation because the test imports a server-only action without mocking server-only; see DEV-05-01."},
{"check": "npx supabase db lint --level error", "result": "passed", "evidence": "No schema errors on the current local database; the new migration is listed locally but not installed persistently."},
{"check": "npm run test:db", "result": "passed", "evidence": "5 files / 52 pgTAP tests passed against the existing local database; no STU-05 pgTAP fixture exists and the uninstalled migration was not exercised."},
{"check": "npm run lint", "result": "passed", "evidence": "ESLint exited successfully."},
{"check": "npm run check:spec", "result": "passed", "evidence": "19 specs, 196 criteria, 100 linked; only unrelated draft warnings."},
{"check": "npm run build", "result": "passed", "evidence": "Next.js production build completed; package-lock root warning only."},
{"check": "git diff --check and targeted Prettier", "result": "passed", "evidence": "No whitespace errors; all assigned TypeScript/TSX files formatted."}
],
"unresolvedIssues": ["RET-05-01: no repository-supported durable scheduler exists for the required deletion of usage rows no later than 30 days. The migration exposes a service-only purge function but does not claim it is scheduled.", "DEV-05-01: tester-owned verification test does not mock server-only before dynamically importing the protected action, so its six action tests fail at module import rather than validate behavior.", "The new migration has not been installed into a disposable database, so its SQL/RPC semantics require tester/database verification before merge."]
}
<!-- HANDOFF:END -->

- Date: 2026-10-19
- Task ID: `STU-05-IMPLEMENT-R1`
- Requirement / acceptance-criterion IDs: `STU-05-R1`–`R8`, `STU-05-AC1`–`AC14`, `SH-01-R6`, `SH-01-AC6`, `SH-01-AC7`.
- Specification: `workflow/specs/student/STU-05-improve-request.md`
- Specification version or commit: approved digest `a8f8c94cffa58bcf88d5721dd211027a4713b98b`.
- Specification status and human approver: approved; Joseph reported team approval on 2026-10-19. This is not merge/deployment/sensitive-change approval.
- Relevant context files: `AGENTS.md`, STU-05, SH-01 quota subset, STU-05 plan/challenge/latest handoff, development-security and approval-gates policies.
- Allowed edit scope: coordinator assignment `STU-05-IMPLEMENT-R1`; no deviation.
- Agent session log: `logs/joseph/stu-05.md`

## Decisions and assumptions

- Applied only approved values: 3 Student/minute, 10 app/minute, 10 Student/admission-day, 500 app/admission-day; Singapore admission-day computation; one in-flight request per Student; 20-second gateway timeout; 4,000 input chars; 600 output tokens.
- The server-only action authorizes before parsing/accounting/gateway use. Its allowlist is exactly topic/questions; it derives user, feature, and fixed prompt.
- Failure rows are retained as minimal metadata but excluded from active rate/daily reservations. Pending/indeterminate rows are reconciled to expired on a subsequent trusted admission after two minutes; no provider retry occurs.
- RET-05-01 is not resolved: the service-only `purge_expired_ai_attempts` function is only support for a hosting scheduler, not proof of a 30-day hard deletion job.

## Changes

- Replaced placeholder quota decision logic and values with approved limits, including global daily capacity.
- Added server-only RPC adapter for atomic claims/finalization/release and rewired `generateText` to avoid provider-error logging and return typed unresolved failures.
- Added the STU-05 migration for minimal `ai_usage` state/admission-day data, atomic claim/resolve RPCs, RLS-safe service-only grants, indices, stale-attempt reconciliation, and unscheduled purge support.
- Added validation and a protected draft-only action using separately labelled `wrapUntrusted` blocks and fixed source-controlled instructions.
- Added the accessible request-form control and literal generated-advice region; it never overwrites fields or submits a booking.
- Added developer-owned validation tests. Tester-owned tests were preserved untouched.

## Evidence

| Command or check                                        | Result | Evidence                                                                                    |
| ------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| `npm run typecheck`                                     | passed | Next route typing and TypeScript passed.                                                    |
| Focused Vitest                                          | passed | 3 test files, 7 tests.                                                                      |
| Tester-owned STU-05 action contract                     | failed | Six test failures are module-import setup failures, not behavioral findings; see DEV-05-01. |
| `npx supabase db lint --level error`                    | passed | No current schema lint errors.                                                              |
| `npm run test:db`                                       | passed | Existing 5 files/52 pgTAP tests passed; migration not installed.                            |
| `npm run lint` / `npm run check:spec` / `npm run build` | passed | App lint, traceability, and production compilation completed.                               |
| `git diff --check` / targeted Prettier                  | passed | No whitespace errors; assigned code formatted.                                              |

## Changes outside the owner's area

- `src/lib/ai/*` and `supabase/migrations/20261019000000_student_improve_request_ai.sql` are shared/sensitive paths and require independent human/CODEOWNER review before merge.

## Findings and open questions

| #   | Severity | Finding                                                                                                                                                  | Status                                                                             |
| --- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1   | High     | RET-05-01: a cleanup function without a durable configured scheduler cannot guarantee hard deletion within 30 days.                                      | Coordinator/human hosting decision required.                                       |
| 2   | High     | DEV-05-01: `improve-request-verification.test.ts` imports server-only code without a `server-only` mock, so six criteria do not exercise implementation. | Tester must correct test setup and independently verify.                           |
| 3   | Medium   | Migration/RPC behavior was not run in a disposable migrated database.                                                                                    | Tester/database verifier must prepare a disposable target and add/run DB coverage. |

## Next action

Tester and security reviewer: independently review this exact integrated working-tree version, first repairing/validating isolated test setup; prepare a disposable database with the migration before asserting database defects. Human/hosting owner: resolve RET-05-01 before merge/use.

## Human review

- Reviewed by: not yet independently reviewed.
- Decision: pending.
- Notes: no merge, deployment, live-model call, credentials, or production access occurred.

## Fix round 1 — STU-05-FIX-R1

- Review target: approved digest `a8f8c94cffa58bcf88d5721dd211027a4713b98b`; same uncommitted integrated tree.
- Confirmed findings addressed: `SEC-05-01`, `SEC-05-02`/`TST-05-02`, `TST-05-01`, and `SEC-05-04`.
- Changes: `generateText` now rejects a nonconforming STU-05 response and releases its reservation before
  finalization; the feature contract requires bounded literal advice with `Improved draft` and
  `Suggestions` labels; gateway input-too-long maps to request validation feedback. Append-only migration
  `20261019010000_student_improve_request_ai_fix.sql` makes all admitted attempts count in the 60-second
  user/global windows while failed/expired/indeterminate rows remain excluded from daily capacity.
- Verification: `npm run typecheck`; tester-owned action verification plus developer quota/client/
  validation tests (4 files / 17 tests); `npm run lint`; `npm run check:spec`; `npm run build`; and
  `git diff --check` all passed. The prior server-only test setup defect is fixed in the tester-owned
  file by its owner and its tests now execute.
- Limitations: no local persistent migration install/reset was performed, so the corrective migration
  awaits disposable-database verification. `RET-05-01` remains unresolved: no durable 30-day scheduler
  is configured or claimed.

## Fix round 2 — STU-05-FIX-R2

- Review target: approved digest `a8f8c94cffa58bcf88d5721dd211027a4713b98b`; current code after fix round 1.
- Confirmed finding addressed: `SEC-05-06`. Both gateway and feature validation now require a non-whitespace
  body in each colon-labelled `Improved draft:` and `Suggestions:` section before finalization. Empty
  labelled sections are released as invalid output. The legacy heading-only plain-text form remains limited
  to the tester's existing non-empty suggestion fixture; production instructions request colon-labelled
  sections.
- Added developer-owned regression assertions for blank-section refusal and valid labelled advice.
- Recheck: typecheck, existing independent action suite plus developer tests (4 files / 18 tests), lint,
  targeted Prettier, and diff check passed. The first typecheck attempt failed because named regex capture
  groups exceed this TypeScript target; ordinary numbered captures fixed it on the second permitted retry.
- Remaining limitation: `RET-05-01` and disposable migration verification remain open. This is the final
  automatic fix round; no more automatic fixes are authorized.

## Provider configuration update — STU05-SOCLAAS-CONFIG

- Date: 2026-10-20. Human decision: use the official server-only provider variables `SOCLAAS_BASE_URL`,
  `SOCLAAS_API_KEY`, and `SOCLAAS_MODEL`.
- Changed the shared gateway, safe example environment file, developer deployment guide, and Vercel setup
  mapping consistently. No local environment/secret file was opened, and no provider was contacted.
- Added a focused source-contract test proving the gateway uses only the `SOCLAAS_*` server variables and
  never uses a `NEXT_PUBLIC_SOCLAAS_*` name. The independent feature verification continues to assert that
  its source does not contain the API-key variable name.
- Evidence: focused tests (2 files / 12 tests), `npm run typecheck`, `npm run lint`, `git diff --check`,
  and targeted Prettier check all passed. Prettier does not infer parsers for `.env.example` or shell files,
  so those two plain-text files were manually limited to simple variable-name substitutions.
- Limitations: no actual local/hosted provider configuration was inspected or invoked, so a human must set
  the renamed server-side variables in each intended environment. `RET-05-01` remains unresolved.

## Structured proposal UI — STU-05-UI-IMPLEMENT-R1

- Updated the approved STU-05 structured-output contract: only exact bounded JSON `{topic,questions,suggestions}`
  is accepted before gateway finalization. Raw text, fences, extra keys, invalid Unicode/NUL, over-limit fields,
  and partial proposals return typed invalid output.
- Server returns validated proposals only. The Student request UI preserves original fields, exposes separate
  editable proposal fields/literal suggestions, keeps failed regeneration's prior proposal, and makes Apply/Dismiss
  local-only. Apply copies the editable proposal only after a stale-snapshot disclosure; it never submits a booking.
- Evidence: focused verifier/developer suite passed (4 files / 32 tests); typecheck, lint, and diff check passed.
  Browser and live-model verification were not run. `RET-05-01` remains unresolved.
