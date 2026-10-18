---
id: SH-02
title: Course and lecturer-assignment browse read model
owner: team
status: draft
---

# SH-02: Course and lecturer-assignment browse read model

## Document control

- Spec owner: shared/team; changes require independent review under `.github/CODEOWNERS`.
- Reviewed repository baseline: `e5893b28a6d898bdfb698dcb7f48e293ab373e7b` plus the uncommitted
  STU-01 implementation identified in `workflow/handoffs/archive/stu-01/2026-10-18-stu-01-coordinator.md`.
- Prior team-reported approved behavior digest invalidated by this revision:
  `97c7288030a3aa1df604ce892cf4547497c75be9`; prior canonical metadata digest:
  `8e8f677d361a18a41e9b073ac189618a2b9b63b5`.
- Change-impact record: `workflow/reviews/stu-01/2026-10-18-shared-spec-traceability-impact.md`.
- Parent/shared requirements: `SH-01`, `SH-03`, and `STU-01`.
- Related future scope: `SH-04` owns course/assignment management and Lecturer projections.
- Confirmed requirements: the previously approved Student browse visibility, data-minimization,
  assignment-validity, and no-AI rules retained below.
- Confirmed revision decisions: assignment eligibility is derived from the stored current/active flag
  and both active trusted endpoints; Student filter options are represented-only and capped at 200 per
  option type; Student staff discovery uses narrow RPC projections rather than direct profile reads.
- Proposed assumptions requiring review: the exact physical table/function names remain implementation
  proposals rather than product behavior.
- Unresolved decisions: the `SH-04` management decisions do not block this read-only contract.

This material boundary revision preserves the approved Student browse behavior but removes unrelated
future management behavior. Its status is reset to `draft`; the prior approval is stale until a teammate
reviews the exact revised digest. No implementation or test change is authorized by this draft.

## Product and feature description

This contract defines the minimum course and lecturer-assignment read model required for an active
Student to browse available consultation slots and receive safe filter options. It does not define who
creates, edits, archives, or deletes courses or assignments.

## Scope, non-goals, and dependencies

### In scope

- Course and lecturer-assignment facts used by the available-slot predicate.
- Active-course/current-assignment visibility semantics.
- Student filter-option projection and disclosure boundary.
- Student database authorization, safe failures, bounded retrieval, and no-AI behavior.

### Non-goals

- Course-code normalization, course creation/update/deactivation, or deletion/retention workflows.
- Assignment add/reactivate/remove workflows and their Administrator APIs.
- Lecturer assignment-list projections for slot creation.
- Slot creation or booking mutation behavior.

Those concerns moved to draft `SH-04`; slot/booking mutation concerns are in draft `SH-05`.

### Dependencies

- `SH-01` supplies trusted profile identity, active state, and role.
- `SH-03` defines Student-visible slot availability and the browse boundary.
- `STU-01` owns the `/student/slots` UI and its filter behavior.

## Observed implementation

Current-state evidence, not authority: the uncommitted STU-01 migration defines `courses`,
`course_lecturers`, integrity checks, and a protected browse RPC. Existing tests reference
`SH-02-AC4`, `SH-02-AC12`, `SH-02-AC15`, and `SH-02-AC16`. Other retained criteria need real tests after
renewed approval. The implementation still has the now-resolved specification conflict: its broad
staff-profile RLS policy violates the confirmed narrow Student boundary and requires a later append-only
migration plus security tests.

## Users, roles, and permissions

| Actor                       | Allowed actions/data                                  | Refused actions/data                                                                             |
| --------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Signed-out or inactive user | None                                                  | All course, assignment, and filter-option access                                                 |
| Active Student              | Safe options represented by currently available slots | Underlying tables, counts, inactive records, assignment metadata, contacts, and mutations        |
| Lecturer or Administrator   | Nothing through this Student-only boundary            | Calling the Student browse projection merely because another role has broader future permissions |
| Server service/admin client | No role in ordinary Student browsing                  | Unguarded table access or bypassing the active-Student check                                     |

Identity and role come from the authenticated session and trusted profile data. UI hiding is not
authorization.

## Functional requirements

### SH-02-R1 — Browse course record and active visibility

- Classification: `confirmed`.
- Source: prior team-reported approval and accepted Student browse decisions.

The read model supplies opaque course ID, code, name, and active state. Only active courses may appear
in Student slot results or filter options. Course/assignment/slot/booking records referenced by browse
are not rewritten or deleted by a read operation.

### SH-02-R3 — Current lecturer-course assignment integrity

- Classification: `confirmed`.
- Source: prior team-reported approval.

A stored current/active assignment links one course to one profile, and at most one such stored record
exists for a lecturer-course pair. Browse eligibility is derived at query time and is true only when the
assignment record is current/active, the course is active, and the profile is active with trusted role
`lecturer`. Deactivating either endpoint or changing the trusted role makes the pair ineligible without
mutating, ending, or deleting the assignment record. The browse predicate trusts only database-
protected assignment and endpoint state, never a caller claim.

### SH-02-R4 — Non-current assignment read semantics

- Classification: `confirmed`.
- Source: prior team-reported approval.

A non-current assignment hides the pair's future unbooked slots from Students. Existing records and any
pending or approved booking remain stored and are not automatically transitioned by browsing or by the
read model. The authorized mutation that makes an assignment non-current is outside this contract.

### SH-02-R5 — Student catalogue visibility

- Classification: `confirmed`.
- Source: prior team-reported approval.

Every active Student may browse availability across every active course; no Student-enrolment entity or
membership restriction exists in this project slice. Valid but inactive, unrepresented, inaccessible,
and nonexistent lecturer/course identifiers produce no distinguishable existence detail.

### SH-02-R6 — Available-slot filter options

- Classification: `confirmed`.
- Source: prior team-reported approval and STU-01 challenge disposition.

At query time, options include only active courses and active lecturers represented by at least one slot
visible under `SH-03`. Course options sort by `(code, id)` and return at most the first 200; Lecturer
options sort by `(displayName, id)` and return at most the first 200. The projection contains course
ID/code/name and lecturer ID/display name, with no counts, contact fields, assignment dates, audit fields,
or reason for absence.

If more than 200 represented options exist, additional options are omitted without a total, truncation
flag, existence indicator, or different error. The 20-row slot page remains independently authorized
and may display an allowlisted course or Lecturer whose filter option falls beyond the deterministic
cap. A well-formed direct filter for an omitted option follows the same success/empty and non-enumeration
rules as every other identifier. Retrieval is set-based and bounded, not an unbounded row-by-row query.

### SH-02-R9 — Student database boundary

- Classification: `confirmed`.
- Source: prior team-reported approval and STU-01 challenge disposition.

RLS is enabled on every public table. Student credentials have no direct `SELECT` or mutation access to
course or assignment tables and no direct read access to another user's profile row. Course and
Lecturer discovery is exposed only through the narrow Student browse RPC defined by `SH-03`, which
checks an active Student, uses a fixed safe `search_path`, schema-qualifies referenced objects, returns
only allowlisted fields, and does not use a service/admin client. Own-profile access required by
`SH-01` does not authorize staff-profile discovery.

### SH-02-R10 — Failure and disclosure behavior

- Classification: `confirmed`.
- Source: prior team-reported approval.

Signed-out, inactive, and wrong-role direct callers receive `forbidden_or_not_found` and no catalogue
data. Valid unavailable identifiers use the same empty result as nonexistent identifiers. Unexpected
database failures expose no raw database error, SQL, schema, stack, or private field; logs contain only
bounded operation/failure metadata and a correlation ID.

### SH-02-R11 — No-AI boundary

- Classification: `confirmed`.
- Source: prior team-reported approval.

Course/assignment lookup and filter generation are deterministic. They do not call a model, construct a
prompt, or read/write AI usage, and they send no course, lecturer, assignment, filter, or session data to
an LLM.

## Non-functional requirements

### SH-02-R12 — Bounded and index-supported retrieval

- Classification: `confirmed` for bounded disclosure; `proposed` for the exact index design.
- Source: prior team-reported approval.

The read model uses database indexes appropriate to active-course, current-pair, and availability joins.
Database authorization does not rely on browser behavior. Each response returns at most 200 course
options and 200 Lecturer options under `SH-02-R6`; exact total catalogue capacity and latency targets
remain future operational decisions and are not silently inferred.

## UI description

This shared spec defines no page. `STU-01` owns UI states. Consumers render course and lecturer display
fields as plain text and must not infer that a hidden option is nonexistent rather than unavailable.

## Use cases

### UC1 — Student receives safe filter options

- Actors: active Student.
- Preconditions: authenticated active Student.
- Trigger: the Student browse page requests its bounded browse response.
- Main flow: the database boundary authorizes the Student, applies the `SH-03` predicate, and returns
  distinct safe course/lecturer options without counts.
- Alternative and failure flows: no qualifying slots returns empty options; wrong-role callers are
  refused; dependency failure returns a generic typed failure.
- Postconditions and invariants: no row changes and no prohibited field or absence reason is disclosed.

## Technical constraints and proposals

Supabase PostgreSQL, append-only migrations, RLS, server/database identity, and a fixed-`search_path`
security-definer function are fixed constraints. `courses`, `course_lecturers`, and the combined browse
RPC are observed names, not permission to expand their API.

## Data model and integrity rules

| Logical record             | Required browse information                  | Read-side invariant                                                                          |
| -------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Course                     | ID, code, name, active state                 | Student results/options contain active represented courses only                              |
| Lecturer-course assignment | Course ID, lecturer ID, stored current state | Eligibility additionally requires an active course and active trusted Lecturer at query time |

Foreign keys prevent orphaned references. Management lifecycle, retention, and physical deletion belong
to `SH-04` and must not be invented while implementing this read contract.

## API and boundary contracts

The browse response may include only these option shapes:

```ts
type CourseFilterOption = { id: string; code: string; name: string };
type LecturerFilterOption = { id: string; displayName: string };
```

The boundary accepts no role, user ID, page size, requested-column list, sort expression, or arbitrary
search term. Adding an output field is a material data-contract change.

## Security requirements

- Authorize the active Student before protected querying; RLS/grants and the RPC independently enforce
  the boundary.
- Treat all client identifiers and stored display strings as untrusted.
- Allowlist response fields and render display strings only as text.
- Permit availability and safe option fields; prohibit counts, contacts, assignments, booking data,
  audit fields, and absence reasons.
- Refuse direct-table access, role/ID substitution, requested-column injection, stored script text, and
  existence enumeration without weakening the response boundary.
- Require independent human review for schema, RLS, function, and grant changes.

## AI behavior

No AI is used or permitted for this contract.

## Edge cases and failure paths

| Condition                                           | Required observable outcome                    | Invariant preserved          |
| --------------------------------------------------- | ---------------------------------------------- | ---------------------------- |
| Inactive course/lecturer or non-current assignment  | Related slot and option are absent             | Active/current predicate     |
| No represented available slots                      | Empty option lists, no count or absence reason | Minimal disclosure           |
| Student attempts direct table access                | Database refuses and returns no protected rows | Projection boundary          |
| Stored display text contains markup or instructions | Returned only as bounded text                  | No execution or model use    |
| Database unavailable                                | Generic typed failure, no partial data         | No infrastructure disclosure |

## Acceptance criteria and verification

These planned checks are not results. Automated test names reference the exact retained IDs.

- **SH-02-AC1** (`SH-02-R1`; pgTAP): active represented courses appear; inactive courses do not.
- **SH-02-AC4** (`SH-02-R3`; pgTAP): creation/reactivation with inactive or non-Lecturer endpoints and a
  duplicate stored current pair are refused; after a valid pair exists, endpoint deactivation or role
  loss makes it browse-ineligible without mutating or deleting the assignment record.
- **SH-02-AC5** (`SH-02-R4`; pgTAP): after a pairing is non-current, its future unbooked slot is absent
  from Student browse while stored records remain.
- **SH-02-AC7** (`SH-02-R5`; pgTAP): active Students without enrolment records have identical course
  eligibility subject only to availability filters.
- **SH-02-AC8** (`SH-02-R6`; pgTAP/contract): mixed availability returns only qualifying option fields
  in the specified deterministic order; more than 200 represented entries returns exactly 200 of each
  type without counts, a truncation/existence indicator, or a changed slot projection.
- **SH-02-AC12** (`SH-02-R9`; pgTAP): Students cannot directly read/mutate course or assignment tables
  or read another user's profile row, while own-profile access and the protected narrow browse function
  remain callable.
- **SH-02-AC13** (`SH-02-R9`; pgTAP metadata inspection): the function checks active Student role and
  uses fixed safe `search_path`, qualified objects, and intended grants.
- **SH-02-AC14** (`SH-02-R10`; unit/integration): unavailable/nonexistent IDs are indistinguishable and
  dependency failures expose no raw infrastructure detail.
- **SH-02-AC15** (`SH-02-R10`; unit): captured failure logs contain bounded metadata/correlation ID and
  exclude display text, raw input, SQL, and database messages.
- **SH-02-AC16** (`SH-02-R11`; unit plus pgTAP before/after): browsing/filter options cause no model call
  or AI-usage mutation.
- **SH-02-AC17** (`SH-02-R12`; database plan/manual inspection): query plans and index metadata show
  capped set-based active/pair/availability joins rather than unbounded or row-by-row lookup, and the
  response cannot exceed 20 slots, 200 course options, and 200 Lecturer options.

## Review evidence

- Challenge record: `workflow/reviews/stu-01/2026-10-18-shared-spec-traceability-challenge.md`.
- Finding disposition: `workflow/reviews/stu-01/2026-10-18-shared-spec-traceability-disposition.md`.
- Review type: revised after independent challenge and Joseph's product decisions; exact-diff teammate
  review remains pending.
- Human input required: approve or reject the exact revised digest before tests, RLS, or implementation
  are changed.

## Open questions blocking approval

1. Does the exact revised digest faithfully encode the eight confirmed decisions without expanding the
   Student data surface?

## Change log

| Date       | Change and reason                                                       | IDs affected                                     | Evidence invalidated                     | By                     |
| ---------- | ----------------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------- | ---------------------- |
| 2026-10-17 | Initial broad course/assignment specification                           | SH-02-R1–R12, SH-02-AC1–AC17                     | None; new draft                          | requirements_architect |
| 2026-10-18 | Recorded team-reported approval                                         | Document control                                 | None at that time                        | requirements_architect |
| 2026-10-18 | Split browse read model from future management; reset status to `draft` | Retained R1/R3–R6/R9–R12 and listed retained ACs | Prior SH-02 approval and review evidence | requirements_architect |
| 2026-10-18 | Defined derived eligibility, profile boundary, and 200-option caps      | R3/R6/R9/R12; AC4/AC8/AC12/AC17                  | Prior split-draft challenge conclusions  | requirements_architect |
