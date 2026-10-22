# First vertical slice plan: publish and read announcements

- Task proposal: `ADM-03-VS1`
- Status: proposed; not approved and not authorized for implementation
- Parent plan item: `PLN-01` / `P11`
- Repository baseline reviewed: `87a8951`

## Outcome

Deliver one bounded, non-AI, two-role workflow:

1. an active administrator views announcements and creates or edits one through a server-authorized
   form;
2. the administrator may set the agreed publication state;
3. an active student sees only published announcements in deterministic order;
4. all content is displayed as plain text;
5. direct client/database attempts cannot expose drafts to students or mutate records without an
   administrator role.

This plan does not choose the open publication, category, visibility, ownership, bounds, ordering,
stale-edit, deletion, or retention rules. Those choices must be recorded in an approved detailed
spec before the files below may be implemented.

## Existing requirement links

| Existing ID   | Relevance to the slice                                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PRD-01`      | Administrators publish/edit guidelines and announcements; students read published content; role boundaries are server-enforced.                               |
| `PRD-01-AC10` | Direct use of another role's page/action must be refused with no mutation.                                                                                    |
| `TEC-01`      | Announcement records contain bounded plain-text content, publication state, author, and timestamps; only published records reach students.                    |
| `INT-01`      | Defines the logical `announcements` entity, manage-announcement action boundary, server-derived administrator identity, and non-enumerating failure contract. |
| `INT-01-AC3`  | Inaccessible identifiers must not disclose record existence or fields.                                                                                        |
| `INT-01-AC5`  | Server/database time, not browser time, governs authorization decisions if publication scheduling is selected.                                                |
| `INT-01-AC6`  | Expected validation/permission/conflict results must not expose infrastructure details.                                                                       |
| `SHR-01-AC1`  | The new public table needs RLS and only spec-justified policies.                                                                                              |
| `SHR-01-AC2`  | Cross-role direct mutation must fail before administrative access or data change.                                                                             |
| `SHR-01-AC3`  | Build/test/browser/handoff artifacts must contain no secrets.                                                                                                 |
| `PLN-01-AC1`  | Implementation waits for an approved detailed spec and resolved implementation decisions.                                                                     |
| `PLN-01-AC3`  | Merge evidence includes criterion-linked tests and all role handoffs.                                                                                         |

The umbrella specs contain no announcement-specific acceptance criteria. The requirements architect
must draft `ADM-03-AC1` onward after the open decisions are answered. Proposed coverage categories
below are placeholders, not approved requirements and not valid test IDs until that spec exists.

## Prerequisites and dependencies

1. Human resolves the ten slice questions in the readiness review.
2. Requirements architect drafts `workflow/specs/admin/ADM-03-announcements.md`, including exact
   schema fields, RLS policy matrix, action result types, UI behavior, bounds, failure behavior, and
   atomic/stale-edit rules.
3. A named human approves `ADM-03` and records the spec version/commit.
4. Human resolves the `SH-01` approval problem: either approve a corrected auth/RLS foundation
   independently or complete all blocking `SH-01` requirements. The slice does not depend on AI at
   runtime, but `PLN-01/P11` currently declares `P1` as a dependency.
5. Local fake administrator and student accounts are available through the existing development
   setup. No production credentials or data are used.

Existing shared components to reuse:

- `requireRole` and `getCurrentUser` from `src/lib/auth/session.ts`;
- signed-in Supabase server client from `src/lib/supabase/server.ts`;
- current role layouts and `RoleShell`;
- Zod for server input validation;
- `current_app_role()` in PostgreSQL for deactivation-aware role policies;
- existing CI, Vitest, pgTAP, Playwright, and traceability scripts.

The implementation should not use `createAdminClient`; normal signed-in admin operations should be
constrained by RLS so application and database authorization are both exercised.

## Proposed detailed acceptance coverage

The final `ADM-03` spec should split these into atomic criteria with approved identifiers:

1. an active admin can create valid bounded plain-text content, with author identity derived from
   the authenticated session rather than submitted input;
2. an active admin can edit an accessible record under the approved stale-write rule;
3. the approved publication transition makes a record visible to students; a draft or unpublished
   record is not visible;
4. the student list is bounded, deterministically ordered, and contains only approved fields;
5. student, lecturer (according to the visibility decision), signed-out, wrong-role, and inactive
   actors cannot invoke admin mutations;
6. direct database access enforces the same select/insert/update/delete matrix as the application;
7. invalid IDs, blank/oversized fields, unexpected form values, and inaccessible IDs produce the
   approved typed failure without changing data or disclosing record existence;
8. text containing HTML/script-like content is rendered literally and cannot execute;
9. database/provider failure shows a generic handled error with no raw SQL, stack, or secret;
10. if scheduled publication is selected, visibility uses database/server time and exact boundary
    behavior is tested.

## Work sequence

Requirement changes follow spec → tests → code.

### Phase 1 — requirements and human gate

1. `requirements_architect` drafts `ADM-03`, updates this plan only as required by approved human
   decisions, and leaves a handoff.
2. Human reviewer resolves all material questions, requests revisions if needed, and alone changes
   the detailed spec to `approved`.

Exit condition: exact approved spec version and approver are recorded; no implementation-affecting
question remains.

### Phase 2 — acceptance/security tests first

1. `tester_verifier` adds initially failing pgTAP tests for the complete announcement RLS matrix.
2. It adds Playwright coverage for the approved admin-to-student journey, wrong-role direct access,
   hidden drafts, validation messages, and script-like rendering.
3. It records whether each test fails for the expected missing-feature reason; it does not implement
   the feature or weaken a criterion.

Exit condition: every approved `ADM-03-ACn` appears in a non-skipped planned acceptance/security
test, and `npm run check:spec` recognizes the references.

### Phase 3 — database and backend

1. Add one append-only migration defining the approved announcement schema, SQL bounds/integrity,
   indexes, RLS, and the minimum policies in the approved matrix.
2. Add Zod schemas and typed results matching the approved field and error contracts.
3. Add admin query/actions. Every admin mutation starts with `requireRole("admin")`, derives author
   from the returned user, uses the signed-in client, selects/updates only permitted fields, and
   maps expected database errors to approved non-sensitive outcomes.
4. Add a student query that starts from the authenticated student boundary, selects only approved
   published fields, and applies the approved limit/order. It does not accept a caller-supplied user
   or role.

Exit condition: unit and pgTAP tests pass; direct database requests cannot bypass visibility or
mutation rules.

### Phase 4 — UI

1. Add an administrator announcement page with labelled fields, length guidance, pending state,
   readable validation/conflict errors, and the approved publish/edit controls.
2. Add a student announcement page with text status and deterministic ordering/empty state.
3. Link the pages from existing admin/student dashboards without changing shared navigation.
4. Render title/body through normal React text interpolation. Do not use HTML injection APIs.

Exit condition: Playwright happy, boundary, authorization, hidden-draft, and XSS rendering tests pass.

### Phase 5 — independent review and documentation

1. Developer runs lint, typecheck, unit tests, traceability, build, database lint/tests, and the
   targeted Playwright test, recording actual results.
2. `tester_verifier` reruns independently and reports passed/failed/blocked/unexecuted checks.
3. `security_reviewer` performs a read-only review of the approved spec, diff, Server Action guards,
   RLS, field selection, error mapping, rendering, secrets, and handoff evidence.
4. Developer addresses findings through at most two fix/review cycles.
5. Update user/developer documentation and present all evidence for human pull-request review.

## Authorization and data-access boundary

| Actor                | Application boundary                                                | Database boundary                                                | Permitted data/action                                        |
| -------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------ |
| Signed out           | Proxy/login boundary                                                | `anon` receives no table policy                                  | No announcement data or mutation                             |
| Active student       | `requireRole("student")` for student page/query                     | SELECT policy uses active role and publication rule              | Approved public fields of published records only             |
| Active lecturer      | Must follow the human visibility decision; never uses admin actions | Policy exactly matches that decision                             | At most published fields if explicitly approved; no mutation |
| Active administrator | `requireRole("admin")` at the start of every action                 | Admin policies use `current_app_role()` and approved author rule | Approved create/read/edit/publish operations                 |
| Inactive user        | `getCurrentUser` denies application access                          | `current_app_role()` returns null                                | No announcement rows or mutation                             |
| Secret/admin client  | Not used for this slice                                             | Not applicable                                                   | None                                                         |

Submitted `author_id`, role, active state, creation timestamp, or ownership fields must be rejected or
ignored according to the approved action schema; they must never determine authorization.

## Failure and security test matrix

| Case                                                  | Required assertion                                                   | Primary layer       |
| ----------------------------------------------------- | -------------------------------------------------------------------- | ------------------- |
| Blank, oversized, malformed, or unexpected input      | Typed validation result; zero writes; no raw error                   | Unit/action + E2E   |
| Student invokes create/edit/publish action directly   | Refused before write; no record-enumeration detail                   | Action + pgTAP      |
| Student queries a draft by guessed ID                 | No row/fields returned                                               | pgTAP + integration |
| Inactive admin with an existing token attempts access | No select/mutation                                                   | pgTAP + integration |
| Submitted author/role substitution                    | Stored author remains authenticated admin or input is rejected       | Action + database   |
| Stale edit                                            | Approved conflict behavior; newer content preserved                  | Action/integration  |
| Script-like title/body                                | Visible as literal text; no script/event executes                    | Playwright          |
| Database failure                                      | Generic handled UI outcome; no SQL/schema/stack leak                 | Unit/action         |
| Publication boundary                                  | Exact approved visibility rule, including time boundary if scheduled | pgTAP + integration |
| Excess list size                                      | Approved limit/pagination and deterministic order                    | Query + E2E         |
| RLS disabled or policy broadened                      | Schema/policy test fails                                             | pgTAP               |

## Exact proposed edit scopes

These scopes apply only after the preceding human gate. A coordinator should replace the handoff
filenames with a collision-free exact name when assigning each task.

### `requirements_architect`

May modify only:

- `workflow/specs/admin/ADM-03-announcements.md`
- `workflow/plans/2026-10-17-first-vertical-slice.md`
- `workflow/handoffs/2026-10-17-ADM-03-requirements-architect.md`

Must not modify application code, tests, migrations, CI, deployment, or existing approved specs.

### `tester_verifier`

For the tests-first task, may modify only:

- `supabase/tests/announcements.test.sql`
- `tests/e2e/announcements.spec.ts`
- `workflow/handoffs/2026-10-17-ADM-03-tester-verifier.md`

If pure validation acceptance tests are necessary, the human-approved assignment may additionally
name one exact test path under `src/features/admin/announcements/`; it must not grant the whole
directory implicitly. The tester must not modify application code, specs, migrations, CI, or
security configuration.

### `developer`

May modify only:

- `supabase/migrations/20261017010000_announcements.sql`
- `src/features/admin/announcements/schema.ts`
- `src/features/admin/announcements/schema.test.ts`
- `src/features/admin/announcements/actions.ts`
- `src/features/admin/announcements/actions.test.ts`
- `src/features/admin/announcements/queries.ts`
- `src/features/student/announcements/queries.ts`
- `src/app/admin/announcements/page.tsx`
- `src/app/admin/announcements/announcement-form.tsx`
- `src/app/admin/page.tsx`
- `src/app/student/announcements/page.tsx`
- `src/app/student/page.tsx`
- `docs/UserGuide.md`
- `docs/DeveloperGuide.md`
- `workflow/handoffs/2026-10-17-ADM-03-developer.md`

The developer must not edit the acceptance/security test files owned by `tester_verifier`, existing
migrations, specs, shared auth/Supabase code, AI code, CI, or deployment. Any discovered need outside
this list returns to the coordinator for a new reviewed assignment; it is not silently expanded.

### `security_reviewer`

May modify no repository file. It returns a findings-first report to the coordinator after inspecting
only the approved spec/version, assigned diff, relevant auth/RLS paths, tests, handoffs, CI permissions,
and secret-exposure risks. For technical read-only enforcement, run its parent session with a
read-only sandbox. The coordinator, not the reviewer, records any required repository handoff under
a separately authorized path.

## Required completion evidence

- exact approved `ADM-03` commit/version and named human approver;
- criterion-to-test traceability with no skipped/todo approved criteria;
- migration diff and pgTAP policy/integrity results;
- unit, lint, typecheck, build, targeted E2E, and full applicable suite outcomes;
- developer and tester handoffs plus read-only security findings;
- proof that no secret/admin client, raw HTML rendering, unrelated file, existing migration, CI, or
  deployment file changed;
- human review decision after unresolved findings are presented.
