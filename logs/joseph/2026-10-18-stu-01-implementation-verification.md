# STU-01 implementation and verification log

- Date: 2026-10-18
- Coordinator: Joseph's primary Codex session
- Task: `TASK-STU-01-IMPLEMENT`
- Outcome: incomplete; implementation exists, three confirmed defects were fixed and independently
  rechecked, but one high-severity shared RLS/specification conflict and other human decisions remain.
- Merge/deployment status: not merged, committed, pushed, or deployed.

## Review target

Project agent policy prohibited the developer from creating a commit. The reviewed target was therefore
the uncommitted working-tree implementation based on commit
`e5893b28a6d898bdfb698dcb7f48e293ab373e7b`, not an invented implementation commit. The final SHA-256
manifest digest for the eleven implementation and independent-test files is
`2b7692ccde158b38a11d29b3a078277920965ac53ecfe97422f135b23c1b11ca`.

Approved specification evidence and current Git object digests:

- `STU-01`: `17248e77c0b9801810c3c190e925bfec62ab03b9`
- `SH-01`: `451469df2a1f39233656b1c25d8aedccbd71702e`
- `SH-02`: `8e8f677d361a18a41e9b073ac189618a2b9b63b5`
- `SH-03`: `2f704fe55f177fe8d9a8320dc5c5ea71c91e1680`
- Approval record: `workflow/handoffs/archive/stu-01/2026-10-18-team-spec-approval-requirements-architect.md`

The approval record is Joseph's report of team approval; reviewer identity and protected-PR evidence
were not independently authenticated.

## Agent assignments

| Role                  | Assignment                      | Scope                                                                       | Evidence                                                                       |
| --------------------- | ------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Developer/generator   | `TASK-STU-01-IMPLEMENT-R0`      | Student slots UI/service/unit tests and one new migration                   | `workflow/handoffs/archive/stu-01/2026-10-18-stu-01-developer-round-0.md`      |
| Tester/verifier       | `TASK-STU-01-VERIFY-R1`         | Independent Vitest, pgTAP and Playwright tests                              | `workflow/handoffs/archive/stu-01/2026-10-18-stu-01-tester-round-1.md`         |
| Security reviewer     | `TASK-STU-01-SEC-R1`            | Read-only-by-instruction review of auth, RLS, privacy, cursor, AI and gates | Coordinator transcript; parent filesystem was not technically read-only        |
| Developer/fix round 1 | `TASK-STU-01-FIX-R1`            | Fix `F-TV-01`, `F-TV-02`, and `F-TV-04`                                     | `workflow/handoffs/archive/stu-01/2026-10-18-stu-01-developer-round-1.md`      |
| Tester recheck        | `TASK-STU-01-VERIFY-R1-RECHECK` | Independently rerun fixed cases and regressions                             | `workflow/handoffs/archive/stu-01/2026-10-18-stu-01-tester-round-1-recheck.md` |
| Security recheck      | `TASK-STU-01-SEC-R1-RECHECK`    | Read-only inspection plus review of independent recheck results             | Coordinator transcript                                                         |

Child agents did not delegate. Tester and security review ran independently and in parallel. Only one
automatic developer fix round was used; a second round was not started because the remaining material
findings require human/specification or workflow-policy decisions.

## Implemented files

- `src/app/student/page.tsx`
- `src/app/student/slots/loading.tsx`
- `src/app/student/slots/page.tsx`
- `src/features/student/slots/server.ts`
- `src/features/student/slots/validation.ts`
- `src/features/student/slots/validation.test.ts`
- `src/lib/supabase/proxy.ts`
- `supabase/migrations/20261018000000_student_browse_available_slots.sql`

Independent verification files:

- `src/features/student/slots/verification.test.ts`
- `supabase/tests/student_browse_available_slots.test.sql`
- `tests/e2e/student-browse-available-slots.spec.ts`

## Findings and dispositions

| ID                      | Severity | Finding                                                                                                                                                      | Disposition                                                                                                                                        |
| ----------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `F-TV-01`               | High     | Server-generated cursor was rejected on unchanged replay because PostgreSQL base64 inserted whitespace.                                                      | Fixed in round 1; transactional pgTAP independently verified page-two replay.                                                                      |
| `F-TV-02`               | Medium   | Signed-out redirect retained attacker-controlled browse parameters on `/login`.                                                                              | Fixed in round 1; Playwright independently verified exact `/login`.                                                                                |
| `F-TV-03` / `SEC-R1-01` | High     | Pre-existing profile RLS permits active Students to read full Lecturer/Administrator rows, including inactive/audit fields. SH-01 and STU-01/SH-03 conflict. | Unresolved; requires shared-spec/auth-owner decision and an append-only RLS migration. No silent code change made.                                 |
| `F-TV-04`               | High     | Current lecturer-course assignment did not enforce an active course and active Lecturer endpoint.                                                            | Fixed in round 1; corrected independent pgTAP verified SQLSTATE `23514`.                                                                           |
| `SEC-R1-03`             | Medium   | STU-01 and SH-03 conflict on whether per-slot `courseId` and `lecturerId` are allowed in the payload.                                                        | Unresolved; specification update and renewed review required.                                                                                      |
| `SEC-R1-04`             | Medium   | Stored display-field and catalogue response-size limits are unresolved.                                                                                      | Unresolved product/spec decision; no limit invented.                                                                                               |
| `SEC-R1-05`             | Medium   | Sensitive-change classifier does not trigger for `src/lib/supabase/proxy.ts` alone.                                                                          | Unresolved workflow-guardrail change requiring separate human review. Current patch is still classified sensitive because it includes a migration. |
| `SEC-R1-06`             | Medium   | Round-one fixes modified the newly created but uncommitted migration, raising an interpretation issue under the append-only migration rule.                  | Recorded for human decision; migration has not been committed, persistently applied, pushed, or deployed.                                          |

## Actual verification results

| Check                                                                        | Result                    | Evidence                                                                                  |
| ---------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| `npm test`                                                                   | passed                    | Coordinator rerun: 25 passed, 4 todo, 1 skipped file.                                     |
| `npm run lint`                                                               | passed                    | Coordinator rerun exited successfully.                                                    |
| `npm run typecheck`                                                          | passed                    | Next route generation and TypeScript completed successfully.                              |
| Focused Playwright                                                           | passed                    | Coordinator rerun: 1/1 signed-out redirect test passed in Chromium.                       |
| Transactional migration plus pgTAP, then rollback                            | incomplete                | Independent tester: 20/21 passed; sole failure is deferred `F-TV-03`. No state retained.  |
| `npm run test:db`                                                            | blocked                   | Persistent local database intentionally lacked the uncommitted migration.                 |
| `npm run check:spec`                                                         | failed                    | Coordinator rerun: 52/139 criteria covered; 32 approved shared criteria remain uncovered. |
| `npm run check:secrets`                                                      | passed                    | Coordinator rerun exited successfully.                                                    |
| `npm run check:sensitive`                                                    | passed with required gate | Migration was classified as requiring sensitive review before merge.                      |
| `git diff --check`                                                           | passed                    | Coordinator rerun reported no whitespace errors.                                          |
| Authenticated browser, manual keyboard, 320px/200% zoom, Firefox/Safari/Edge | not run                   | Deterministic authenticated browser fixtures/manual coverage were unavailable.            |
| Remote CI, CODEOWNERS, branch protection, production gates                   | not run                   | No commit/PR/network verification; no merge or deployment attempted.                      |

## Security and process notes

- No AI call, `ai_usage` write, admin/service-role browse client, merge, push, database push, or
  deployment was performed.
- During generator diagnostics, a local Supabase status command printed generated local-development
  credentials into that agent's captured tool output. No `.env`, production credential, or production
  data was accessed. Credential values are intentionally not copied into this log.
- The security reviewer inherited a writable parent sandbox; its read-only restriction was behavioral,
  and it reported making no file or database changes.

## Required human decisions before acceptance

1. Reconcile SH-01 staff-profile readability with STU-01/SH-03 data minimization; if narrow access wins,
   approve an append-only RLS migration and pgTAP coverage.
2. Decide whether slot results may include `courseId` and `lecturerId`, then update the conflicting spec
   and tests before changing code.
3. Decide stored-field/catalogue bounds and whether cursor expiry/rate targets are required now.
4. Decide how the append-only rule applies to a new, uncommitted, unapplied migration modified during
   review; restructure into a follow-up migration if required.
5. Review a separate guardrail change to classify proxy/auth files as sensitive.
6. Obtain human review of the migration and proxy diff, finish missing verification, and run protected
   CI before any merge.

## Reflection

### What went well

The generator-verifier workflow was valuable because the developer was not allowed to decide that its
own implementation was correct. The generator produced a coherent end-to-end slice, including the UI,
server validation, database boundary, migration, and unit tests. The functional tester and security
reviewer then examined the result independently against the approved requirements instead of relying on
the developer's summary.

That independence found several problems that the generator's checks had missed. In particular, the
tester reproduced the broken continuation cursor, the query-preserving login redirect, and the missing
assignment integrity rule. The security reviewer also noticed the broader profile-disclosure problem and
the gap in the sensitive-change classifier. These were concrete, reproducible findings rather than
general comments. After the first fix round, the tester reran the affected cases and verified that the
cursor, redirect, and assignment fixes worked. This made the final evidence more trustworthy than a
single agent saying that its own changes passed.

The workflow also handled uncertainty responsibly. When a finding exposed conflicts between SH-01,
SH-03, and STU-01, the agents did not silently choose new product or authorization behavior. Those items
were left for human review. The two-review-round limit prevented an open-ended cycle of agents repeatedly
changing code to satisfy one another.

### What went wrong

The specification workflow was not implementation-ready even though the relevant documents had been
marked approved. `npm run check:spec` failed throughout the work. At the end, only 52 of 139 acceptance
criteria had test references, and 32 criteria in approved shared specifications still had no coverage.
This meant the project could not obtain a clean specification-to-test traceability result. The failure
was broader than STU-01: approving the large SH-01, SH-02, and SH-03 specifications at once caused the
traceability checker to expect tests for shared behavior that was outside this first feature slice.

The specifications also contained contradictions and unresolved decisions. STU-01's final unresolved
section repeated decisions that other sections and the shared specs described as confirmed. STU-01 and
SH-03 disagreed about whether course and lecturer IDs could appear in each returned slot. SH-01's broad
staff-profile access conflicted with STU-01 and SH-03's narrow data-disclosure requirements. As a result,
the code could satisfy one approved document while violating another. Marking the documents approved did
not remove these inconsistencies.

The generator-verifier process itself had some friction. The verifier initially used the wrong pgTAP
`throws_ok` overload, so a correct database rejection appeared as a failed test until the verifier fixed
its own assertion. The security review and functional recheck ran in parallel, which meant one security
report briefly described the database recheck as missing even though the tester completed it shortly
afterward; the coordinator had to request an addendum. The security reviewer was read-only only by
instruction because it inherited a writable sandbox. The developer also changed the newly created,
uncommitted migration during the fix round, exposing uncertainty about how strictly the project's
append-only migration rule applies before a migration is committed or applied.

There were also verification limitations. The persistent local database did not contain the uncommitted
migration, so the normal `npm run test:db` command was blocked and the tester had to apply the migration
inside a transaction and roll it back. Only the signed-out browser path was exercised end to end;
authenticated role fixtures, manual keyboard testing, 320-pixel/200%-zoom checks, and Firefox, Safari,
and Edge testing were not available. Remote CI, CODEOWNERS, and branch-protection enforcement were not
verified because no commit or pull request was created.

### Lessons for the next feature

Before implementation, we should approve a smaller specification slice and make `npm run check:spec`
pass for that slice, instead of approving broad shared specifications whose acceptance criteria cannot
all be implemented yet. Cross-spec permissions and response projections should be reconciled explicitly,
and every remaining open question should be classified as either blocking or safely out of scope.

The generator-verifier structure should be kept because it caught real functional and security defects.
However, verifier tests should receive a quick self-check before their failures are sent back to the
developer, and parallel reviewers should reconcile their final evidence after both runs finish. Database
verification would also be simpler and more representative if the team had a documented disposable
test-database workflow and authenticated browser fixtures ready before feature implementation starts.
