---
id: SH-02
title: Courses and lecturer assignments
owner: team
status: draft
---

# SH-02: Courses and lecturer assignments

## Document control

- Spec owner: shared/team; changes require independent review under `.github/CODEOWNERS`.
- Reviewed repository baseline: `9dae2a00342f159c4211c056ab297fae715451fb`.
- Source feature spec: `workflow/specs/student/STU-01-browse-available-slots.md`, content digest
  `13fb2e0693210f4a97e75b395b167d2cf3f3d4f8` (`draft`, not approved).
- Prior approved commit or digest invalidated by this revision: none; this is a new draft.
- Parent/shared requirements: `PRD-01`, `SHR-01`, `TEC-01`, `INT-01`, and `SH-01`; each is draft at
  the reviewed baseline and is supporting context rather than approved authority.
- Related plan and latest handoff: `workflow/specs/PLAN.md` task P2; this draft's handoff is
  `workflow/handoffs/2026-10-17-sh-02-sh-03-requirements-architect.md`.
- Confirmed requirements: the user's accepted decisions recorded in this document on 2026-10-17.
- Proposed assumptions requiring review: exact logical entities, administrator operations, archival
  rather than deletion, and safe projection/function shapes.
- Unresolved decisions: field bounds and code normalization; course-code changes after use; retention;
  administrator self-management; and handling booked consultations after assignment/account removal.

No source specification is approved. This specification remains `draft`; the accepted decisions below
do not approve the document as a whole.

## Product and feature description

This shared contract defines courses and the relationship assigning lecturers to courses. Student slot
browsing, lecturer slot management, and administrator course management must use the same definitions of
an active course and a current lecturer-course assignment.

## Confirmed, proposed, and unresolved inputs

### Confirmed

- Every active Student may browse every active course; this project does not model or enforce student
  course enrolment.
- An assignment is current while its active/current record exists.
- Removing an assignment blocks new slots and hides future unbooked slots for that pairing, while
  preserving course, assignment, slot, and booking history.
- Existing pending or approved bookings are preserved after assignment removal for later handling.
- Student filter options include only active courses and active lecturers represented by at least one
  currently visible available slot; they expose no counts.
- Student browsing uses a narrow database function/RPC with an explicit active-Student check and fixed
  `search_path`; direct Student reads of underlying course and assignment tables are unavailable.
- No course or assignment data is sent to an LLM for deterministic browsing or filtering.

### Proposed

- Courses and assignments are archived/deactivated instead of hard-deleted after dependent records
  exist.
- Only Administrators manage courses and assignments; Lecturers receive a read-only safe projection of
  their own current assignments.
- Course codes are normalized before uniqueness checks, but the exact normalization is unresolved.
- Filter options are returned by the same protected browse boundary or a companion protected database
  function; the function name and response envelope are implementation proposals.

### Unresolved

- Exact course-code and course-name bounds and the normalization/case-folding rules.
- Whether an Administrator may rename a course code after slots or bookings refer to it.
- Whether an Administrator may remove their own administrative access while managing accounts; this is
  an account-management dependency rather than a course rule.
- The workflow for existing pending/approved bookings when an assignment is removed or a lecturer/course
  is deactivated.
- Retention/deletion periods for archived courses and assignments.

## Scope, non-goals, and dependencies

### In scope

- Course identity, human-readable code/name, active state, and lifecycle invariants.
- Lecturer-course assignment identity, current state, and removal effects.
- Cross-role authorization and safe data projections.
- Referential integrity and Student database access boundaries.
- The course/lecturer source for available-slot filter options.

### Non-goals

- Student enrolment, faculties, semesters, prerequisites, class groups, or course registration.
- Consultation-slot and booking lifecycle rules, which are defined in `SH-03`.
- Administrator UI layout, bulk import, or account-provisioning workflow.
- Automatically cancelling, moving, or reassigning booked consultations.
- AI ranking, recommendation, search, or course matching.

### Dependencies

- `SH-01` supplies authenticated profile IDs, roles, and active-account checks.
- `SH-03` supplies available-slot semantics and the Student browse boundary.
- A later Administrator role spec must define course/assignment management UI and resolve the remaining
  administrative choices.
- A later Lecturer role spec must define creation of slots for current assignments.

## Observed implementation at the reviewed baseline

This is current-state evidence, not a confirmed business rule. The initial migration contains `profiles`,
`ai_usage`, role helpers, and their RLS foundation. It contains no course or lecturer-assignment table,
policy, safe filter projection, or management operation. The Student page is a placeholder, and there are
no course/assignment tests. All behavior in this specification is planned.

## Users, roles, and permissions

Identity, role, and active state come from the authenticated session and trusted `profiles` data. Client
role, user, lecturer, course, or assignment claims never grant access. UI hiding is not authorization.

| Actor                       | Allowed actions/data                                                          | Refused actions/data                                                                             |
| --------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Signed-out or inactive user | None                                                                          | All course, assignment, and filter-option access                                                 |
| Active Student              | Safe course/lecturer filter fields represented by currently available slots   | Underlying tables, counts, inactive catalogue data, assignment metadata, contact data, mutations |
| Active Lecturer             | Proposed read-only safe projection of their own current course assignments    | Other lecturers' assignment details; course or assignment mutations                              |
| Active Administrator        | Proposed create/update/deactivate course and add/remove assignment operations | Bypassing integrity rules or using client-supplied identity as authority                         |
| Server service/admin client | Only a documented server operation after role authorization                   | Ordinary Student browsing or unguarded general-purpose table access                              |

## Functional requirements

### SH-02-R1 — Course record and active lifecycle

- Classification: `confirmed` for active-course visibility; `proposed` for the physical lifecycle.
- Source: accepted user decision; `INT-01` and `TEC-01` drafts provide supporting context.

A course has an opaque identifier, code, name, active state, and audit timestamps. Only active courses
may receive newly created slots or appear in Student browse/filter results. Deactivation must preserve
dependent historical records and must not itself rewrite or delete bookings. Hard deletion after a
dependent slot, booking, or assignment exists is proposed to be refused.

### SH-02-R2 — Course-code uniqueness

- Classification: `proposed`.
- Source: `INT-01` and `TEC-01` drafts; exact normalization remains unresolved.

The canonical course code must be non-blank and unique after the approved normalization rule. Concurrent
attempts to create the same canonical code must not create duplicate courses. Exact character and length
bounds require a human decision before approval.

### SH-02-R3 — Current lecturer-course assignment

- Classification: `confirmed`.
- Source: accepted user decision.

A lecturer-course pair is current while an active/current assignment record exists. At most one current
assignment may exist for the same pair. A new or reactivated assignment may reference only an existing,
active course and an existing, active profile whose trusted role is `lecturer`.

### SH-02-R4 — Assignment removal and preservation

- Classification: `confirmed`.
- Source: accepted user decision.

Removing an assignment makes it non-current, blocks new slots for the pair, and hides that pair's future
unbooked slots from Student browsing. It preserves the assignment record or equivalent audit history,
all slots, and all bookings. Pending and approved bookings remain stored and are not automatically
cancelled, reassigned, approved, rejected, or otherwise transitioned. Their operational resolution is an
unresolved later Lecturer/Administrator workflow.

### SH-02-R5 — Student catalogue visibility

- Classification: `confirmed`.
- Source: accepted user decision.

Every active Student may browse available slots across every active course. No student-enrolment entity,
membership check, or enrolment-based restriction is part of this project scope. A valid but inactive,
unrepresented, inaccessible, or nonexistent course/lecturer filter must not disclose which condition
applies.

### SH-02-R6 — Available-slot filter options

- Classification: `confirmed`.
- Source: accepted user decision and STU-01 challenge finding 9 disposition.

At query time, filter options contain only active courses and active lecturers having at least one slot
visible under the `SH-03` availability predicate. The safe projection contains only course ID/code/name
and lecturer ID/display name needed to select a filter. It returns no result counts, assignment dates,
account/contact fields, or explanation for absence. Options are deterministically ordered and bounded by
the number of qualifying catalogue entries; an implementation must not issue an unbounded row-by-row
query.

### SH-02-R7 — Proposed Administrator management boundary

- Classification: `proposed`.
- Source: user-provided project overview and `PRD-01`/`TEC-01` drafts.

Only an active Administrator may create or update courses and add, reactivate, remove, or deactivate
lecturer assignments. The server must authorize the Administrator before any service/admin client is
created or used. Database authorization and integrity constraints must independently reject direct
wrong-role mutation attempts. Exact administrative inputs and self-management rules belong in the later
Administrator spec.

### SH-02-R8 — Lecturer assignment projection

- Classification: `proposed`.
- Source: Lecturer slot-management dependency in the user-provided project overview.

An active Lecturer may read the safe identity/code/name of only their current active-course assignments
for slot creation. This read surface returns no other lecturer's assignments or private account fields.

### SH-02-R9 — Database access and projection boundary

- Classification: `confirmed`.
- Source: accepted user decision and STU-01 challenge finding 2 disposition.

Row-level security is enabled for every new public table. Normal Student credentials have no direct
`SELECT` or mutation access to underlying course or assignment tables. Student filter data is exposed
only through a narrowly scoped security-definer database function/RPC that explicitly verifies an active
Student, uses a fixed empty or explicit safe `search_path`, schema-qualifies referenced objects, and
returns the `SH-02-R6` projection. It must not use a service/admin client for ordinary browsing.

### SH-02-R10 — Failure and disclosure behavior

- Classification: `confirmed`.
- Source: accepted user decision; `INT-01` typed-failure draft.

Direct calls by signed-out, inactive, or wrong-role actors return the shared typed
`forbidden_or_not_found` outcome and no catalogue data. Valid-but-unavailable identifiers produce the
same empty/validation behavior selected by the calling role spec without revealing catalogue or
assignment existence. Unexpected database failures expose no raw database error, query, schema, stack
trace, or private field; logs contain only bounded operation/failure metadata and a correlation ID.

### SH-02-R11 — No-AI boundary

- Classification: `confirmed`.
- Source: accepted user decision.

Course/assignment lookup and filter-option generation are deterministic and must not call
`generateText`, another model provider, or AI usage accounting. No course, lecturer, assignment, filter,
or session data from this shared boundary is sent to an LLM.

## Non-functional requirements

### SH-02-R12 — Integrity, capacity, and compatibility

- Classification: `proposed` except where inherited from confirmed access decisions.
- Source: `SHR-01` draft and accepted bounded-disclosure decision.

Course and assignment lookups must use indexes suitable for active-state, normalized-code,
lecturer/course-pair, and availability joins. Safe projections must remain usable by the current major
Chrome, Firefox, Safari, and Edge clients through role-specific UIs; database authorization must not rely
on browser behavior. Exact catalogue capacity and response-time targets are unresolved.

## UI description

This shared specification defines no page. Role specs own controls and feedback. Any UI consuming this
contract must display course code/name and lecturer display name as plain text, distinguish empty/loading/
error states, and must not infer that a hidden option is nonexistent rather than merely unavailable.

## Use cases

### UC1 — Student receives safe filter options

- Actors: active Student.
- Preconditions: authenticated active Student; at least one `SH-03`-available slot.
- Trigger: Student slot-browse page requests filter options.
- Main flow: the protected boundary authorizes the Student, applies the current availability predicate,
  and returns safe distinct course and lecturer options without counts.
- Alternative and failure flows: no qualifying slots returns empty option lists; wrong-role/direct-table
  calls are refused; infrastructure failure returns a safe typed failure.
- Postconditions and invariants: no record changes; no hidden fields or booking reasons are disclosed.

### UC2 — Assignment is removed

- Actors: active Administrator (proposed management actor).
- Preconditions: a current lecturer-course assignment exists.
- Trigger: authorized removal/deactivation request.
- Main flow: the assignment becomes non-current; new slots are refused and future unbooked slots cease
  to be Student-visible.
- Alternative and failure flows: a stale or inaccessible assignment returns a typed conflict/refusal;
  pending/approved bookings remain intact for later resolution.
- Postconditions and invariants: history is preserved and no booking transition is implied.

## Technical constraints and proposals

- Fixed constraints: Supabase PostgreSQL, append-only migrations, RLS, server-validated identity, no
  Student direct-table access, and fixed-search-path security-definer functions.
- Proposed entities: `courses` and `course_lecturers`; names do not authorize exact migration syntax.
- Proposed safe option function: `list_available_slot_filters()`. It may instead be incorporated into a
  versioned `SH-03` browse RPC if the same projection and security invariants are preserved.
- The existing `workflow/specs/PLAN.md` P2 remains the task plan; no implementation plan is authorized by
  this draft.

## Data model and integrity rules

| Logical entity             | Required information                                                            | Required invariants                                                                           | Classification/source                          |
| -------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Course                     | Opaque ID, code, name, active state, created/updated times                      | Canonical-code uniqueness; active check for new slots; history preserved                      | Mixed: accepted visibility plus proposed shape |
| Lecturer-course assignment | Course ID, lecturer profile ID, current state or removal timestamp, audit times | One current pair; active lecturer role and course on creation/reactivation; history preserved | Confirmed lifecycle; proposed shape            |

Foreign keys prevent orphaned records. Existing migrations are never edited. A later approved migration
must define database constraints, indexes, grants/revokes, and RLS/function permissions. Retention and
hard-deletion rules remain unresolved and must not be invented during implementation.

## API and boundary contracts

The exact TypeScript and SQL names are proposed. Observable behavior is normative according to each
requirement's classification.

```ts
type CourseFilterOption = {
  id: string;
  code: string;
  name: string;
};

type LecturerFilterOption = {
  id: string;
  displayName: string;
};

type FilterOptionsResult =
  | { ok: true; courses: CourseFilterOption[]; lecturers: LecturerFilterOption[] }
  | { ok: false; reason: "forbidden_or_not_found" | "temporarily_unavailable" };
```

The boundary accepts no role, user ID, limit, sort, arbitrary search term, or requested-column list.
Authentication is derived inside the database/session boundary. Response fields are allowlisted; adding
a field is a material data-contract change requiring renewed review.

## Security requirements

- Entry points: role page layouts and server operations enforce roles; database functions recheck active
  role and RLS/grants refuse underlying-table access.
- Authorization order: authenticate, resolve trusted active role, validate bounded input, authorize the
  operation, then query; an administrative client is never used for Student reads.
- Trusted inputs: server/database identity, database time, and stored integrity-protected identifiers.
- Untrusted inputs: all client identifiers and all stored course/lecturer display text.
- Output validation: exact safe projections; display text is rendered as text, never HTML.
- Disclosure: availability and the safe option fields are permitted disclosure. Counts, absence reasons,
  assignments, contacts, booking identity/content/status/history, and internal audit data are prohibited.
- Abuse cases: direct table access, role/user-ID substitution, requested-column injection, stored script
  text, enumeration through different errors, repeated scraping, and concurrent duplicate assignment.
- Sensitive actions: schema, RLS, function, grant, and assignment-lifecycle changes require shared-spec
  approval and independent human review before merge.
- Safe logging: bounded operation name, failure category, and correlation ID only; no raw display values,
  identifiers from malformed requests, SQL, or database messages.

## AI behavior

No AI is used. Model calls, prompt construction, AI usage writes, generated ranking, generated labels,
and transfer of course/assignment/session data to a model are prohibited for this contract.

## Edge cases and failure paths

| Condition                                                           | Required observable outcome                               | Invariant preserved              |
| ------------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------- |
| Duplicate canonical course code                                     | One operation conflicts; no duplicate row                 | Course-code uniqueness           |
| Assignment targets inactive/non-lecturer profile or inactive course | Validation/refusal; no current assignment                 | Valid assignment endpoints       |
| Concurrent duplicate assignment                                     | At most one current pair                                  | Pair uniqueness                  |
| Assignment removed with future unbooked slots                       | Slots become unavailable to Students and for new creation | History retained                 |
| Assignment removed with pending/approved booking                    | Booking remains unchanged; later handling is unresolved   | No implicit transition/data loss |
| Student directly selects underlying tables                          | Database refuses and returns no rows                      | Projection boundary              |
| Stored code/name/display name contains markup or instructions       | Returned only within bounded text fields; UI renders text | No execution/model instruction   |
| Filter-option query has no available slots                          | Empty lists, no counts or absence reason                  | Minimal disclosure               |
| Database unavailable                                                | Safe typed failure; no partial/stale payload              | No infrastructure disclosure     |

## Acceptance criteria and verification

These planned checks are not results. All automated test names must reference the exact AC ID.

- **SH-02-AC1** (`SH-02-R1`; pgTAP integration; deterministic local database): Given active and
  inactive courses, when Student-visible data is derived, then only active courses represented by
  available slots appear.
- **SH-02-AC2** (`SH-02-R1`; pgTAP integration; deterministic local database): Given a course with
  dependent history, when deactivation occurs, then dependent assignments, slots, and bookings are not
  deleted or rewritten.
- **SH-02-AC3** (`SH-02-R2`; pgTAP integration; deterministic local database): Given concurrent
  equivalent canonical codes, when both create operations commit, then at most one course exists and the
  other conflicts.
- **SH-02-AC4** (`SH-02-R3`; pgTAP integration; deterministic local database): Given invalid, inactive,
  non-lecturer, duplicate, and valid endpoints, when assignments are created, then only one valid current
  pair succeeds.
- **SH-02-AC5** (`SH-02-R4`; pgTAP integration; deterministic local database): Given a current
  assignment with a future unbooked slot, when it is removed, then new slot creation is refused and the
  slot is not Student-visible.
- **SH-02-AC6** (`SH-02-R4`; pgTAP integration; deterministic local database): Given assignment removal
  with pending or approved bookings, when removal completes, then assignment, slot, and booking history
  and booking states remain unchanged.
- **SH-02-AC7** (`SH-02-R5`; pgTAP integration; deterministic local database): Given two active Students
  without enrolment records, when each browses, then each has the same course eligibility subject only to
  availability filters.
- **SH-02-AC8** (`SH-02-R6`; pgTAP integration plus contract test; deterministic local database/mock):
  Given mixed catalogue and availability state, when filter options are requested, then only qualifying
  active course/lecturer safe fields appear, without counts.
- **SH-02-AC9** (`SH-02-R7`; pgTAP integration; deterministic local database): Given a Student or
  Lecturer invokes an Administrator course/assignment mutation directly, then it returns refusal and
  changes no row.
- **SH-02-AC10** (`SH-02-R7`; integration; deterministic local database): Given an authorized
  Administrator operation, when endpoint integrity fails, then it returns validation/conflict and leaves
  data consistent.
- **SH-02-AC11** (`SH-02-R8`; pgTAP integration; deterministic local database): Given two Lecturers,
  when each lists assignments, then each receives only their own current active-course safe projection.
- **SH-02-AC12** (`SH-02-R9`; pgTAP security integration; deterministic local database): Given a Student
  directly selects or mutates course/assignment tables or requests extra columns, then database grants/
  RLS refuse it while the safe function remains callable.
- **SH-02-AC13** (`SH-02-R9`; pgTAP schema/security inspection; deterministic local database): Given
  security-function metadata is inspected, then it verifies active Student role and uses fixed safe
  `search_path` and qualified objects.
- **SH-02-AC14** (`SH-02-R10`; unit/integration; deterministic mock/local database): Given inaccessible,
  nonexistent, or inactive identifiers and a database failure, when the boundary responds, then it
  exposes no existence distinction or raw infrastructure detail.
- **SH-02-AC15** (`SH-02-R10`; unit; deterministic mock): Given failure logging is captured, then it
  contains bounded metadata/correlation ID and no display text, raw identifier, SQL, or database message.
- **SH-02-AC16** (`SH-02-R11`; unit plus pgTAP before/after; deterministic mock/local database): Given
  filter options are requested, then no model gateway/provider call or `ai_usage` mutation occurs.
- **SH-02-AC17** (`SH-02-R12`; database plan/manual inspection; deterministic local database/N/A): Given
  qualifying catalogue records, when query plans/index metadata are reviewed, then active, pair, and
  availability join paths avoid row-by-row unbounded lookup.

## Review evidence

- Challenge record: required after this draft; none yet.
- Review type: no independent review completed.
- Open findings and disposition: STU-01 challenge findings 1, 2, 4, 5, and 9 are addressed by
  confirmed decisions represented here; remaining implementation readiness depends on `SH-03`, STU-01
  revision, and resolution of this document's open questions.
- Human input required: resolve the blocking choices below and independently review the eventual digest.

## Open questions blocking approval

1. What exact course-code and course-name length/character bounds apply, and what normalization produces
   the unique canonical code?
2. May an Administrator change a course code after any assignment, slot, or booking references it?
3. Should unused courses/assignments ever be hard-deleted, and what retention period applies to archived
   records?
4. What exact workflow resolves existing pending/approved bookings after assignment removal or lecturer/
   course deactivation? This draft only preserves them.
5. What maximum catalogue size and measurable performance target should apply to filter-option retrieval?
6. The later account-management spec must decide administrator self-role/deactivation restrictions; it
   must not be inferred here.

## Change log

| Date       | Change and reason                                                   | IDs affected                 | Evidence invalidated | By                     |
| ---------- | ------------------------------------------------------------------- | ---------------------------- | -------------------- | ---------------------- |
| 2026-10-17 | Initial draft recording accepted shared course/assignment decisions | SH-02-R1–R12, SH-02-AC1–AC17 | None; new draft      | requirements_architect |
