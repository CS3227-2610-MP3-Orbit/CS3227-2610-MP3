---
id: SH-03
title: Slots, bookings, and availability
owner: team
status: draft
---

# SH-03: Slots, bookings, and availability

## Document control

- Spec owner: shared/team; changes require independent review under `.github/CODEOWNERS`.
- Reviewed repository baseline: `9dae2a00342f159c4211c056ab297fae715451fb`.
- Source feature spec: `workflow/specs/student/STU-01-browse-available-slots.md`, content digest
  `13fb2e0693210f4a97e75b395b167d2cf3f3d4f8` (`draft`, not approved).
- Prior approved commit or digest invalidated by this revision: none; this is a new draft.
- Parent/shared requirements: `PRD-01`, `SHR-01`, `TEC-01`, `INT-01`, `SH-01`, and `SH-02`; none is
  an approved implementation authority at this draft's creation.
- Related plan and latest handoff: `workflow/specs/PLAN.md` task P2; this draft's handoff is
  `workflow/handoffs/2026-10-17-sh-02-sh-03-requirements-architect.md`.
- Confirmed requirements: user-provided booking rules and the accepted decisions recorded below.
- Proposed assumptions requiring review: logical table shapes, opaque signed/versioned cursor approach,
  slot edit/delete behavior from umbrella drafts, and typed response envelopes.
- Unresolved decisions: slot duration/horizon; string bounds; retention; booked-consultation handling
  after assignment/account removal; cancellation cutoff beyond “before start”; and exact rate limits.

No source specification is approved. This specification remains `draft`; accepting selected decisions
does not approve this complete contract.

## Product and feature description

This shared contract defines consultation slots, booking state/integrity rules, availability, and the
read-only database boundary used by Students to browse slots. It is shared by Student request/manage,
Lecturer availability/decision, and Administrator reporting features.

## Confirmed, proposed, and unresolved inputs

### Confirmed

- Store timestamps as PostgreSQL `timestamptz` in UTC. Display and calendar filtering use
  `Asia/Singapore`; a selected date matches the slot's start time in that calendar day.
- A Student-visible slot starts strictly after server/database time, belongs to an active course and
  active lecturer with a current assignment, and is not reserved by a pending/approved booking.
- Pending and approved bookings reserve a slot. Rejected/cancelled bookings release a still-future slot.
  Completed bookings never release their historical slot, and completion is allowed only at/after end.
- Availability is permitted disclosure. The reason for unavailability and booking identity, content,
  exact status, and history are prohibited disclosures.
- Assignment removal blocks new slots and hides future unbooked slots while preserving records and
  existing pending/approved bookings.
- A lecturer cannot create overlapping slots. A Student cannot hold overlapping active bookings. Only
  one active booking may reserve a slot, including under simultaneous requests.
- Student browsing uses an active-Student-only fixed-`search_path` function/RPC and safe projection;
  direct underlying table reads and ordinary use of a service/admin client are prohibited.
- Pages contain 20 rows in `(starts_at, slot_id)` keyset order. Each page is a point-in-time read, not a
  frozen snapshot. Cursors are bound to the exact filter set and support safe restart if stale/invalid.
- Cursor length is at most 512 characters; total encoded query/filter input is at most 2,048 characters.
  Repeated scalar/array/unknown fields and impossible dates are rejected.
- No AI participates in deterministic slot, booking, availability, or browse operations.

### Proposed

- Logical entities are named `consultation_slots` and `bookings`, and the Student database function is
  named `browse_available_slots`.
- A cursor is opaque, integrity-protected/versioned, and contains only ordering/filter-binding data.
- A Lecturer may edit/delete an unbooked slot but not one with a pending, approved, or completed booking.
- Typed results follow `success`, `validation_error`, `forbidden_or_not_found`, `conflict`, and
  `temporarily_unavailable` categories.

### Unresolved

- Minimum/maximum slot duration and how far in advance slots may be created.
- Topic, questions, and rejection-reason bounds and whether questions are one text value or structured.
- Whether cancellation has a notice period stricter than “strictly before start.”
- Retention/deletion periods for terminal bookings and past slots.
- Operational handling of pending/approved bookings after assignment removal, course deactivation, or
  lecturer deactivation.
- Exact rate limits/capacity and whether cursors expire by time as well as becoming stale by data state.

## Scope, non-goals, and dependencies

### In scope

- Slot identity, ownership, course relationship, times, overlap, and lifecycle constraints.
- Booking identity, ownership, statuses, transitions, reservation semantics, and concurrency.
- Shared definition of Student-visible availability.
- Student browse filter, cursor, safe projection, permission, disclosure, and error contracts.
- Cross-role database boundaries relevant to these entities.

### Non-goals

- Role-specific page layout, request forms, dashboards, or detailed mutation APIs.
- Resolving/reassigning bookings after a lecturer/course/assignment becomes inactive.
- Notifications, recurring/group slots, waitlists, calendars, video calls, attendance, or location.
- Student enrolment restrictions.
- AI ranking, natural-language filtering, booking decisions, or automatic state changes.

### Dependencies

- `SH-01` supplies active authenticated profiles and trusted roles.
- `SH-02` supplies active courses and current lecturer-course assignments.
- `STU-01` owns Student browse UI behavior and must be revised to reference this contract.
- Later Student/Lecturer/Admin specs own mutation workflows and must not weaken these shared invariants.

## Observed implementation at the reviewed baseline

This is current-state evidence, not a confirmed business rule. The initial migration contains only the
profile/role and AI-usage foundation; there is no slot table, booking table, availability function,
cursor implementation, booking state machine, or related RLS/concurrency constraint. The Student page is
a placeholder, and existing tests cover foundation authentication/RLS rather than this contract. All
behavior in this specification is planned.

## Users, roles, and permissions

| Actor                       | Allowed actions/data                                                                      | Refused actions/data                                                                         |
| --------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Signed-out or inactive user | None                                                                                      | All browse, slot, and booking access                                                         |
| Active Student              | Safe available-slot projection; later own-booking operations under approved role specs    | Direct slot/booking tables; others' booking data; lecturer/admin mutations                   |
| Active Lecturer             | Later manage own eligible slots and own-slot bookings under approved role specs           | Other lecturers' slots/bookings; arbitrary Student browse function use; cross-owner mutation |
| Active Administrator        | Later approved aggregate/report operations; no default need for private consultation text | Ordinary access to private booking descriptions unless separately justified and approved     |
| Server service/admin client | Only a documented server operation after explicit authorization                           | Ordinary Student browsing or unguarded general table access                                  |

## Functional requirements

### SH-03-R1 — Authoritative time and serialization

- Classification: `confirmed`.
- Source: accepted user decision.

Persist slot and booking timestamps as `timestamptz` values representing UTC instants. Database/server
time, never a client clock, decides future/past status and transition eligibility. Human display and
calendar-date bounds use `Asia/Singapore`. A date filter selects `starts_at` within that Singapore date's
inclusive start and exclusive next-day start, converted to UTC for querying.

### SH-03-R2 — Slot integrity

- Classification: `confirmed` for valid/future/non-overlap rules; `unresolved` for duration/horizon.
- Source: user-provided booking rules and accepted decisions.

A slot has an opaque ID, owning lecturer profile, course, `starts_at`, `ends_at`, and audit timestamps.
On creation, the lecturer and course must be active and currently assigned, `starts_at` must be strictly
future by database time, and `ends_at` must be strictly after `starts_at`. Slots owned by the same
lecturer must not overlap, including under concurrent writes. Exact duration and advance horizon remain
unresolved.

### SH-03-R3 — Booking identity and ownership

- Classification: `confirmed`.
- Source: user-provided main workflow and security requirements.

A booking has an opaque ID, one slot, the authenticated Student owner derived from trusted identity,
status, consultation topic/questions, optional rejection reason where allowed, and audit timestamps. No
client-supplied Student, Lecturer, or role field determines ownership or permission. Each new request
creates a new booking; rejected/cancelled history is not overwritten when a slot is requested again.

### SH-03-R4 — Booking statuses and transition protocol

- Classification: `confirmed` except where field bounds remain unresolved.
- Source: user-provided main workflow and accepted completed-booking decision.

The only statuses are `pending`, `approved`, `rejected`, `cancelled`, and `completed`. Allowed transitions
are:

```text
available slot -> pending
pending        -> approved | rejected | cancelled
approved       -> completed | cancelled
rejected       -> terminal
cancelled      -> terminal
completed      -> terminal
```

Approval/rejection is performed only by the lecturer owning the slot. Rejection requires a bounded
non-blank reason. Cancellation is performed only by the booking's Student and succeeds only strictly
before slot start unless a later approved spec establishes a stricter notice period. Completion is
performed only by the slot's Lecturer, from `approved`, at or after `ends_at`. Every transition is an
atomic conditional update on authorized owner and expected current state; stale operations conflict.

### SH-03-R5 — Reservation and historical-slot semantics

- Classification: `confirmed`.
- Source: accepted user decision.

`pending` and `approved` reserve a slot. `rejected` and `cancelled` release it only while the slot is
still future and all other availability conditions hold. A `completed` booking permanently marks that
slot historical/non-reusable even though it is not active. Completion before `ends_at` is forbidden; if
impossible/legacy data contains a completed future booking, Student browsing must fail closed for that
slot and not return it.

### SH-03-R6 — Shared available-slot predicate

- Classification: `confirmed`.
- Source: accepted user decision and STU-01 challenge findings 3–5 disposition.

At a single query's database-time point, a Student-visible available slot must satisfy all conditions:

1. `starts_at` is strictly after database time;
2. `ends_at` is after `starts_at`;
3. the course is active;
4. the lecturer profile is active and has trusted `lecturer` role;
5. the lecturer-course assignment is current;
6. no booking for the slot is `pending` or `approved`; and
7. no booking for the slot is `completed`.

The query may disclose availability and safe public fields but must not disclose which failed condition
made another slot unavailable.

### SH-03-R7 — Assignment/account lifecycle effects

- Classification: `confirmed` for browse/new-slot effects and preservation; `unresolved` for booked-case
  resolution.
- Source: accepted user decision.

Assignment removal, course deactivation, lecturer deactivation, or loss of lecturer role prevents new
slots and hides future unbooked slots. It preserves existing records and does not automatically transition
pending/approved bookings. The later operational workflow for affected booked consultations must be
approved before those mutations are implemented.

### SH-03-R8 — One reservation per slot and Student conflict prevention

- Classification: `confirmed`.
- Source: user-provided conflict-prevention rules.

Database-level concurrency controls ensure at most one `pending` or `approved` booking reserves a slot.
Database-level controls also refuse overlapping active bookings for the same Student, using slot time
ranges. Simultaneous requests that conflict yield one committed winner and typed conflict outcomes for
losers; they never create two successful active reservations.

### SH-03-R9 — Proposed slot editing/deletion constraints

- Classification: `proposed`.
- Source: `PRD-01` and `TEC-01` drafts.

Only the owning active Lecturer may edit or delete a slot, and only while no `pending`, `approved`, or
`completed` booking exists. An edit must revalidate future time, course assignment, and overlap. Terminal
rejected/cancelled history is preserved even if the slot is not reused. Whether deletion becomes archival
after any booking history exists must be resolved with retention rules.

### SH-03-R10 — Student browse filter contract

- Classification: `confirmed`.
- Source: accepted user decision.

The browse boundary accepts at most one optional canonical lecturer UUID, one optional canonical course
UUID, one optional strict calendar date (`YYYY-MM-DD`, including real calendar validation), and one
optional opaque cursor. Lecturer, course, and date filters combine with AND semantics. Date matching uses
`SH-03-R1`. Unknown keys, repeated scalar keys, arrays, impossible dates, invalid UUIDs, cursor values
over 512 characters, and total encoded query/filter input over 2,048 characters are rejected before the
slot query. Callers cannot select fields, limits, sort order, user identity, role, or availability rules.

### SH-03-R11 — Student browse projection and database authorization

- Classification: `confirmed`.
- Source: accepted user decision and STU-01 challenge finding 2 disposition.

Students browse only through a narrow security-definer database function/RPC. It explicitly checks that
the database caller maps to an active Student, has fixed empty or explicit safe `search_path`, schema-
qualifies objects, is executable only by the intended authenticated role, and performs no mutation.
Normal Student credentials have no direct `SELECT`/mutation access to underlying slot, booking, course,
assignment, or unrelated profile rows. Ordinary browsing must not use a service/admin client.

Each result contains only opaque slot ID, course ID/code/name, lecturer ID/display name, `starts_at`, and
`ends_at`. It contains no booking ID, Student identity, booking content, exact status/history,
unavailability reason, contact data, audit/internal fields, or counts.

### SH-03-R12 — Pagination and cursor behavior

- Classification: `confirmed`.
- Source: accepted user decision and STU-01 challenge findings 6–7 disposition.

Each page returns at most 20 rows ordered ascending by `(starts_at, slot_id)`. A continuation cursor is
opaque, integrity protected, versioned, bound to the exact normalized lecturer/course/date filters and
ordering, and contains no authorization grant or private data. Changing filters starts at page one.
Pages are independent point-in-time reads: concurrent inserts, reservations, cancellation, assignment
changes, or time passage may cause omissions, and no frozen-snapshot completeness guarantee is made.
Rows must not duplicate solely because equal start times cross a page boundary.

An altered, wrong-filter, unsupported-version, malformed, or stale cursor returns a safe validation/
restart outcome and no partial result. The role UI offers restart from page one; a later booking mutation
must always recheck availability.

### SH-03-R13 — Authorization and transport-specific failures

- Classification: `confirmed`.
- Source: accepted user decision.

A signed-out Student page visit redirects to `/login`; a signed-in wrong-role page visit redirects to
that role's own dashboard. Direct database/server boundary calls by signed-out, inactive, or wrong-role
actors return typed `forbidden_or_not_found` and no data. Inaccessible and nonexistent identifiers do not
produce distinguishable payloads. Authorization occurs before any service/admin client or protected data
query.

### SH-03-R14 — Dependency failure and safe logging

- Classification: `confirmed`.
- Source: accepted user decision and STU-01 challenge finding 12 disposition.

On browse database failure, return a generic `temporarily_unavailable` result with correlation ID,
preserve validated filter selections at the UI boundary, clear potentially stale result rows, and let
retry issue the same validated filters from page one or the still-valid requested page as specified by
the role UI. Return no partial protected rows, raw error, stack, SQL, schema, or infrastructure detail.
Logs contain only bounded operation/failure category, correlation ID, and safe timing metadata—not raw
filter/cursor values, display text, booking content, credentials, or database messages.

### SH-03-R15 — Accessibility and browser contract for browse consumers

- Classification: `confirmed`.
- Source: accepted user decision.

Role UIs consuming this browse contract target WCAG 2.1 AA, full keyboard operation, visible focus,
programmatic filter labels, and programmatically exposed text status for loading, validation, empty,
error, and pagination changes. They remain usable at 320 CSS pixels and 200% zoom in current major Chrome,
Firefox, Safari, and Edge. Chromium automation covers deterministic paths; keyboard, responsive/zoom,
and cross-browser behavior require manual verification unless additional browser automation is added.

### SH-03-R16 — No-AI boundary

- Classification: `confirmed`.
- Source: accepted user decision.

Slot, booking, availability, filtering, pagination, authorization, and state transitions are
deterministic. They must not call an LLM, treat model output as authority, write AI usage, or send any
slot, course, lecturer, booking, filter, cursor, or session data to a model.

## Non-functional requirements

### SH-03-R17 — Bounded operation and reliability

- Classification: `confirmed` for fixed browse bounds; `proposed` for indexing approach; exact rate/
  latency targets are `unresolved`.
- Source: accepted user decision and `SHR-01` draft.

Browse performs one bounded 20-row page query plus bounded option retrieval and must be indexed for the
availability predicate, time/order, active booking lookup, assignment join, and role filters. Inputs are
limited by `SH-03-R10`. Rapid cursor walking cannot enlarge an individual response or expose additional
fields; exact per-user request limits and measurable latency/capacity thresholds require human approval.

## UI description

Shared UI requirements are limited to `SH-03-R13`–`R15`. `STU-01` owns `/student/slots`, filters,
explicit “Load more,” loading/empty/error states, focus behavior, and retry presentation. Lecturer and
Administrator specs own their interfaces. This shared contract does not prescribe visual layout.

## Use cases

### UC1 — Student browses an available page

- Actors: active Student.
- Preconditions: authenticated active Student; valid filters.
- Trigger: initial browse or explicit “Load more.”
- Main flow: authorize in the database boundary, validate filters/cursor, compute database time and
  Singapore date bounds, apply the availability predicate, return at most 20 safe rows and a bound cursor.
- Alternative and failure flows: empty result, invalid/stale cursor restart, authorization refusal, or
  generic dependency failure.
- Postconditions and invariants: no data mutation; safe projection only; result is point-in-time.

### UC2 — Two Students request one slot concurrently

- Actors: two active Students.
- Preconditions: the slot is available to both before either transaction commits.
- Trigger: simultaneous booking requests in the later Student booking feature.
- Main flow: database concurrency control commits exactly one `pending` booking.
- Alternative flow: the loser receives a typed conflict and current availability is rechecked.
- Postconditions and invariants: at most one active reservation; no partial or duplicate success.

### UC3 — Lecturer completes a consultation

- Actors: active Lecturer owning the slot.
- Preconditions: booking is `approved`; database time is at/after `ends_at`.
- Trigger: completion action in the later Lecturer feature.
- Main flow: conditional transition changes `approved` to `completed`.
- Alternative flows: early, stale, wrong-owner, or wrong-state request is refused/conflicts.
- Postconditions and invariants: completed is terminal and its slot can never be reused.

## Technical constraints and proposals

- Fixed constraints: PostgreSQL/Supabase, append-only migrations, database-level concurrency/RLS,
  server-derived identity/time, UTC instants, Singapore presentation/date semantics, and no direct
  Student table access.
- Proposed entities/functions: `consultation_slots`, `bookings`, and `browse_available_slots`.
- Proposed cursor implementation: authenticated/versioned opaque encoding of normalized filter digest,
  last `starts_at`, and last slot ID. It must not be an authorization token.
- The existing `workflow/specs/PLAN.md` P2 remains the plan. Detailed migration/API tasks must wait for
  approval and a bounded implementation plan.

## Data model and integrity rules

| Logical entity    | Required information                                                                   | Required invariants                                                                                              | Classification/source                 |
| ----------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Consultation slot | Opaque ID, lecturer ID, course ID, start/end instants, audit times                     | Valid range, future on creation, current assignment, no lecturer overlap                                         | Confirmed behavior; proposed shape    |
| Booking           | Opaque ID, slot ID, Student ID, topic/questions, status, rejection reason, audit times | Valid status/transition; one active reservation per slot; no Student active overlap; immutable history semantics | Confirmed behavior; bounds unresolved |

Database constraints or equivalent transactional database mechanisms—not browser/application prechecks
alone—must protect concurrent invariants. Foreign keys prevent orphans. New schema uses an append-only
migration; no existing migration is edited. Retention and physical deletion remain unresolved.

## API and boundary contracts

Proposed logical browse contract:

```ts
type BrowseAvailableSlotsInput = {
  lecturerId?: string;
  courseId?: string;
  date?: string; // strict YYYY-MM-DD in Asia/Singapore
  cursor?: string; // opaque, <= 512 characters
};

type AvailableSlot = {
  slotId: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  lecturerId: string;
  lecturerDisplayName: string;
  startsAt: string; // ISO 8601 instant
  endsAt: string; // ISO 8601 instant
};

type BrowseAvailableSlotsResult =
  | { ok: true; slots: AvailableSlot[]; nextCursor: string | null }
  | {
      ok: false;
      reason: "validation_error" | "forbidden_or_not_found" | "temporarily_unavailable";
      restartFromFirstPage?: boolean;
      correlationId?: string;
    };
```

No public third-party API is introduced. Mutation contracts are logical invariants here; later role specs
must define exact validated inputs, idempotency expectations, and UI outcomes without changing this state
machine.

## Security requirements

- Entry points: role layouts/server operations call `requireRole`; database functions and table
  grants/RLS independently authorize access.
- Authorization order: authenticate, resolve active trusted role/owner, validate bounded input,
  authorize, then query/mutate conditionally. Service/admin clients are not ordinary browse tools.
- Trusted values: authenticated profile ID/role, database time, stored foreign keys/current state.
- Untrusted values: every client filter/cursor/identifier and all stored display/topic/question/reason
  text.
- Input/output validation: strict allowlist/bounds and exact output projection; all text rendered as text,
  never HTML.
- Disclosure: availability and safe projected fields are allowed. Unavailability reason, booking owner/
  content/exact status/history, contact details, counts, and internal fields are prohibited.
- Resource abuse: oversized/repeated inputs, cursor tampering/cross-filter replay, rapid traversal, direct
  table calls, ID/role substitution, concurrent reservations, stored script/instruction text, and
  existence enumeration.
- Sensitive actions: migrations, functions, RLS/grants, state transitions, and retention changes require
  approved specs and independent human review.
- Failure/logging: typed safe outcomes and bounded metadata only under `SH-03-R14`.

## AI behavior

No AI is used. There are no permitted model inputs, capabilities, or side effects for this shared
contract. The LLM provider being unavailable must not affect any slot, booking, or browse operation.

## Edge cases and failure paths

| Condition                                                       | Required observable outcome                                | Invariant preserved              |
| --------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------- |
| Slot start equals database time                                 | Not available; new booking refused                         | Strictly future rule             |
| Singapore date spans a UTC-date boundary                        | Start instant is matched using Singapore day bounds        | Authoritative date semantics     |
| Equal-start slots cross a page                                  | Slot-ID tie-break yields no duplicate solely from ordering | Deterministic keyset order       |
| Slot changes between pages                                      | Later page reflects current state; no snapshot guarantee   | Point-in-time truth              |
| Cursor is changed/replayed with different filters/stale         | Validation/restart outcome; no partial data                | Cursor binding and disclosure    |
| Rejected/cancelled history only, future slot otherwise eligible | Slot may become available again via a new booking          | History preserved                |
| Completed booking on any slot, including corrupt future state   | Slot never returned/reused                                 | Completed historical finality    |
| Concurrent same-slot requests                                   | One success; others conflict                               | One active reservation           |
| Concurrent overlapping Student requests                         | At most one conflicting active interval commits            | No Student active overlap        |
| Assignment/course/lecturer becomes inactive                     | Future unbooked slot hidden; booked record preserved       | No implicit transition/data loss |
| Stored text contains HTML/script/instructions                   | Safe plain-text output only; no execution/model use        | Untrusted-data boundary          |
| Database fails after filters applied                            | Filters retained, stale rows cleared, safe retry/failure   | No stale/partial disclosure      |

## Acceptance criteria and verification

These are planned checks, not results. Automated test names must reference the exact AC ID.

- **SH-03-AC1** (`SH-03-R1`; unit plus pgTAP integration; deterministic mock/local database): Given
  instants around a Singapore day boundary, when date filtering runs, then exactly starts within that
  inclusive/exclusive Singapore day are eligible.
- **SH-03-AC2** (`SH-03-R1`; integration; deterministic local database): Given a manipulated browser
  clock, when future/transition rules run, then database/server time alone controls outcomes.
- **SH-03-AC3** (`SH-03-R2`; pgTAP integration; deterministic local database): Given invalid ranges,
  past/equal starts, invalid assignment endpoints, and a valid slot, when created, then only the valid
  slot succeeds.
- **SH-03-AC4** (`SH-03-R2`; pgTAP concurrency integration; deterministic local database): Given
  overlapping/non-overlapping slots including concurrent writes, when committed for one lecturer, then
  overlaps are refused and non-overlaps succeed.
- **SH-03-AC5** (`SH-03-R3`; integration; deterministic local database): Given a Student submits another
  owner ID, when requesting later, then trusted identity owns the booking and client ownership cannot
  expand access.
- **SH-03-AC6** (`SH-03-R4`; pgTAP state-table integration; deterministic local database): Given each
  status, actor, and expected current state, when transitions are attempted, then only the documented
  actor/state transitions succeed.
- **SH-03-AC7** (`SH-03-R4`; unit plus pgTAP integration; deterministic mock/local database): Given blank
  rejection and early completion, when attempted, then both are refused without changing status.
- **SH-03-AC8** (`SH-03-R5`; pgTAP integration; deterministic local database): Given rejected/cancelled
  history on a future otherwise-eligible slot, when browsed/rebooked, then it is eligible and a new record
  preserves history.
- **SH-03-AC9** (`SH-03-R5`; pgTAP security/integrity; deterministic local database): Given completed
  history, including an impossible future-state fixture, when browsed/rebooked, then the slot is never
  returned or reserved.
- **SH-03-AC10** (`SH-03-R6`; pgTAP integration; deterministic local database): Given fixtures each
  failing one availability condition, when browsed, then none appears; a fixture satisfying all
  conditions appears.
- **SH-03-AC11** (`SH-03-R6`; integration/security contract; deterministic local database): Given an
  unavailable identifier, when filters/browse respond, then no reason, booking identity/content/status/
  history, or distinct existence detail is returned.
- **SH-03-AC12** (`SH-03-R7`; pgTAP integration; deterministic local database): Given an assignment,
  account, or course lifecycle change, when applied, then new/unbooked visibility is removed while
  pending/approved records remain unchanged.
- **SH-03-AC13** (`SH-03-R8`; database concurrency integration; deterministic local database): Given
  simultaneous same-slot requests, when both finish, then exactly one active booking commits and each
  loser gets conflict.
- **SH-03-AC14** (`SH-03-R8`; database concurrency integration; deterministic local database): Given
  simultaneous overlapping Student requests on different slots, when both commit, then at most one
  overlapping active booking succeeds.
- **SH-03-AC15** (`SH-03-R9`; pgTAP integration; deterministic local database): Given wrong-owner,
  active-booked, completed, stale, overlapping, and valid unbooked slot edits/deletes, then only the valid
  owning-Lecturer operation succeeds.
- **SH-03-AC16** (`SH-03-R10`; unit plus query-spy integration; deterministic mock): Given each malformed
  UUID/date/cursor, repeated/array/unknown key, >512 cursor, or >2,048 query, when parsed, then validation
  fails before the slot query.
- **SH-03-AC17** (`SH-03-R10`; integration; deterministic local database): Given lecturer, course, and
  date filters alone and combined, when browsed, then every result satisfies all supplied filters and
  omitted filters do not narrow results.
- **SH-03-AC18** (`SH-03-R11`; pgTAP projection/before-after; deterministic local database): Given an
  active Student calls the browse function, then only the allowlisted fields appear and no row is mutated.
- **SH-03-AC19** (`SH-03-R11`; pgTAP security integration; deterministic local database): Given a Student
  directly accesses underlying tables or requests extra columns, then database access is refused; wrong
  roles cannot call the function.
- **SH-03-AC20** (`SH-03-R11`; pgTAP schema/security inspection; deterministic local database): Given
  function metadata inspection, then active-Student authorization and fixed safe `search_path`/object
  qualification are present.
- **SH-03-AC21** (`SH-03-R12`; integration; deterministic local database): Given more than 20 equal and
  different-start slots, when static pages are traversed, then pages contain no more than 20 rows in
  `(starts_at, slot_id)` order without duplicate IDs.
- **SH-03-AC22** (`SH-03-R12`; unit/integration; deterministic mock/local database): Given a cursor is
  altered, unsupported, used with changed filters, or made stale, then no partial rows return and
  restart-from-first-page is offered.
- **SH-03-AC23** (`SH-03-R12`; integration; deterministic controlled local database): Given availability
  changes between pages, then each response reflects its own query time without claiming snapshot
  completeness.
- **SH-03-AC24** (`SH-03-R13`; Playwright e2e; deterministic local app/database): Given signed-out and
  wrong-role page visits, then they redirect respectively to `/login` and their own dashboard without
  slot data.
- **SH-03-AC25** (`SH-03-R13`; unit plus pgTAP integration; deterministic mock/local database): Given
  signed-out, inactive, or wrong-role direct boundary calls, then typed `forbidden_or_not_found` returns
  with no data/mutation.
- **SH-03-AC26** (`SH-03-R14`; unit plus Playwright e2e; deterministic injected failure): Given a browse
  database failure, then results are cleared, validated filters retained, retry is safe, and no partial or
  raw infrastructure detail appears.
- **SH-03-AC27** (`SH-03-R14`; unit; deterministic mock): Given failure logs are captured, then they
  contain bounded metadata/correlation ID and exclude raw filters, cursors, text, booking content, and
  database errors.
- **SH-03-AC28** (`SH-03-R15`; Chromium e2e plus manual accessibility/cross-browser review;
  deterministic local app plus N/A manual): Given keyboard use, loading/error/empty/load-more changes,
  320px width, and 200% zoom, then controls, focus, labels, and text status remain operable and perceivable.
- **SH-03-AC29** (`SH-03-R16`; unit plus pgTAP before/after; deterministic mock/local database): Given
  browse and state operations, then no model/provider call, prompt, or `ai_usage` mutation occurs and
  provider outage changes no outcome.
- **SH-03-AC30** (`SH-03-R17`; unit/integration; deterministic mock/local database): Given rapid or
  oversized traversal attempts, then every accepted response stays within 20 rows/safe fields and
  rejected inputs run no slot query.

## Review evidence

- Challenge record: required after this draft; none yet.
- Review type: no independent review completed.
- Open findings and disposition: accepted user decisions address the five high STU-01 challenge findings
  and pagination/input/failure/accessibility findings at the shared-contract level; exact role UI and
  revised STU-01 traceability remain outstanding.
- Human input required: decide the open matters below and independently review the eventual digest.

## Open questions blocking approval

1. What minimum/maximum slot duration and maximum advance-booking horizon apply?
2. What exact topic, questions, and rejection-reason bounds and representation apply?
3. Is Student cancellation allowed until the exact start instant, or is a stricter notice period required?
4. What retention/archive/deletion rules apply to past slots and terminal bookings?
5. What authorized workflow handles pending/approved bookings after assignment removal, course
   deactivation, or lecturer deactivation? This draft intentionally performs no automatic transition.
6. May a slot with only rejected/cancelled history be physically deleted, or must all such slots be
   archived permanently?
7. What per-user/global non-AI browse rate limits, target catalogue capacity, and measurable latency
   thresholds apply?
8. Should cursors have a fixed time expiry? Filter/data mismatch already produces safe restart behavior,
   but no expiry interval is approved.

## Change log

| Date       | Change and reason                                                    | IDs affected                 | Evidence invalidated | By                     |
| ---------- | -------------------------------------------------------------------- | ---------------------------- | -------------------- | ---------------------- |
| 2026-10-17 | Initial draft recording accepted slot/booking/availability decisions | SH-03-R1–R17, SH-03-AC1–AC30 | None; new draft      | requirements_architect |
