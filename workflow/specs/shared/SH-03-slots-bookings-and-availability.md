---
id: SH-03
title: Student available-slot read model and browse boundary
owner: team
status: draft
---

# SH-03: Student available-slot read model and browse boundary

## Document control

- Four browse clarifications, source digests, self-review, and follow-up plan:
  `workflow/reviews/stu-01/browse-clarifications.md`; confirmed by Joseph on 2026-10-18.

- Spec owner: shared/team; changes require independent review under `.github/CODEOWNERS`.
- Reviewed repository baseline: `e5893b28a6d898bdfb698dcb7f48e293ab373e7b` plus the uncommitted
  STU-01 implementation identified in `workflow/handoffs/archive/stu-01/2026-10-18-stu-01-coordinator.md`.
- Prior team-reported approved behavior digest invalidated by this revision:
  `3bc3f5cd29ea26040e8cedd71df71fa1f68d51c8`; prior canonical metadata digest:
  `2f704fe55f177fe8d9a8320dc5c5ea71c91e1680`.
- Change-impact record: `workflow/reviews/stu-01/2026-10-18-shared-spec-traceability-impact.md`.
- Parent/shared requirements: `SH-01`, revised draft `SH-02`, and `STU-01`.
- Related future scope: draft `SH-05` owns slot and booking mutations, transitions, and concurrency.
- Confirmed requirements: previously approved time, availability, Student browse, disclosure, failure,
  accessibility, bounded-operation, and no-AI behavior retained below.
- Confirmed revision decisions: course/Lecturer IDs are permitted in the exact slot allowlist; Student
  staff discovery uses narrow RPC projections; the exact UTC slot wire shape and 200-per-type option
  caps are normative.
- Proposed assumptions requiring review: exact physical entity/function names and cursor encoding.
- Unresolved operational decisions: rate/latency targets; they do not authorize broader inputs or
  results. Cursor time expiry is resolved: no time-based expiry under `SH-03-R12`.

This material revision preserves the approved Student browse/read behavior while moving future slot and
booking mutations to `SH-05`. The status is reset to `draft`; prior approval and review evidence are
stale until a teammate reviews the exact revised digest.

## Product and feature description

This contract defines the point-in-time Student-visible availability predicate and the read-only,
bounded, protected database boundary used by `STU-01`. It defines how stored booking states affect
visibility, but not how those states are created or changed.

## Scope, non-goals, and dependencies

### In scope

- Authoritative time and the minimum stored slot facts consumed by browse.
- Read-side interpretation of booking status and lifecycle state.
- Available-slot predicate, filters, projection, pagination, failures, accessibility, and no-AI rules.
- Student authorization, direct-table denial, disclosure, and resource bounds.

### Non-goals

- Slot creation, overlap prevention, editing, deletion, archival, or Lecturer mutation APIs.
- Booking requests, ownership mutation, approval/rejection/cancellation/completion transitions, and
  reservation concurrency.
- Operational handling of booked consultations after course/assignment/account deactivation.

Those behaviors moved to draft `SH-05` without changing their prior intent.

### Dependencies

- `SH-01` supplies authenticated active profiles and trusted roles.
- `SH-02` supplies active-course and current-assignment read facts.
- `STU-01` owns Student page behavior and UI states.

## Observed implementation

Current-state evidence, not authority: the uncommitted STU-01 migration defines slot/booking tables and
`browse_available_slots`; server validation and UI consume it. Existing tests reference retained
`SH-03-AC10`, AC16–AC22, AC24–AC27, AC29, and AC30. Other retained criteria require real test additions
after renewed approval. The implementation remains incomplete under the latest coordinator handoff.

## Users, roles, and permissions

| Actor                       | Allowed actions/data                              | Refused actions/data                                                                 |
| --------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Signed-out or inactive user | None                                              | All Student browse and underlying-table access                                       |
| Active Student              | Safe available-slot and filter-option projection  | Direct feature tables, booking data, unavailability reasons, contacts, and mutations |
| Lecturer or Administrator   | Nothing through this Student-only browse boundary | Invoking the Student function based on another role's future permissions             |
| Server service/admin client | No role in ordinary Student browsing              | Unguarded protected reads or authorization bypass                                    |

## Functional requirements

### SH-03-R1 — Authoritative time and serialization

- Classification: `confirmed`.
- Source: prior team-reported approval.

Slot/booking timestamps are PostgreSQL `timestamptz` instants. Database/server time, never a browser
clock, determines future status. Display and calendar bounds use `Asia/Singapore`; a date matches
`starts_at` from the inclusive Singapore day start to the exclusive next-day start, converted to UTC.

### SH-03-R2 — Read-side slot integrity

- Classification: `confirmed` for the browse invariant.
- Source: prior team-reported approval.

A browseable slot has opaque ID, lecturer ID, course ID, `starts_at`, and `ends_at`; `ends_at` is strictly
after `starts_at`. Browse fails closed for invalid stored ranges. Slot creation-time, horizon, duration,
and lecturer-overlap rules moved to `SH-05`.

### SH-03-R5 — Read-side booking-state semantics

- Classification: `confirmed`.
- Source: prior team-reported approval.

Stored `pending` and `approved` bookings reserve a slot; stored `rejected` and `cancelled` history does
not hide a still-future otherwise-eligible slot. Any `completed` booking permanently makes its slot
unavailable, including impossible legacy future-completed data. State transitions and rebooking writes
belong to `SH-05`.

### SH-03-R6 — Shared available-slot predicate

- Classification: `confirmed`.
- Source: prior team-reported approval and STU-01 challenge disposition.

At one query's database-time point, every returned slot has a future start, valid range, active course,
active lecturer profile with trusted `lecturer` role, current lecturer-course assignment, and no
`pending`, `approved`, or `completed` booking. The response reveals no failed condition for hidden slots.

### SH-03-R7 — Lifecycle visibility effects

- Classification: `confirmed` for read behavior and preservation.
- Source: prior team-reported approval.

A non-current assignment, inactive course, inactive lecturer, or loss of lecturer role hides future
unbooked slots. Existing records and pending/approved bookings remain stored and are not automatically
transitioned by browse. Lifecycle mutation workflows remain outside this read contract.

### SH-03-R10 — Student browse input contract

- Classification: `confirmed`.
- Source: prior team-reported approval.

The boundary accepts at most one optional canonical lecturer UUID, course UUID, strict real
`YYYY-MM-DD` date, and opaque cursor. Filters combine with AND. Unknown/repeated/array fields, impossible
dates, invalid UUIDs, cursor values over 512 characters, and total encoded input over 2,048 characters
are rejected before querying. Callers cannot select fields, limits, sort, identity, role, or predicates.

### SH-03-R11 — Student projection and database authorization

- Classification: `confirmed`.
- Source: prior team-reported approval and STU-01 challenge disposition.

Students browse through a security-definer RPC that checks an active Student, fixes `search_path`,
schema-qualifies objects, is granted only to the intended database role, and performs no mutation.
Students have no direct course, assignment, slot, or booking table access, and may directly read only
their own profile row under `SH-01`. All other Lecturer/staff discovery occurs through the narrow RPC.
Browsing does not use a service/admin client.

Each slot uses exactly this wire shape and no additional field:

```ts
type AvailableSlot = {
  slotId: string; // canonical opaque UUID
  courseId: string; // canonical opaque UUID
  courseCode: string;
  courseName: string;
  lecturerId: string; // canonical opaque UUID
  lecturerName: string;
  startsAt: string; // ISO-8601 UTC instant ending in Z
  endsAt: string; // ISO-8601 UTC instant ending in Z
};
```

The timestamp strings represent the stored `timestamptz` instants normalized to UTC, never locale-
dependent display text. Course/Lecturer IDs are approved filter and future request references; they do
not authorize direct table access or disclose a profile beyond this exact projection.

The same successful response carries the `CourseFilterOption` and `LecturerFilterOption` projections
defined in `SH-02`, independently returning all eligible distinct options up to 200 each under
`SH-02-R6`. These options use all available slots before selected filters and pagination; an empty
filtered result may still return nonempty options. Options beyond a cap are omitted
without a count, truncation/existence indicator, or different error.

### SH-03-R12 — Pagination and cursor behavior

- Classification: `confirmed`.
- Source: prior team-reported approval.

Pages contain at most 20 rows in ascending `(starts_at, slot_id)` keyset order. Cursors are opaque,
integrity protected, versioned, bound to normalized filters/order, and carry no authorization grant or
private data. Pages are independent point-in-time reads, not frozen snapshots.

A cursor is stale if its version is unsupported or its anchor slot no longer exists at the encoded
`(starts_at, slot_id)` position while satisfying `SH-03-R6` and the bound filters at query time.
Examples include deletion, start-time edit, start no longer in the future, a reserving/completed
booking, endpoint deactivation, or loss of current assignment. There is no time-based token expiry:
elapsed token age alone cannot invalidate an otherwise-valid cursor. Changes to other slots alone
do not stale the cursor while its anchor remains eligible.

Altered, wrong-filter, unsupported, malformed, or stale cursors return a safe validation/restart
outcome with no partial result and no reason exposing hidden anchor state. Restart removes the cursor,
retains valid filters, and requests the first page under normal authorization and availability rules.

### SH-03-R13 — Authorization and transport failures

- Classification: `confirmed`.
- Source: prior team-reported approval.

Signed-out page visits redirect to `/login`; wrong-role visits redirect to that role's dashboard.
Signed-out, inactive, or wrong-role direct boundary calls return `forbidden_or_not_found` and no data.
Unavailable and nonexistent identifiers are indistinguishable. Authorization precedes protected data
queries or any service/admin client.

### SH-03-R14 — Dependency failure and safe logging

- Classification: `confirmed`.
- Source: prior team-reported approval.

Database failure returns `temporarily_unavailable` with correlation ID, retains validated filters,
clears stale results, and permits a safe retry. No partial row, raw error, stack, SQL, schema, credential,
or infrastructure detail is returned/logged; logs contain bounded operation/failure/timing metadata.

### SH-03-R15 — Accessibility and browser contract

- Classification: `confirmed`.
- Source: prior team-reported approval.

Browse consumers target WCAG 2.1 AA, keyboard operation, visible focus, programmatic labels, text status
for loading/validation/empty/error/pagination, 320 CSS pixels, 200% zoom, and current major Chrome,
Firefox, Safari, and Edge. Chromium automation is not evidence for the required manual/cross-browser
checks.

### SH-03-R16 — No-AI boundary

- Classification: `confirmed`.
- Source: prior team-reported approval.

Browse is deterministic and makes no model call, prompt, AI-usage write, or model-authorized decision;
no slot, course, lecturer, booking, filter, cursor, or session data goes to an LLM.

## Non-functional requirements

### SH-03-R17 — Bounded operation and reliability

- Classification: `confirmed` for fixed bounds; `proposed` for exact indexing.
- Source: prior team-reported approval.

Browse performs a bounded 20-row page query plus at most 200 course and 200 Lecturer options and uses indexes for
availability, time/order, booking lookup, assignment, and roles. Rapid traversal does not enlarge an
individual response or field set. Exact request-rate, catalogue-capacity, and latency targets remain
unresolved.

## UI description

`STU-01` owns `/student/slots`, filters, “Load more,” loading/empty/error states, focus, and retry. This
contract supplies only the shared authorization, response, and accessibility requirements.

## Use cases

### UC1 — Student browses an available page

- Actors: active Student.
- Preconditions: authenticated active Student and valid filters.
- Trigger: initial browse or “Load more.”
- Main flow: authorize, validate, compute database time/date bounds, apply availability, and return at
  most 20 safe rows plus a bound continuation cursor.
- Alternative and failure flows: empty result, safe cursor restart, authorization refusal, or generic
  dependency failure.
- Postconditions and invariants: no mutation; safe point-in-time projection only.

## Technical constraints and proposals

PostgreSQL/Supabase, append-only migrations, database RLS/concurrency, server-derived identity/time,
Singapore date semantics, and no direct Student table access are fixed. The observed
`browse_available_slots` name and cursor encoding are implementation details, not authorization to
expand the contract.

## Data model and integrity rules

| Read model        | Required browse information                           | Read invariant                                                        |
| ----------------- | ----------------------------------------------------- | --------------------------------------------------------------------- |
| Consultation slot | ID, lecturer/course IDs, start/end instants           | Future valid range and active/current endpoints                       |
| Booking marker    | Slot relation and one of the five known status values | Pending/approved/completed hide; rejected/cancelled alone do not hide |

Mutation ownership, transition, concurrency, and retention rules are in draft `SH-05`.

## API and boundary contracts

```ts
type BrowseAvailableSlotsInput = {
  lecturerId?: string;
  courseId?: string;
  date?: string;
  cursor?: string;
};

type BrowseAvailableSlotsResult =
  | {
      ok: true;
      slots: AvailableSlot[];
      courses: CourseFilterOption[];
      lecturers: LecturerFilterOption[];
      nextCursor: string | null;
    }
  | {
      ok: false;
      reason: "validation_error" | "forbidden_or_not_found" | "temporarily_unavailable";
      restartFromFirstPage?: boolean;
      correlationId?: string;
    };
```

The exact TypeScript/SQL names are proposals; the observable input, projection, authorization, and
failure constraints are normative.

## Security requirements

- Authenticate and resolve trusted active role before protected data access.
- Treat client filters/cursors and stored display text as untrusted.
- Strictly validate input and exact output projection; render text as text, never HTML.
- Permit availability and allowlisted fields only; prohibit booking owner/content/status/history,
  unavailability reason, contacts, counts, and audit fields.
- Address direct-table calls, ID/role substitution, cursor replay/tampering, oversized/repeated input,
  scraping, stored scripts/instructions, and existence enumeration.
- Require independent review for migrations, functions, RLS, grants, and projection changes.

## AI behavior

No AI is used or permitted; provider availability cannot change browse outcomes.

## Edge cases and failure paths

| Condition                                       | Required observable outcome                      | Invariant preserved         |
| ----------------------------------------------- | ------------------------------------------------ | --------------------------- |
| Slot starts at database time                    | Not returned                                     | Strict future rule          |
| Singapore date crosses a UTC boundary           | Singapore inclusive/exclusive bounds apply       | Date semantics              |
| Equal-start rows cross a page                   | Slot-ID tie-break avoids ordering duplicates     | Deterministic pagination    |
| Availability changes between pages              | Each page reflects its own query time            | No snapshot claim           |
| Cursor altered/replayed for other filters/stale | Safe validation/restart, no partial rows         | Cursor binding              |
| Rejected/cancelled history only                 | Otherwise eligible future slot may appear        | Read-side status semantics  |
| Any completed history                           | Slot does not appear                             | Historical finality         |
| Stored text contains markup/instructions        | Plain-text output only                           | No execution/model use      |
| Dependency fails after validation               | Safe error, filters retained, stale rows cleared | No stale/partial disclosure |

## Acceptance criteria and verification

These planned checks are not results. The retained IDs remain stable for unchanged read concepts.

- **SH-03-AC1** (`SH-03-R1`; unit plus pgTAP): Singapore boundary fixtures include exactly starts in the
  selected inclusive/exclusive day.
- **SH-03-AC2** (`SH-03-R1`; integration): browser-clock manipulation cannot alter database/server-time
  eligibility.
- **SH-03-AC3** (`SH-03-R2`; pgTAP): a stored slot with `ends_at <= starts_at` is excluded from the
  browse projection; slot-creation validation formerly included in this criterion moves to `SH-05-AC1`.
- **SH-03-AC8** (`SH-03-R5`; pgTAP): rejected/cancelled history alone does not hide an otherwise
  eligible future slot.
- **SH-03-AC9** (`SH-03-R5`; pgTAP): completed history, including impossible future data, always hides
  its slot.
- **SH-03-AC10** (`SH-03-R6`; pgTAP): each failed predicate fixture is absent and a fully eligible slot
  appears.
- **SH-03-AC11** (`SH-03-R6`; integration/security): unavailable results reveal no condition, booking
  data/status/history, or existence distinction.
- **SH-03-AC12** (`SH-03-R7`; pgTAP): lifecycle-state fixtures hide new/unbooked visibility while
  existing pending/approved records remain unchanged.
- **SH-03-AC16** (`SH-03-R10`; unit/query spy): malformed, repeated, array, unknown, and oversized input
  fails before a slot query.
- **SH-03-AC17** (`SH-03-R10`; pgTAP/integration): lecturer/course/date filters alone each include a
  known matching available slot and exclude an otherwise-available nonmatching slot. A combined
  filter includes the full match and excludes fixtures failing only lecturer, only course, or only
  date. Use fixtures fitting one page and assert IDs, not only `every()`/absence checks; an always-empty
  implementation must fail. Date fixtures include inclusive Singapore start and exclusive next start.
- **SH-03-AC18** (`SH-03-R11`; contract plus pgTAP): active Student browse returns exactly the eight
  allowlisted slot fields, canonical UUIDs, ISO-8601 UTC `startsAt`/`endsAt` strings ending in `Z`, and
  the safe option projections; it returns no additional field and changes no row.
- **SH-03-AC19** (`SH-03-R11`; pgTAP): direct course/assignment/slot/booking access and direct reads of
  another user's profile row are refused, own-profile access remains available, and wrong roles cannot
  call the Student function.
- **SH-03-AC20** (`SH-03-R11`; pgTAP metadata): active-Student authorization, grants, fixed safe
  `search_path`, and object qualification are present.
- **SH-03-AC21** (`SH-03-R12`; integration): over 20 equal/different-start slots traverse in bounded
  deterministic order without duplicate IDs.
- **SH-03-AC22** (`SH-03-R12`; unit/integration plus browser recovery): altered, malformed,
  changed-filter, unsupported-version, and unavailable/changed-anchor cursors return no partial rows
  and offer first-page restart retaining valid filters without exposing the anchor's hidden state.
  Exercise reservation, deletion, start-time change, elapsed slot start, endpoint deactivation, and
  assignment removal independently. Advancing time while the anchor remains eligible and the version
  supported does not reject a cursor solely for its age; unrelated-slot changes do not stale it.
- **SH-03-AC23** (`SH-03-R12`; integration): controlled between-page changes demonstrate point-in-time
  responses without a snapshot-completeness claim.
- **SH-03-AC24** (`SH-03-R13`; Playwright): signed-out and wrong-role page visits redirect without slot
  data.
- **SH-03-AC25** (`SH-03-R13`; unit plus pgTAP): signed-out, inactive, and wrong-role direct calls return
  `forbidden_or_not_found` without data or mutation.
- **SH-03-AC26** (`SH-03-R14`; unit plus Playwright): injected database failure clears rows, retains
  valid filters, offers retry, and exposes no raw detail.
- **SH-03-AC27** (`SH-03-R14`; unit): logs contain bounded metadata/correlation ID and no raw input,
  stored text, booking content, or database error.
- **SH-03-AC28** (`SH-03-R15`; Chromium plus manual/cross-browser): keyboard, states, 320px, 200% zoom,
  and supported browsers remain operable and perceivable.
- **SH-03-AC29** (`SH-03-R16`; unit plus pgTAP): browse creates no model/provider call, prompt, or
  AI-usage mutation and is unchanged by provider outage.
- **SH-03-AC30** (`SH-03-R17`; unit/integration): every accepted response stays within 20 slots, 200
  course options, 200 Lecturer options, and the safe field allowlists; represented options beyond a cap
  disclose no count/existence indicator, and rejected oversized input runs no query.

## Review evidence

- Challenge record: `workflow/reviews/stu-01/2026-10-18-shared-spec-traceability-challenge.md`.
- Finding disposition: `workflow/reviews/stu-01/2026-10-18-shared-spec-traceability-disposition.md`.
- Review type: revised after independent challenge and Joseph's product decisions; exact-diff teammate
  review remains pending.
- Human input required: approve or reject the exact revised digest before tests, RLS, or implementation
  are changed.

## Review gate

No product choice remains open for these four browse clarifications. An independent teammate must
review the exact revised digest; this draft and its self-review do not approve implementation.

## Change log

| Date       | Change and reason                                                       | IDs affected                                         | Evidence invalidated                     | By                     |
| ---------- | ----------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------- | ---------------------- |
| 2026-10-17 | Initial broad slot/booking/availability specification                   | SH-03-R1–R17, SH-03-AC1–AC30                         | None; new draft                          | requirements_architect |
| 2026-10-18 | Recorded team-reported approval                                         | Document control                                     | None at that time                        | requirements_architect |
| 2026-10-18 | Split Student read model from future mutations; reset status to `draft` | Retained R1/R2/R5–R7/R10–R17 and listed retained ACs | Prior SH-03 approval and review evidence | requirements_architect |
| 2026-10-18 | Defined exact slot wire/profile boundary and bounded option envelope    | R11/R17; AC18/AC19/AC30                              | Prior split-draft challenge conclusions  | requirements_architect |
