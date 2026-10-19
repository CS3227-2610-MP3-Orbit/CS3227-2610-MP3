---
id: STU-02
title: Request a consultation — first booking-management slice
owner: joseph
status: approved
---

# STU-02: Request a consultation

## Document control

- Task: `STU-02-SPEC`; author: assigned `requirements_architect`; date: 2026-10-18.
- Reviewed repository commit: `668e7435805b3aec1140653b8ea12d14e2380a68`.
- Source content digests (`git hash-object`): `SH-05` = `63cbe1c68109ba96657bcfab0164d1ce06c9d79f`;
  `SH-03` = `3dd4a5eb5fef2d9a295c3c7a0f83306c7c704f15`;
  `SH-02` = `f8df10a71fbbf2dfc14accd78b849dd8c69f60f8`;
  `INTEGRATION-SPEC.md` = `2899ee84eddce2a22f5f114e8dfd623dcc4b2625`.
- Sources: Joseph's requested Student workflow; `PRODUCT-SPEC.md`, `INTEGRATION-SPEC.md`, `SH-01`,
  `SH-02`, `SH-03`, and `SH-05` under `workflow/specs/`. These canonical dependencies currently say
  `draft`; Joseph subsequently reported whole-team approval of these exact dependencies in
  `workflow/handoffs/stu-02/latest.md`. Shared frontmatter is unchanged by this bounded task.
- Approval: whole team approved implementation including the proposals below, as reported by Joseph
  on 2026-10-18. Reviewed content digest: `f84c874a726d77a3060b15170bf6be1883202691`.
  This metadata synchronization changes no requirement or acceptance criterion. External reviewer
  identities/PR approval are not independently verified; merge and sensitive-change gates remain.
- Prior approved STU-02 digest invalidated: none; new specification.
- Plan: `workflow/plans/stu-02-request-consultation.md`.
- Latest handoffs: `workflow/handoffs/stu-02/latest.md`; preceding feature:
  `workflow/handoffs/stu-01/latest.md`.
- Confirmed: Student-owned requests, pending reservation, lecturer approval later, atomic reservation
  and Student overlap prevention, backend permissions, no autonomous AI mutations.
- Proposed: exact input bounds/normalization, adjacent-session semantics, retry and stale-form protocol,
  precise transport/UI contract and operational bounds below. These original proposal labels record
  provenance; Joseph's subsequent whole-team approval covers them for this slice.

## Product and feature description

An active Student selects a slot, supplies a topic and questions, and explicitly submits a request.
The successful outcome is one owned pending booking awaiting the assigned Lecturer's decision.
Submission reserves the slot; opening a form does not.

## Scope, non-goals, and dependencies

This is the first slice of the `STU-02` request/view/edit/cancel scope reserved in `PLAN.md`. It includes
the request form, atomic creation, and a minimal owned submission confirmation/recovery result. Full
My Bookings, edits, cancellation, Lecturer decisions, notifications, slot management, and `STU-03`
improve-request AI are deferred. Existing IDs are not renumbered or repurposed.

Depends on trusted sessions (`SH-01`), slot/course eligibility (`SH-02`, `SH-03`), and the creation,
reservation, history, concurrency and no-AI subset of `SH-05-R2/R4/R5/R8/R9`. Approval of this slice
does not approve unrelated cancellation, slot-deletion, lifecycle-resolution or retention decisions.
Any conflicting shared contract must be reconciled before implementation.

## Observed implementation — evidence, not requirements

`src/app/student/slots/page.tsx` renders browse results but has no request link/form. The server browse
helper and Singapore formatting already exist. `requireRole` resolves an authenticated active profile
and redirects unauthenticated/wrong-role callers. The three existing migrations provide courses,
assignments, slots, bookings, RLS and a single-active-reservation unique index. Direct authenticated
table access is revoked. They do not provide a request RPC, Student overlap enforcement, bounded
booking text or idempotency storage. The profile repair removes broad staff reads. Existing browse
unit/pgTAP/E2E tests are not evidence that requests work. No request implementation is claimed.

## Users, roles, and permissions

| Actor                    | Allowed through this feature                                                 | Refused                                                                 |
| ------------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Active Student           | Eligible slot projection, create own pending booking, recover own submission | Other students' bookings; supplied owner/role/status; approval or edits |
| Signed-out/inactive user | Login guidance only                                                          | Protected slot/request data and writes                                  |
| Lecturer/Administrator   | Own existing role workspace                                                  | Student request or recovery endpoints                                   |

The assigned Lecturer's later access to the request is governed by its own role spec; this slice adds
no Lecturer/Admin read endpoint. Student request data never appears in the public browse projection.

## Functional requirements

### STU-02-R1 — Select and review a slot

- Classification: `confirmed` for selection; `proposed` for exact UI/lookup protocol.
- Source: user workflow; `INT-01` request contract; design needed for a complete slice.

An active Student can open a request form from any eligible browse result, including later pages.
The form loads that slot directly by ID through an authorized narrow lookup, not by searching only
the first browse page. Show course code/name, Lecturer name, and start/end labelled SGT; derive course
from the slot and make it read-only. Show required topic/questions and a submit control. Opening,
refreshing, going back or abandoning the form makes no booking and reserves nothing.

### STU-02-R2 — Create one owned pending request

- Classification: `confirmed`.
- Source: user workflow; `PRD-01-AC1/AC2`; `SH-05-R2/R4/R5`.

Explicit valid submission atomically creates one new booking with trusted authenticated Student ID,
selected slot, validated text, database audit times, status `pending` and no rejection reason. Course
and Lecturer derive from the slot. No enrolment restriction is added to the catalogue-wide slice.
Success identifies the owned request and says it awaits Lecturer approval, not that it is approved.
Subsequent browse reads exclude the reserved slot. No unrelated records change.

### STU-02-R3 — Transactional eligibility and history

- Classification: `confirmed`.
- Source: user conflict rules; `SH-03-R5/R6`; `SH-05-R2/R4/R5/R8`.

The database revalidates active Student, slot valid range, strictly future start using database time,
active course, active Lecturer role/profile, current assignment, and absence of pending/approved/
completed history. Coordinate concurrent relevant writes so the decision is serialized with those
changes; a stale application precheck is insufficient. Recheck time after waiting for locks. A
rejected/cancelled booking does not block a new otherwise eligible request; preserve its row unchanged.
Completed history blocks reuse. Failed definite transactions leave no partial reservation or retry row.
Creation never transitions, edits, or deletes an existing booking. Existing pending bookings remain
stored if a later lifecycle change makes the slot unavailable; remediation is outside this slice.

### STU-02-R4 — Student conflicts

- Classification: `confirmed` for no overlapping active bookings; `proposed` for interval endpoints.
- Source: user conflict rules and `SH-05-R5`; endpoint semantics were unspecified.

Use half-open intervals `[start,end)`: adjacent sessions are allowed; strict overlaps with any owned
pending/approved booking are refused. Rejected/cancelled history does not conflict. Across simultaneous
requests by different Students for one slot exactly one commits; across one Student's simultaneous
overlapping slots at most one commits. Disjoint requests can both succeed. Database enforcement covers
every granted application write path; do not grant direct writes that bypass these invariants.

### STU-02-R5 — Text validation

- Classification: `proposed`.
- Source: user requires topic/questions; umbrella specs leave exact lengths unresolved.

Trim leading/trailing ECMAScript `String.trim()` whitespace on the server and enforce equivalent
normalized values at the database boundary. Topic is 1–200 and questions 1–2,000 Unicode code points,
not UTF-16 code units or bytes. Preserve interior whitespace and newlines; do not Unicode-normalize
or interpret markup. Reject NUL, invalid Unicode, nonstrings, repeated/array fields, missing required
fields, unknown application fields and invalid UUIDs. Database validation must also refuse out-of-bound
direct RPC values. Runtime-owned Server Action metadata is not an application field and must never
become a database argument. Validation failures identify the field without echoing private content.

### STU-02-R6 — Retry and stale-form safety

- Classification: `proposed`.
- Source: network-loss/double-click and changed-slot risks; no approved retry contract exists.

Each new submission intent uses a UUID idempotency key scoped to the authenticated Student and the
exact normalized payload, including selected slot and reviewed slot version. Concurrent or later
replays with that key/payload return the same booking identity without another insert. Different
payload with a committed key returns `idempotency_mismatch`. Check an authorized existing key before
new-request availability; otherwise a successful retry would conflict with its own reservation.
Keys are retained with booking history and never recycled. Replaying after rejection/cancellation/
completion returns the original request's current status, never recreates it. A deliberately new
request uses a new key; future eligible rebooking preserves terminal history.

The form carries a server-issued opaque version representing reviewed slot ID/course/Lecturer/times.
Compare against protected current state during creation; changed material details return
`slot_changed`, requiring explicit review of refreshed details before another intent. Never trust a
client-supplied time as authoritative. Display-name-only changes need not invalidate the version.
The user cannot silently edit a pending retry payload; resolving an uncertain request replays the exact
key/payload first. Keep the pending attempt in page memory until resolved; no private text in URLs or
persistent browser storage. Cross-reload recovery beyond this page remains a deferred UX limitation.

## Non-functional requirements and UI

### STU-02-R7 — Usable states and bounded work

- Classification: `proposed` for exact bounds; `confirmed` for labelled accessible feedback.
- Source: shared usability rules; proportional limits for this new write path.

Provide loading, unavailable-slot, field validation, submitting, confirmation, conflict and uncertain
outcome states. Disable duplicate UI submission while pending (database safety remains necessary).
Keep draft text on validation/conflict; offer return to browse. Associate labels/errors with controls,
announce status, preserve visible keyboard focus, and support 320 CSS pixels and 200% zoom.
Lookup/recovery returns at most one record. Bound decoded application input to 16 KiB UTF-8, slot
version to 512 characters, UUIDs to 36 characters, and one booking per operation. No attachments/batch
requests. Propose a 5-second database lock wait and 10-second statement timeout; timeout does not imply
rollback unless confirmed. Use index-supported identity/slot/active-booking queries. No feature-specific
rate quota or performance SLA is approved here; infrastructure abuse limits remain separate.

## Use cases

- UC1: active Student selects a slot, reviews fixed details, enters valid text and submits. The backend
  authorizes, validates and atomically reserves it. Student sees pending confirmation and fresh browse
  omits it. If eligibility changed, show a safe conflict and preserve the draft.
- UC2: two conflicting submissions overlap. Database serialization/constraints allow one winner;
  the loser sees conflict, no private competing booking and no partial data.
- UC3: response is lost after commit. Student sees “Unable to confirm the result” and retries the
  same intent; ownership-scoped lookup/replay returns the existing booking instead of duplicating it.

## Data model and technical constraints

Use existing bookings/slots/assignment/profile tables, session-aware Supabase client, server role
checks and append-only migrations. No service/admin client is necessary for this feature. New narrow
security-definer functions are a proposal: active-role checks, fixed safe `search_path`, qualified
objects and restricted grants are mandatory if used. Keep base-table access denied. Add protected
idempotency/version/integrity support without editing historical migrations. Exact locking/index/
constraint design belongs in implementation review, which must demonstrate race safety, including
slot-time changes against active reservations. No background cleanup/deletion is authorized.

## API and boundary contracts

### STU-02-R8 — Narrow internal contracts and truthful errors

- Classification: `proposed` for shapes; `confirmed` for trusted ownership and minimal disclosure.
- Source: `INT-01` logical request contract; new slice transport proposal.

Proposed page: `/student/slots/[slotId]/request`. Logical operations (internal, not public REST):

- `getRequestSlot({slotId})`: success contains the eight-field `AvailableSlot` projection from
  `SH-03-R11` plus `slotVersion`, or a safe failure. It performs no mutation.
- `requestConsultation({slotId, slotVersion, topic, questions, idempotencyKey})`: no identity,
  course override, role, status, time override, SQL or arbitrary field selector accepted.
- `recoverConsultation({idempotencyKey})`: active Student only; one owned receipt or
  `forbidden_or_not_found`. It creates nothing. Missing receipt during an in-flight attempt is not
  proof the request failed; replay the same intent to settle it.

Receipt allowlist: `{bookingId, slotId, status}` only, all IDs canonical UUIDs; creation status is
`pending`, recovery/replay may report any existing booking status. It discloses no other Student,
contact/audit data, competing booking, rejection reason or consultation text. The current form already
contains its own reviewed text/slot details. Validate database output before rendering success.

| Result                                     | Meaning and UI recovery                                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `success` + receipt                        | Confirm one creation or existing owned receipt; never claim approval unless current recovered status is approved                |
| `validation_error` + allowlisted field     | Correct malformed input; no write from this attempt                                                                             |
| `forbidden_or_not_found`                   | Non-enumerating refusal; no protected fields                                                                                    |
| `conflict: slot_unavailable`               | Missing, inactive, past, unassigned or reserved slot; same generic message, no absence reason                                   |
| `conflict: student_overlap`                | Own active timetable conflicts; no other booking content returned                                                               |
| `conflict: slot_changed`                   | Eligible slot's reviewed version changed; refresh and explicitly review                                                         |
| `conflict: idempotency_mismatch`           | Key belongs to another normalized payload; do not mutate/reuse it                                                               |
| `temporarily_unavailable` + correlation ID | Definite pre-write failure/rollback; retry same intent                                                                          |
| `outcome_unknown` + correlation ID         | Transport loss/invalid response/timeout after possible submission; recover or replay same intent, never assert “nothing booked” |

Signed-out/inactive pages/actions follow `requireRole` login redirect, wrong roles their dashboard;
do not swallow framework redirects as outages. Direct RPC callers receive denial/refusal without data.
Lookup absence and inaccessibility are identical. Failed creation availability uses the generic
`slot_unavailable` shape even for a nonexistent well-formed ID; permission failure precedes querying.

## Security and AI requirements

### STU-02-R9 — Authorization, safe rendering and abuse boundaries

- Classification: `confirmed` for permissions/privacy; `proposed` for exact request hardening.
- Source: AGENTS, `SH-01`, shared security requirements and user security cases.

Every page/layout and action/handler checks `requireRole("student")` before protected work; database
functions independently derive `auth.uid()` and active role. Recovery filters by trusted owner/key.
Reject cross-origin state-changing browser requests using the framework's validated Origin/Host
protection; test direct invocation, not UI hiding. No GET reserves a slot. Treat all stored/input text
as plain text; never HTML, SQL, executable URL or instructions. Use parameterized queries. Logs contain
only bounded operation/error category/correlation ID; no topic/questions, raw payload, session token,
idempotency key, raw SQL or errors. Authorization checks precede replay data disclosure even after
deactivation. Do not add direct staff-profile/table reads. Sensitive migrations need independent review.

### STU-02-R10 — No AI in reservation

- Classification: `confirmed`.
- Source: user shared-AI rules; `SH-05-R9`; separate `STU-03` plan.

Creation, lookup and recovery make no model call, construct no prompt, and read/write no `ai_usage`.
Consultation descriptions containing malicious model instructions remain inert stored text. No model
may select an owner, decide availability, submit, approve or mutate a booking. Provider failure cannot
affect this workflow. Live-model evaluation is inapplicable.

## Edge cases and failure paths

Requirements R3–R9 cover stale forms, expired sessions, exact start-time boundary, invalid ranges,
assignment/course/Lecturer deactivation races, same-slot/Student overlap races, duplicate clicks,
terminal-history replay, invalid text, injected fields, unavailable database, malformed result and
commit uncertainty. For deterministic refusal, no mutation occurs; for uncertain transport, outcome
must be recovered before a new intent is encouraged. Exact UI wording may vary without changing these
outcomes. Rejection/cancellation/completion actions and their cutoffs remain outside this specification.

## Acceptance criteria and verification

Planned tests, not results. Originally proposed criteria are covered by the team approval above. DB means local
PostgreSQL with fake data, not a mocked RPC. Concurrency requires independent real DB connections.

- **STU-02-AC1** (R1; E2E + DB): Given an eligible slot beyond page one, opening its form shows correct fixed course/Lecturer/SGT times; opening/back/refresh creates no booking.
- **STU-02-AC2** (R2; E2E + DB): Given an eligible slot and valid text, submission creates exactly one owned pending row, confirms pending and removes it from a fresh browse result.
- **STU-02-AC3** (R3; DB): Given past/start-now, invalid range, inactive course/Lecturer, wrong Lecturer role, missing assignment or completed history, submission refuses without creation.
- **STU-02-AC4** (R5; Unit + DB): Given empty/whitespace, 200/201 topic and 2000/2001 question code points including emoji, missing/duplicate/unknown fields and invalid IDs, valid boundaries succeed and invalid inputs fail at application and RPC boundaries.
- **STU-02-AC5** (R3, R4; Concurrent DB integration): Given two Students and one available slot, genuinely simultaneous transactions yield exactly one pending booking and one generic slot conflict.
- **STU-02-AC6** (R4; Concurrent DB integration): Given one Student and overlapping distinct slots, concurrent attempts commit at most one; existing pending/approved blocks overlap; adjacent/disjoint slots both succeed and terminal history does not block.
- **STU-02-AC7** (R3; DB): Given only rejected/cancelled history and a future eligible slot, a new intent creates a different booking and leaves every historical field unchanged; completed history refuses.
- **STU-02-AC8** (R9; E2E + DB): Given signed-out, inactive, Lecturer/Admin actors, direct page/action/RPC calls disclose no protected data and write nothing; deactivation blocks recovery too.
- **STU-02-AC9** (R2, R9; Unit + DB security): Given forged owner/role/status/course/time or another Student's key, creation cannot impersonate and recovery reveals nothing; authenticated direct table writes/reads remain denied.
- **STU-02-AC10** (R6; Concurrent DB + fault-injected integration): Given simultaneous identical key/payload submissions or lost success response, replay returns one identical booking ID; changed payload fails; another Student's same key grants no access.
- **STU-02-AC11** (R6; DB): Given a stored request later becomes terminal, replay returns its current terminal receipt without insert; deliberate fresh-key eligible rebooking preserves history.
- **STU-02-AC12** (R6, R8; DB + E2E): Given a material slot change since review, submission returns slot_changed or generic unavailability, never silently books changed details; refresh requires review.
- **STU-02-AC13** (R3; Concurrent DB integration): Given concurrent endpoint/assignment changes or lock wait crossing start time, serialized eligibility and fresh database time prevent an invalid new request without auto-transitioning existing bookings.
- **STU-02-AC14** (R8; Fault-injected integration + E2E): Given database failure before write versus response loss/invalid response after possible commit, UI distinguishes retryable failure from uncertainty, preserves intent, and same-key recovery creates no duplicate.
- **STU-02-AC15** (R9; Unit + browser security): Given script/SQL/model-instruction text, rendered form/feedback is literal, no script/SQL executes, and captured logs/results contain no forbidden private fields or raw errors.
- **STU-02-AC16** (R7, R9; Integration + DB): Given oversized input, cross-origin mutation or GET invocation, no booking is created; valid in-bound same-origin form works and operation timeouts produce safe R8 outcomes.
- **STU-02-AC17** (R7; E2E + manual): Given keyboard use, 320px and 200% zoom, labels/focus/errors/status are usable; pending prevents duplicate UI submits and success/conflict/uncertainty are textual.
- **STU-02-AC18** (R10; Unit spies + DB before/after + inspection): Given success and every handled failure with AI provider unavailable, no model call/prompt/AI-usage access occurs and ordinary requests remain functional.
- **STU-02-AC19** (R8, R9; Unit + DB + E2E): Given eligible lookup/owned receipt and inaccessible IDs, responses contain only their allowlists; missing/inaccessible failures do not distinguish private existence; redirects are not converted to outages.

## Review evidence and resolved approval questions

Original self-review: `workflow/reviews/stu-02/specification-challenge.md`. Joseph subsequently reported
whole-team approval of the following choices. Independent pre-implementation consistency evidence is
`workflow/reviews/stu-02/preflight.md`; this is not an external approval or an implementation test.

1. Approve required trimmed topic 1–200/questions 1–2,000 code points and the precise normalization.
2. Approve adjacent intervals and retry/version/recovery semantics, including page-memory-only recovery
   UX and persistent key retention with historical bookings.
3. Approve the narrow API/projection, accessible UI and 16 KiB/5s/10s bounds; accept no new booking-rate
   quota for this slice or specify one. Reconcile the relevant draft shared requirements for creation.

# Reflection

## What went well

The spec-driven development process gave us a clear definition of the Student consultation request feature before implementation began. The specification documented expected behaviour, authorization rules, failure cases, security requirements, and acceptance criteria. Linking tests to requirement IDs also made it easier to determine which parts of the feature had been verified.
The generator–verifier workflow was useful. The developer agent implemented the feature, while the tester and security reviewer independently examined it. This separation helped uncover two genuine issues: consultation text could appear in the URL through the form’s native fallback behaviour, and timestamps were not returned in the required UTC Z format. Both problems were fixed and rechecked.
Testing against a disposable Supabase database worked well for validating database rules, concurrent requests, authorization, retry behaviour, and transaction rollback without affecting production data. The final automated checks covered unit tests, database tests, real concurrency tests, and browser tests. We also verified that unauthorized users could not access the request operations and that failed requests did not leave partial bookings.
The implementation handled important security concerns, including server-side role checks, restricted database functions, prevention of overlapping bookings, idempotent retries, safe rendering of user input, and keeping consultation text out of URLs and logs. The feature also remained usable when the AI service was unavailable because consultation booking does not depend on AI.

## What did not go as expected

The workflow became more complicated and time-consuming than expected. A large number of handoff, review, test, and log files were created, which made it harder to understand the current status of the feature. The long conversation context and repeated verification also consumed more tokens than necessary. Future features should use shorter, feature-specific conversations and one consolidated current handoff, while keeping older details in an archive.
Several initial test failures were caused by test setup problems rather than application defects. Examples included an incomplete Supabase mock, using the wrong browser hostname, an incorrect assumption about redirect headers, retained test fixtures affecting global database counts, and a mismatch between the new browser tests and the database used by GitHub Actions. These problems showed that verifier agents must validate their fixtures and assertions before reporting an implementation bug.
The local database setup also caused unexpected disruption. Resetting Supabase correctly installed the migrations, but it deleted the existing local users and data. The first version of the demo-user seed also omitted a required Auth field, which temporarily caused login requests to fail with a server error. The seed was corrected and login was verified, but the reset should have been explained before it was performed, and existing local data should have been backed up or explicitly confirmed as disposable.
The difference between the normal development database and the disposable verification database was initially confusing. Some tests passed in the disposable environment while the application still failed locally because the normal database did not have the required migrations or fixtures. Future work should establish the intended database target at the beginning and provide one documented setup command for developers.
Although the local automated tests passed, hosted GitHub Actions and the manual 200% zoom, focus, and readability checks were not completed during the workflow. Therefore, local success should not be presented as final merge approval. Database migrations and CI changes still require independent teammate or CODEOWNER review before merging.

## Change log

| Date       | Change                                                                       | IDs              | Evidence invalidated    | By                     |
| ---------- | ---------------------------------------------------------------------------- | ---------------- | ----------------------- | ---------------------- |
| 2026-10-18 | New request-only STU-02 slice, derived from user workflow and inspected code | R1–R10, AC1–AC19 | None; no prior approval | requirements_architect |
