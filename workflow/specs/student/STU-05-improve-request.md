---
id: STU-05
title: Improve a consultation request with AI
owner: joseph
status: approved
---

# STU-05: Improve a consultation request with AI

## Document control

- Task: `STU-05-SPEC`; author: assigned `requirements_architect`; date: 2026-10-19.
- Reviewed repository commit: `4b98534283486b34a3c38ef88866fd5f8652e2d9`.
- Reviewed source digests: `SH-01` before this revision =
  `a1a660ead71b0565afddf27633c63b6299bc5fa8`; `PRODUCT-SPEC.md` =
  `d9f63461aeb368ffd811ec50e5a595e0c6047ca7`; `TECHNICAL-SPEC.md` =
  `0aa3300e553763993dfede1dc9e3483a5b2772fe`; `INTEGRATION-SPEC.md` =
  `2899ee84eddce2a22f5f114e8dfd623dcc4b2625`; `STU-02` =
  `9cba2efc408118ea4d12899774e43dda80352a02`.
- Parent/shared requirements: `PRD-01-AC8/AC9`, `TEC-01-AC4/AC5`, `INT-01-AC4/AC6`, `SHR-01-AC3/AC4`,
  revised `SH-01-R6/AC6/AC7`, and the ordinary request boundary in `STU-02`.
- Related plan and latest handoff: `workflow/plans/stu-05-improve-request.md` and
  `workflow/handoffs/stu-05/latest.md`. Predecessor request implementation evidence:
  `workflow/handoffs/stu-02/latest.md`.
- Prior team-reported approval: Joseph reported on 2026-10-19 that he and the team
  confirmed/approved STU-05 at digest `74eeb61f192e0073343fed708ad694b671268fbc`. The 2026-10-19
  daily-reservation, midnight-attribution, and 30-day-retention revision below is material; that approval
  was stale until the renewed team-reported approval below.
- Renewed team-reported approval: Joseph reported on 2026-10-19 that the team approved the exact revised
  draft reviewed at digest `e871e34b126b0e624e1b88f06f47eac917e548c2`. This sets STU-05 to `approved`.
  Reviewer identities and remote GitHub/PR evidence remain unverified; this is product/specification
  approval only, not independent reviewer proof, merge, deployment, or sensitive-implementation approval.
- Material UI/contract revision requested 2026-10-20: Joseph explicitly accepted an editable structured
  proposal containing an improved topic, improved questions, and suggestions, with explicit Apply and
  Dismiss controls, no automatic submission, and one-call cost disclosure. This revision changes
  `STU-05-R2/R3/R8`, `STU-05-AC3/AC6/AC12`, and adds `STU-05-AC16/AC17`. It resets this specification to
  `draft`; the prior approval digest `a8f8c94cffa58bcf88d5721dd211027a4713b98b` and verification against
  its single-text response contract are stale until the revised specification and tests receive renewed
  human review.
- Renewed team-reported UI approval: Joseph reported on 2026-10-20 that he and the team approved the exact
  revised draft at digest `d0c86cfacf4dcd445dd883e7e5c28f120dde58adac7e5a8692d8323ea1ef5feb`
  and requested implementation. This sets STU-05 to `approved`. Reviewer identities and remote protected-
  PR evidence remain unverified; this is product/specification approval only, not test completion,
  sensitive-implementation approval, merge, deployment, or production-use approval.
- External evidence limitation: individual reviewer identities and a remote GitHub/PR approval were not
  independently verified. This record documents Joseph's report only; it is not merge, deployment, or
  sensitive-change approval.
- Confirmed: active-Student-only use; draft topic/questions only; fixed instructions, `wrapUntrusted`,
  `generateText`, server-only credentials, 4,000-character input cap, 600-token output cap, 20-second
  timeout, plain-text output, explicit human review/edit, no AI mutation/persistence/autonomy, and the
  user-confirmed quotas below.
- Confirmed 2026-10-19 revision: global 10 admitted requests/rolling 60 seconds and the durable
  reservation, finalization, release, expiry/reconciliation protocol below. Daily capacity is reserved
  at admission and attributed to the admission's Asia/Singapore calendar day; minimal usage metadata is
  retained for 30 days only.
- Confirmed 2026-10-20 UI direction: the existing request form remains visible; generated advice is an
  editable proposal split into topic, questions, and suggestions; Apply and Dismiss are explicit local UI
  actions and neither calls the model nor submits or persists a booking.
- Confirmed approved implementation bounds: the provider returns one strict JSON object;
  proposed topic/questions use the existing STU-02 200/2,000-character bounds; suggestions contain zero
  to five plain-text items of at most 500 characters each; and the raw response remains capped at 6,000
  characters in addition to the shared 600-token provider limit.
- Unresolved feature decisions: none. The separately recorded 30-day cleanup scheduler implementation
  blocker remains unresolved and must not be represented as satisfied by this approval.

## Product and feature description

An active Student may ask the system to improve an unsaved consultation-request draft. The result is a
structured advisory proposal whose fields render as plain text: it should make supplied topic/questions
clearer and identify missing information without inventing personal details or facts. The Student must
review and may edit the proposed topic/questions before explicitly applying them to the still-visible
ordinary form and separately submitting the booking. AI availability never affects the ability to create
a consultation request manually.

## Scope, non-goals, and dependencies

### In scope

- Improving an unsaved Student-owned draft topic and questions in the existing request workflow.
- Authorization, input/output validation, quota/rate-limit behaviour, injection resistance, safe output
  display, typed failures, and review/edit-before-submit behaviour.
- Usage metadata sufficient to enforce approved limits, without storing prompt or response bodies.

### Non-goals

- Creating, editing, reserving, approving, rejecting, cancelling, completing, or persisting a booking
  from an AI request or response.
- Sending course enrolment, slot/booking IDs, lecturer/student identity, profile data, other bookings,
  browser/session data, or database data to the model.
- Live-model quality scoring as a release gate, background/batch improvements, streaming, attachments,
  chat memory, or changing the shared gateway for unrelated AI features.

### Dependencies

- `SH-01` trusted session, active-role checks, shared gateway/accounting and revised quota contract.
- `STU-02` ordinary request form and its independently authorized validation/submission path.
- `INT-01` stable feature identifier `student.improve-request` and typed internal failure contract.
- SoC LLM configuration is server-only and available in the intended environment; no credential value is
  required in tests.

## Observed implementation — evidence, not requirements

The uncommitted STU-05 implementation currently authorizes an active Student, calls `generateText`, and
renders one labelled plain-text response in a generated-advice region. It has no structured proposal,
editable generated fields, Apply control, Dismiss control, cost disclosure, or stale-form warning, so a
Student must copy text manually. Existing tests and review evidence target that earlier single-text
contract. The implementation also retains the separately recorded `RET-05-01` operational gap: a purge
function exists, but no durable scheduler proves deletion within 30 days. This current-state evidence is
not authority for the revised behaviour and does not establish implementation completion.

## Users, roles, and permissions

| Actor                                         | Allowed actions/data                                                                                          | Refused actions/data                                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Active Student                                | Submit own current unsaved topic/questions for one improvement; view/edit/apply/dismiss the returned proposal | Any other user's draft/data; autonomous booking action; model credentials/accounting rows               |
| Signed-out, inactive, Lecturer, Administrator | No Student AI action or result                                                                                | Prompt/model call, usage disclosure, or Student request data                                            |
| SoC LLM                                       | Receives only labelled escaped topic/questions and fixed instructions                                         | Tools, database access, identity/profile/slot/booking metadata, credentials, or autonomous side effects |

The Server Action authorizes active `student` before validation, quota claim, or model invocation. The
client never supplies identity, feature identifier, instructions, quota counters, role, or provider key.

## Functional requirements

### STU-05-R1 — Explicit, draft-only improvement

- Classification: `confirmed`.
- Source: user feature request; `PRODUCT-SPEC.md`; `INT-01`.

Only an explicit active-Student request may improve the current unsaved `topic` and `questions` draft.
The action sends no data other than those two labelled fields to the gateway. It must use stable feature
identifier `student.improve-request`, fixed source-controlled instructions, and `generateText`; direct
provider clients are forbidden.

### STU-05-R2 — Advisory output and human control

- Classification: `confirmed`.
- Source: user feature request; `PRD-01-AC8`; `TEC-01`.

The result is labelled generated advice and is not a source of record. A successful response creates a
separate editable proposal containing an improved topic, improved questions, and zero or more suggestions;
the original request fields remain visible and unchanged. The Student may edit the proposed topic and
questions, explicitly Apply them to the ordinary request fields, or Dismiss the proposal. Apply copies
only the proposed topic and questions into the current form; suggestions remain advisory. Dismiss removes
only the local proposal. Neither action calls the model, creates/persists/mutates/submits a booking, or
triggers the ordinary submission action. Only the separately selected normal request submission may save
the final topic/questions.

The UI records the source topic/questions snapshot for each generated proposal. If the current request
fields no longer match that snapshot, it visibly warns that Apply will replace the current topic and
questions before the Student selects Apply. Applying a locally edited proposal is refused with field-level
feedback unless its topic and questions satisfy the same STU-02 bounds as ordinary submission.

### STU-05-R3 — Truthful, bounded generation

- Classification: `confirmed`.
- Source: user feature request; shared gateway constraints.

Fixed instructions require the model to clarify only supplied content, explicitly mark genuinely missing
details as suggestions, and not invent identity, enrolment, deadlines, personal circumstances, course
facts, appointments, or authoritative academic advice. The action refuses gateway input over 4,000
characters; the gateway limits output to 600 tokens and 20 seconds.

The provider response is untrusted text that must parse as exactly one JSON object with no additional
keys: `{ "topic": string, "questions": string, "suggestions": string[] }`. Markdown fences, prose outside
the object, malformed JSON, unknown keys, NUL, unpaired surrogates, an empty/overlong topic or questions,
more than five suggestions, or an empty/over-500-character suggestion make the whole response invalid.
After Unicode-aware trimming, topic is 1–200 characters, questions is 1–2,000 characters, suggestions is
an array of zero to five advisory strings of 1–500 characters each, and the raw response is at most 6,000
characters. Zero suggestions is valid and is presented as no additional suggestions, rather than making
the model invent one. Invalid output returns a handled failure and no partial field is displayed or
applied. The server returns validated fields, never raw provider text, and the UI must not imply that the
model verified any fact.

### STU-05-R4 — Approved Student quota and rate limit

- Classification: `confirmed`.
- Source: Joseph's 2026-10-19 confirmed decisions; revised `SH-01-R6`.

There is no per-minute or per-Student daily quota. Across the whole application, at most 100
daily-capacity reservations may be admitted for an Asia/Singapore calendar day; a valid provider response
finalizes one such reservation as a successful AI response. The shared counter resets at 00:00
Asia/Singapore, not 24 hours after a request. Daily capacity is attributed to the Asia/Singapore calendar
day in which its request was admitted, even if the provider returns after midnight. A new request admitted
after midnight uses the new day's capacity. A deliberate new request after a valid response is separately
countable. A request refused by quota does not consume daily capacity.

### STU-05-R5 — Failure, retry, and concurrency behaviour

- Classification: `confirmed`.
- Source: Joseph's confirmed decisions; `PRD-01-AC9`; `SHR-01-AC4`.

Before calling the provider, the server atomically reserves applicable minute and daily capacity and
records a minimal attempt; it permits at most one in-flight improve attempt per Student. A valid provider
output atomically finalizes the attempt as successful against its original admission-day reservation.
Timeout, provider unavailable/rate limit, invalid/empty output, input validation failure, accounting
failure, and quota/rate-limit refusal return a typed safe outcome, release the reservation, and do not
consume daily capacity. A stale pending reservation expires or is reconciled by trusted server/database
logic without another model call. Its resolved retry is a new deliberate request, not an automatic
provider retry. If the provider outcome cannot safely be determined, the system does not claim success or
promise exactly-once provider billing; it exposes no raw data and manual booking remains available. The UI
prevents duplicate clicks, while server enforcement remains authoritative.

### STU-05-R6 — Safe handling of untrusted input and output

- Classification: `confirmed`.
- Source: `SH-01`, `SHR-01`, `TEC-01-AC4/AC5`.

Topic/questions are untrusted even when they came from a prior model result. Each field is labelled and
wrapped separately with `wrapUntrusted`; fixed instructions state that content inside the blocks is data,
not instructions. Stored indirect-injection text is out of scope for this draft-only feature because no
database content is sent, but a future prefill must receive the same treatment. Returned model text is
untrusted, rendered literally as text (never HTML/Markdown interpretation), and never parsed as commands,
authorization evidence, links to follow automatically, or another prompt.

### STU-05-R7 — Data minimization, audit and disclosure boundary

- Classification: `confirmed`.
- Source: `INT-01`; `SHR-01`; user constraints.

Only server-side usage metadata needed for quota enforcement may be recorded: authenticated user ID,
stable feature identifier, outcome/accounting state, and timestamp. Delete each attempt record no later
than 30 days after its `created_at` timestamp. Do not persist prompt text, output text, raw provider
responses, provider key, or full consultation descriptions in application logs or usage rows.
Student-facing output returns only the validated advice or a typed safe failure; it never discloses quota
counts of another user, global remaining quota, provider errors, or internal identifiers.

## Non-functional requirements

### STU-05-R8 — Usable, accessible and bounded recovery

- Classification: `confirmed`.
- Source: `SHR-01`; user decision.

The form groups and labels the optional AI controls separately from ordinary submission. Adjacent text
states that each selection of “Improve my request” or “Generate again” starts one AI request that uses
limited allowance; Apply and Dismiss use no AI request. Generation controls are disabled while their own
request is in flight, and duplicate clicks cannot start a second request. Loading, success, error, stale
proposal, and local proposal-validation states are announced in text through appropriately labelled live
regions without moving or hiding the original request fields.

On success, the generated region is programmatically labelled and keyboard reachable; its editable
topic/questions have associated labels and their errors are associated with the fields. Suggestions render
as a literal-text list. Apply and Dismiss are keyboard-operable buttons whose purpose is explicit. On quota
exhaustion, the UI says that the AI request limit has been reached and manual writing/submission remains
available. Retry guidance does not encourage retry before `retryAfterSeconds` where provided. A failed
Generate again retains the current request fields and any previously successful proposal, shows the typed
failure, and does not make an automatic retry.

## UI description and use cases

### UC1 — Improve a valid draft

- Preconditions: active Student is on the ordinary request form with topic/questions within form bounds;
  Student/global quota and rate limits permit a call.
- Trigger: Student selects “Improve my request”.
- Main flow: UI preserves draft, captures its source snapshot, and shows pending state; Server Action
  authorizes, validates, atomically reserves capacity/records an attempt, wraps the two fields, calls the
  gateway, strictly parses and validates the structured response, atomically finalizes one successful
  response, and returns only validated topic/questions/suggestions. The UI renders a separate editable
  proposal and literal suggestion list. The Student may edit and Apply the proposal, then separately
  submit the normal booking.
- Postconditions: no booking/data mutation from AI action; one valid response counts once.

### UC2 — Quota, rate-limit, or provider failure

- Main flow: typed safe failure/limit message is shown; original draft and normal submit remain usable.
- Postconditions: no successful daily quota is consumed; no booking is changed.

### UC3 — Stale or indeterminate attempt

- Main flow: a trusted expiry/reconciliation process releases or marks the minimal attempt without a
  model call. The Student receives a safe unresolved/fallback message and may make a new deliberate
  request after resolution.
- Postconditions: no automatic provider retry, no false success claim, no private/provider detail, and
  ordinary manual booking remains usable.

### UC4 — Injection or hostile output

- Main flow: instruction-like draft content remains escaped labelled data; script/HTML-like strings in any
  valid JSON field remain literal text, while malformed or extra-key output is refused as a whole.
- Postconditions: no instruction/tool/action is followed and no script executes.

### UC5 — Apply, dismiss, or regenerate a proposal

- Main flow: Apply locally validates and copies only proposed topic/questions to the ordinary fields;
  Dismiss removes only the proposal. If the ordinary fields changed after generation began, the UI first
  discloses that Apply will replace their current values. Generate again clearly states that it uses one
  new AI request, captures a new source snapshot, and does not automatically run after failure.
- Postconditions: Apply/Dismiss make no model, accounting, persistence, or booking-submission call. A
  failed regeneration retains the prior successful proposal and current ordinary fields.

## Data model and integrity rules

Existing `ai_usage` is server-only quota metadata, but its current shape cannot distinguish admitted,
in-flight, successful, expired, and failed outcomes. An append-only migration must add the minimum
attempt state/time/indexes needed for atomic admission, one in-flight attempt/Student, rolling per-user and
global rates, admission-day daily-capacity reservation, successful finalization, bounded
expiry/reconciliation, and deletion no later than 30 days after `created_at`. It must not store prompts or
responses, and existing migrations must not be edited. Daily boundaries use an explicit Asia/Singapore
computation against trusted server/database time; browser time is not authoritative.

## API and boundary contracts

### Proposed internal Server Action: `improveRequestDraft`

Input allowlist: `{ topic, questions }` only; both are untrusted strings. Server derives authenticated
user ID/role, feature ID, fixed system prompt, limits, current time, and any retry timing. It returns one
of:

| Outcome                  | Returned data / client behaviour                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `success`                | `{ proposal: { topic, questions, suggestions } }`; every field has passed the strict bounds above; no raw provider text        |
| `validation_error`       | safe field/size feedback; no model call or daily quota use                                                                     |
| `forbidden_or_not_found` | generic refusal; no model call or data disclosure                                                                              |
| `ai_unavailable`         | typed `timeout`, `rate_limited`, `unavailable`, or invalid-output category and optional safe retry delay; draft remains usable |
| `quota_exceeded`         | generic Student/global limit message and optional retry delay; manual request remains usable                                   |
| `in_flight`              | safe “already improving” feedback; no second model call                                                                        |
| `unresolved_attempt`     | safe fallback after expiry/reconciliation; no success claim or automatic provider retry; a new deliberate request may follow   |

The action must not accept a system prompt, model name, user ID, role, booking/slot ID, feature ID,
quota counter, arbitrary JSON, or output-application instruction. Exact error-code names are proposed;
the typed non-enumerating contract is required.

Apply and Dismiss are client-local state transitions, not Server Actions. Generate again invokes the same
action once with the then-current ordinary topic/questions; it cannot reuse a prior success as trusted
model input unless those values are explicitly present in the current form and are wrapped as untrusted.

## Security requirements

- Page/layout and Server Action call `requireRole("student")`; authorization precedes model/accounting.
- Use only `generateText`; credentials and admin database client remain server-only. Any admin-client
  accounting path follows an explicit active-role check and minimal data access.
- Validate input before sending it; strictly parse and validate the whole returned JSON object before
  returning or displaying any field; fail closed on unreliable accounting/claim state.
- Fixed instructions and each field's untrusted content remain structurally separate. No database or
  stored text enters the prompt for this feature. Parsed model fields remain untrusted and are never
  interpreted as HTML, Markdown, commands, URLs to follow, component props beyond literal values, or
  authorization evidence.
- No raw prompts/responses/secrets/private drafts in logs, tests, usage rows, URLs, or error messages.
- Migration/RLS/gateway/accounting/auth changes are sensitive and require independent teammate/CODEOWNER
  review before merge; human approval is required before implementation begins.

## Edge cases and failure paths

| Condition                                          | Required observable outcome                                                          | Invariant preserved    |
| -------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------- |
| Signed-out, inactive, or non-Student direct action | Refusal/redirect without model or usage call                                         | Role/data boundary     |
| Missing/invalid/over-4,000-char input              | Field feedback; no model/accounting call                                             | Bounded input          |
| App-wide 100/day capacity reached                  | Clear fallback; manual booking usable                                                | Budget cap             |
| Concurrent clicks/tabs                             | One active in-flight request per Student; other request refused/joins no second call | Bounded spend          |
| Timeout/provider error/empty-invalid output        | Typed fallback; no daily-success count; original draft preserved                     | Booking independence   |
| Valid JSON with missing/extra/wrong-type fields    | Reject the whole response; display no partial proposal                               | Output contract        |
| Proposal edited outside ordinary form bounds       | Refuse Apply with associated field feedback; no model or booking call                | Input integrity        |
| Form changes while generation is in flight         | Preserve current form; warn before an explicit Apply replaces its topic/questions    | Human control          |
| Dismiss or Apply selected                          | Local state change only; no AI/accounting/persistence/submission call                | Side-effect boundary   |
| Generate again fails                               | Keep current form and last successful proposal; show failure; no automatic retry     | Bounded recovery       |
| Stale/indeterminate provider attempt               | Trusted expiry/reconciliation; no automatic retry or false success claim             | Bounded recovery       |
| Instruction-like input or output containing script | Escaped prompt/literal display; no execution/action                                  | Injection boundary     |
| Model fabricates a personal/course fact            | Treat as advisory text; UI does not auto-submit; mock evaluation detects violation   | Human control          |
| Accounting unavailable                             | Refuse safely before model call                                                      | Fail-closed accounting |

## Acceptance criteria and verification

| ID          | Requirement | Given / when / then outcome                                                                                                                                                                                                                                                                                                                                                                        | Verification method                 | Mocked or live                          |
| ----------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------- |
| STU-05-AC1  | R1          | Given an active Student and valid draft, when improve is selected, then exactly topic/questions are wrapped and passed through `generateText` with fixed instructions and `student.improve-request`.                                                                                                                                                                                               | unit/integration                    | deterministic mock                      |
| STU-05-AC2  | R1, R7      | Given a signed-out/inactive/non-Student caller or supplied foreign identity, when invoking directly, then no model/accounting call occurs and no private data is returned.                                                                                                                                                                                                                         | integration/E2E                     | deterministic fixture/mock              |
| STU-05-AC3  | R2          | Given a successful response, when it is returned, then separate editable proposed topic/questions and a literal suggestion list appear while the original fields remain unchanged; nothing is persisted or submitted until the Student separately uses normal submission.                                                                                                                          | component/E2E                       | deterministic mock                      |
| STU-05-AC4  | R3          | Given valid draft input, when the model is called, then the gateway input is at most 4,000 characters, output request at most 600 tokens, and timeout is 20 seconds.                                                                                                                                                                                                                               | unit                                | deterministic mock/config inspection    |
| STU-05-AC5  | R3, R6      | Given direct/stored-style injection text including closing tags, when prompt is assembled, then each source field remains in one escaped untrusted-data block and no input becomes instructions.                                                                                                                                                                                                   | unit                                | deterministic mock                      |
| STU-05-AC6  | R3, R6      | Given valid strict JSON containing script/HTML-like field text, when returned, then every value renders literally and no script executes. Given malformed/fenced/extra-key JSON, wrong field types, missing/empty/overlong fields, too many/overlong suggestions, NUL, unpaired surrogates, or over-6,000-character raw output, the whole response yields typed fallback with no partial proposal. | unit/component/E2E                  | deterministic mock                      |
| STU-05-AC7  | R4          | Given sequential valid requests below shared daily capacity, when one Student makes more than three requests in 60 seconds or more than ten in a day, then no minute or per-Student daily quota refusal occurs.                                                                                                                                                                                    | unit/integration                    | deterministic clock/database fixture    |
| STU-05-AC8  | R4, R5      | Given a valid provider output finalizes an admission-day reservation after midnight, then it finalizes against the original Singapore admission day and a new post-midnight admission uses the new day.                                                                                                                                                                                            | integration                         | deterministic clock/database fixture    |
| STU-05-AC9  | R4, R5      | Given 99 app-wide daily-capacity reservations for the current Singapore admission day, when one more is admitted then it may call the provider; the 101st is refused without disclosing global usage. A failed attempt releases its reservation.                                                                                                                                                   | integration                         | deterministic database fixture          |
| STU-05-AC10 | R4          | Given app-wide daily capacity is available, when requests are made without a minute quota, then the server admits them subject only to one-in-flight-per-Student control and the 100/day shared capacity.                                                                                                                                                                                          | integration                         | deterministic database fixture          |
| STU-05-AC11 | R5          | Given concurrent clicks/tabs for one Student, when requests overlap, then at most one provider call is started and rate/daily accounting is not double-spent.                                                                                                                                                                                                                                      | integration/concurrency             | deterministic provider/database fixture |
| STU-05-AC12 | R5, R8      | Given timeout, provider rate limit/unavailable response, invalid output, accounting failure, quota refusal, or failed Generate again, when the attempt resolves, then a safe accessible fallback appears, current ordinary fields and any prior successful proposal remain usable, no automatic retry occurs, and successful daily quota is unchanged.                                             | unit/component/E2E                  | deterministic mock                      |
| STU-05-AC13 | R7          | Given a successful or failed call, when usage/logging is inspected, then it contains only allowed metadata and no draft/output/provider secret; each attempt is deleted no later than 30 days after `created_at`.                                                                                                                                                                                  | unit/integration/manual code review | deterministic fixture/manual            |
| STU-05-AC14 | R5          | Given a stale or indeterminate pending attempt, when trusted expiry/reconciliation runs, then it makes no provider call, claims no success, returns safe fallback, and a later request is a new deliberate request.                                                                                                                                                                                | integration                         | deterministic clock/provider fixture    |
| STU-05-AC15 | R3          | Given representative benign and adversarial drafts, when a separately approved live evaluation is run with non-private synthetic data, then results are recorded as advisory quality evidence only; no live evaluation is required for deterministic release checks.                                                                                                                               | model evaluation                    | live, manual opt-in                     |
| STU-05-AC16 | R2          | Given a valid locally edited proposal, when Apply is selected, then only the ordinary topic/questions are replaced and no model, accounting, persistence, or submission call occurs; when Dismiss is selected, only the proposal is cleared. If current fields differ from the generation snapshot, replacement is disclosed before Apply.                                                         | component/E2E                       | deterministic mock                      |
| STU-05-AC17 | R5, R8      | Given the AI controls, when inspected and operated by keyboard, then fields/regions/errors are labelled, loading and outcomes are announced in text, duplicate in-flight generation is disabled, and the UI distinguishes one-call Improve/Generate again from zero-call Apply/Dismiss.                                                                                                            | component/E2E/accessibility review  | deterministic mock/manual inspection    |

### Traceability definitions

- **STU-05-AC1** (`STU-05-R1`; unit/integration): Verify the table's gateway-input allowlist,
  fixed-instruction, wrapper, and stable-feature-ID outcome.
- **STU-05-AC2** (`STU-05-R1`, `STU-05-R7`; integration/E2E): Verify direct role/identity refusal and
  absence of model/accounting calls.
- **STU-05-AC3** (`STU-05-R2`; component/E2E): Verify structured editable generated fields remain
  separate from the unchanged ordinary form and cannot auto-save or auto-submit a booking.
- **STU-05-AC4** (`STU-05-R3`; unit): Verify 4,000-character input, 600-token output, and 20-second
  timeout constraints.
- **STU-05-AC5** (`STU-05-R3`, `STU-05-R6`; unit): Verify separately escaped untrusted-data fields.
- **STU-05-AC6** (`STU-05-R3`, `STU-05-R6`; unit/component/E2E): Verify strict all-or-nothing JSON
  validation, literal hostile field rendering, and typed invalid-output fallback.
- **STU-05-AC7** (`STU-05-R4`; unit/integration): Verify the 3-per-minute Student admission limit.
- **STU-05-AC8** (`STU-05-R4/R5`; unit/integration): Verify 10 admission-day daily-capacity
  reservations/Student, refusal before the eleventh provider call, finalization against admission day,
  and new-day eligibility at Singapore midnight.
- **STU-05-AC9** (`STU-05-R4/R5`; integration): Verify the 500 app-wide admission-day daily-capacity
  reservation cap, finalization against admission day, midnight eligibility, and no global usage disclosure.
- **STU-05-AC10** (`STU-05-R4`; integration): Verify the app-wide 10-per-minute admission cap.
- **STU-05-AC11** (`STU-05-R5`; integration/concurrency): Verify one in-flight provider call for one
  Student.
- **STU-05-AC12** (`STU-05-R5`, `STU-05-R8`; unit/component/E2E): Verify failure/limit/regeneration
  fallback preserves current form, prior proposal, manual booking, and daily quota without auto-retry.
- **STU-05-AC13** (`STU-05-R7`; unit/integration/manual): Verify usage/log minimum metadata, no
  prompt/output/secret retention, and deletion no later than 30 days after creation.
- **STU-05-AC14** (`STU-05-R5`; integration): Verify expiry/reconciliation has no automatic provider
  retry or false success claim.
- **STU-05-AC15** (`STU-05-R3`; opt-in live model evaluation): Record only synthetic, advisory quality
  evidence separately from deterministic release checks.
- **STU-05-AC16** (`STU-05-R2`; component/E2E): Verify Apply/Dismiss local-only semantics, stale-form
  replacement disclosure, ordinary-field validation, and no AI/persistence/submission side effect.
- **STU-05-AC17** (`STU-05-R5`, `STU-05-R8`; component/E2E/accessibility): Verify labels, announcements,
  keyboard operation, duplicate-click protection, and accurate one-call/zero-call disclosure.

## Review evidence

- Material-change impact record:
  `workflow/reviews/stu-05/ui-structured-draft-change-impact.md`.
- Challenge record: `workflow/reviews/stu-05/specification-challenge.md`.
- Review type: independent challenge recorded in
  `workflow/reviews/stu-05/independent-specification-challenge.md`; no independent human reviewer identity
  was verified.
- Human input: Joseph reported renewed team approval of the exact structured proposal draft digest above.
  Prior implementation verification still covers only the stale single-text contract. Tester-owned
  acceptance/security tests must change before application code.

## Open questions blocking approval

None. Joseph reported team approval of the exact revised draft digest. This does not resolve the separate
`RET-05-01` operational blocker or approve tests, sensitive code changes, merge, deployment, or production
use.

## Change log

| Date       | Change and reason                                                                                                                                                                        | IDs affected                     | Evidence invalidated                                                  | By                     |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------- | ---------------------- |
| 2026-10-19 | First draft with user-approved anti-spend limits and explicit unresolved shared quota mechanics                                                                                          | STU-05-R1–R8; AC1–AC13           | None; feature unimplemented                                           | requirements_architect |
| 2026-10-19 | Identifier/path correction; STU-04 is Manage My Bookings and this draft is STU-05                                                                                                        | STU-05-R1–R8; AC1–AC13           | Prior draft identifier/path references only                           | requirements_architect |
| 2026-10-19 | Recorded accepted global-minute and durable accounting decisions; reset draft approval gate                                                                                              | STU-05-R4/R5/R7; AC7–AC15        | Earlier draft review evidence/digest                                  | requirements_architect |
| 2026-10-19 | Team-reported approval of revised STU-05; status set approved, with evidence limitation noted                                                                                            | All STU-05 requirements/ACs      | Draft approval gate                                                   | requirements_architect |
| 2026-10-19 | Resolved admission-day daily reservation/midnight attribution and 30-day metadata retention; reset to draft                                                                              | R4/R5/R7; AC8/AC9/AC13           | Prior approval and related test evidence                              | requirements_architect |
| 2026-10-19 | Recorded renewed team-reported approval of the revised draft at digest `e871e34b126b0e624e1b88f06f47eac917e548c2`                                                                        | All STU-05 requirements/ACs      | Draft approval gate                                                   | requirements_architect |
| 2026-10-20 | Replaced single-text/manual-copy advice with a structured editable proposal, Apply/Dismiss/regenerate semantics, stale-form disclosure, and accessibility/cost messaging; reset to draft | R2/R3/R8; AC3/AC6/AC12/AC16/AC17 | Prior approval digest and related implementation/test/review evidence | requirements_architect |
| 2026-10-20 | Recorded Joseph's report that the team approved revised draft digest `d0c86cfacf4dcd445dd883e7e5c28f120dde58adac7e5a8692d8323ea1ef5feb`; set status approved                             | R2/R3/R8; AC3/AC6/AC12/AC16/AC17 | Draft approval gate only; implementation/test evidence remains stale  | requirements_architect |
