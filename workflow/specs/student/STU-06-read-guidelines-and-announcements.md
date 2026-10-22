---
id: STU-06
title: Read consultation guidelines and announcements
owner: joseph
status: draft
---

# STU-06: Read consultation guidelines and announcements

## Document control

- Spec owner: Joseph.
- Task: `STU-06-SPEC`; revised by the assigned `requirements_architect` on 2026-10-22.
- Reviewed local commit: `c521fc137c7e4f906d071c2678588b9373440ee2` on `develop`.
- Reviewed remote evidence: open GitHub PR
  [#38](https://github.com/CS3227-2610-MP3-Orbit/CS3227-2610-MP3/pull/38), head
  `9f71393245c755300dba5e47f1350f9ff09f8ff7`, branch `feature/admin-announcements`. At
  inspection on 2026-10-22, PR #38 was open/unmerged and its reported Verify, Database rules,
  End-to-end, and Accounts/passwords checks were successful.
- Stacked evidence: PR
  [#36](https://github.com/CS3227-2610-MP3-Orbit/CS3227-2610-MP3/pull/36) was merged and PR
  [#37](https://github.com/CS3227-2610-MP3-Orbit/CS3227-2610-MP3/pull/37) remained open. PR #38
  contains stacked commits, so its full diff is not solely STU-06 work.
- Parent/shared authority: `PRD-01`, `SH-01`, approved `SH-07`, and approved
  `workflow/specs/admin/ADM-03-guidelines-and-announcements.md` at PR #38 head—especially
  `ADM-03-R5`, `R7`–`R10` and `ADM-03-AC7`, `AC8`, `AC11`–`AC15`.
- Prior draft digest invalidated by this revision: `90b4f675591b3f7e3c092ace75dec0f938aa84f2`.
  Its standalone route, 50-record combined cap, `publishedAt` projection, hidden internal ID,
  Student-only shared-reader authorization, and unresolved publication/lifecycle choices are superseded
  by approved ADM-03.
- Current-state distinction: `develop` does not contain ADM-03/STU-06. PR #38 implements the table,
  direct-RLS reader query, shared schema/card, Student-dashboard placement, and tests, but it is open.
  Observed implementation is evidence, not business authority or merged state.
- Approval: this exact revised STU-06 digest has not been explicitly approved by Joseph/team in this
  turn. Joseph's “Looks good!” review comment on PR #38 is implementation-review evidence, not an
  unambiguous approval of this later document. Status remains `draft`.

## Product and feature description

An active Student sees current Administrator-published consultation guidelines and announcements in a
read-only card on `/student`. The card shows all published guidelines followed by the five newest
published announcements. Content is full plain text with line breaks preserved. Drafts remain hidden,
and the feature performs no mutation or AI operation.

ADM-03 owns the shared resource, publication lifecycle, database access model, reader projection, and
cross-role behavior. STU-06 specifies the Student-facing placement and observable states without
duplicating or contradicting that approved contract.

## Scope, non-goals, and dependencies

### In scope

- The “Guidelines and announcements” card on `/student`.
- Active-Student access to the ADM-03 published-reader projection.
- Full plain-text rendering with preserved line breaks.
- Published-data, empty, and generic temporarily-unavailable states.
- Student-specific accessibility and safe-rendering verification.

### Non-goals

- A standalone Student route or sidebar item.
- Student create, edit, publish, unpublish, or delete operations.
- Administrator management, Lecturer placement, or their tests except by reference to ADM-03.
- Scheduling, hard delete, targeting, filters, pagination, attachments, rich text, notifications,
  acknowledgements, read receipts, or AI.

### Dependencies

- Approved `ADM-03` defines kind, bounds, publication, no hard delete, direct RLS reads, reader
  projection, ordering/cap, plain-text behavior, and no-AI behavior.
- `SH-01` supplies active-user resolution and database `current_app_role()` behavior.
- Approved `SH-07` supplies dashboard/card, responsive, focus, contrast, and status/alert conventions.
- Implementation depends on PR #38 being independently reviewed and merged, or equivalent approved
  ADM-03 code reaching the target branch. This draft authorizes no merge or deployment.

## Users, roles, and permissions

| Actor                       | Allowed through STU-06                             | Refused through STU-06                                      |
| --------------------------- | -------------------------------------------------- | ----------------------------------------------------------- |
| Active Student              | Read the published projection on `/student`        | Drafts, admin/audit fields, and every announcement mutation |
| Signed-out or inactive user | Existing login/access-denial behavior              | All announcement data                                       |
| Lecturer or Administrator   | Nothing is granted or removed by this Student spec | Student-dashboard access through this boundary              |

The shared reader intentionally calls `requireUser()`, not `requireRole("student")`, because approved
`ADM-03-R5/R10` permits every active role to use it. The `/student` layout retains its Student guard.
PostgreSQL RLS independently allows active authenticated roles to select published rows only.

## Functional requirements

### STU-06-R1 — Dashboard placement

- Classification: `confirmed` by approved `ADM-03-R10` and `PRD-01`.

The existing `/student` dashboard contains one read-only card headed “Guidelines and announcements.”
STU-06 adds no standalone page, navigation item, or mutation control.

### STU-06-R2 — Categorized bounded content

- Classification: `confirmed` by approved `ADM-03-R1/R9`.

Content kind is exactly `guideline` or `announcement`. Title/body are non-blank after trimming, with
title length 1–120 and body length 1–2,000 characters. New records begin unpublished. Publication is
boolean `is_published`; scheduling and hard deletion do not exist. Students cannot submit or alter these
values.

### STU-06-R3 — Published-only direct-RLS read

- Classification: `confirmed` by approved `ADM-03-R5`.

The shared reader resolves an active signed-in user with `requireUser()`, then performs direct,
RLS-protected reads of `public.announcements`. It explicitly filters `is_published = true`, including for
an Administrator whose separate RLS policy can see drafts. Students receive no draft through this reader
or a direct PostgREST read. Signed-out/inactive callers receive no row.

### STU-06-R4 — Reader projection

- Classification: `confirmed` by approved `ADM-03-R9/R10` and its API contract.

The strict result is either:

```ts
{
  kind: "success";
  guidelines: Array<{ id: string; title: string; body: string; updatedAt: string }>;
  announcements: Array<{ id: string; title: string; body: string; updatedAt: string }>;
}
```

or `{ kind: "temporarily_unavailable"; correlationId: string }`.

The containing array supplies category, so items do not repeat `kind`. Opaque `id` provides stable
component identity but is neither displayed nor accepted by a Student action. The projection excludes
publication state, author/audit IDs, creation timestamp, and profile data.

### STU-06-R5 — Ordering and cap

- Classification: `confirmed` by approved `ADM-03-R9`.

Return every published guideline ordered by `created_at DESC, id DESC`, and separately only the five
newest published announcements in that order. Render guidelines first and announcements second. There is
no pagination/load-more control.

### STU-06-R6 — Full literal rendering

- Classification: `confirmed` by approved `ADM-03-R8`.

Each title is a heading and each full body is ordinary React text with line breaks preserved. Neither is
interpreted as HTML/Markdown or passed to `dangerouslySetInnerHTML`. Script, event-handler, URL-like,
SQL-like, and model-instruction text stays inert and triggers no request, navigation, mutation, or
privileged action.

### STU-06-R7 — Empty and unavailable states

- Classification: `confirmed` by the approved ADM-03 UI/failure contract.

When both successful arrays are empty, show “No guidelines or announcements yet.” as a friendly status.
Database error, timeout, malformed result, or thrown dependency failure maps to “Guidelines and
announcements are temporarily unavailable. Please retry.” as a generic alert. No partial result is
presented as current and no raw error, schema detail, inaccessible count, or content is disclosed.
Reloading the dashboard is the recovery path; no dedicated retry button is required.

### STU-06-R8 — Accessibility and responsiveness

- Classification: `confirmed` by approved `SH-07` and ADM-03 UI conventions.

The card has a labelled section and semantic heading hierarchy; empty feedback is a status and failure
feedback an alert. Maximum-bound text wraps without obscuring dashboard navigation at 320px and 200%
zoom. Keyboard access, visible focus where applicable, and WCAG AA contrast inherit `SH-07`.

### STU-06-R9 — Read-only and no AI

- Classification: `confirmed` by approved `ADM-03-R3/R6/R7`.

The card exposes no mutation. Success, empty, and failure paths never call `generateText`, build a
prompt, access a provider, or write `ai_usage`. SoC LLM availability does not affect it.

### STU-06-R10 — Refresh and lifecycle

- Classification: `confirmed` by approved `ADM-03-R3/R5`.

Publishing/unpublishing preserves the row and changes eligibility for the next fresh dashboard read.
STU-06 promises no real-time update to an already-rendered page and has no hard-delete behavior.

## Non-functional requirements

- **STU-06-NFR1 — Privacy:** only the R4 projection or safe typed failure reaches the card.
- **STU-06-NFR2 — Reliability:** both reads must succeed and validate before success is rendered;
  otherwise use the generic unavailable state.
- **STU-06-NFR3 — Accessibility:** inherit `SH-07`; verify keyboard, 320px, 200% zoom, and light/dark
  themes.
- **STU-06-NFR4 — Bounded work:** announcements are capped at five; guidelines intentionally have no
  cap under ADM-03's approved small-catalogue decision. No separate performance SLA is invented.

## UI description

One card appears among `/student` dashboard content. A non-empty result renders all guideline items then
up to five announcements; each shows a heading and full line-break-preserving body. ID and `updatedAt`
support the boundary/component but are not displayed. Empty uses the friendly status and failure the
generic alert. There is no Student action, filter, pagination, AI affordance, separate route, or nav item.

## Use cases

### UC1 — Read published content

- Actor: active Student.
- Trigger: opens `/student`.
- Main flow: Student layout authorizes role; shared reader authorizes active user; RLS reads return the
  strict published projection; card renders guidelines then announcements as full plain text.
- Alternatives: empty arrays show the empty status; query/result failure shows the unavailable alert.
- Postcondition: no data/AI usage changes and no draft/audit data is disclosed.

### UC2 — Refuse draft or inactive access

- Actors: Student targeting a draft; signed-out/inactive caller.
- Trigger: dashboard/shared-reader/direct PostgREST request.
- Outcome: authorization and/or RLS returns no protected content; inaccessible rows do not disclose
  existence.

## Technical constraints and data contract

- Shared reader uses `requireUser()`; the enclosing Student route remains role-guarded.
- Reads use the authenticated Supabase client and direct table `select`; no read RPC or admin client.
- Strict result schema validates `id`, `title`, `body`, `updatedAt` and buckets arrays.
- Student dashboard reuses the shared card rather than duplicating reader logic.
- STU-06 writes no row. It consumes ADM-03's UUID ID, two kinds, bounded title/body, boolean publication,
  audit IDs, and timestamps. Students have no insert/update/delete privilege.
- `listPublishedAnnouncements()` accepts no role, user ID, publication flag, category, limit, or selector.
  Query/result failure returns only typed `temporarily_unavailable` with correlation ID.
- PR #38 demonstrates one conforming implementation but remains open and subject to human/CODEOWNER and
  merge gates.

## Security requirements

- `/student` is Student-layout protected; shared reader calls active-only `requireUser()` before queries.
- RLS, not UI hiding, enforces draft invisibility and inactive-user denial.
- Reader selects only `id,title,body,updated_at` and explicitly filters published rows.
- Stored title/body are untrusted and render only through ordinary JSX text binding.
- Malformed output, dependency errors, hostile stored text, direct reads, or mutation attempts cannot
  broaden Student access or cause AI use.
- Logs/failures exclude content, credentials, raw database errors, and protected-row existence.
- Migration/RLS/auth and Student dashboard changes retain independent human/CODEOWNER review gates.

## AI behavior

AI is not applicable. No interaction may call `generateText`, write `ai_usage`, or transfer content or
identity data to a model. Stored instruction-like text remains data only.

## Edge cases and failure paths

| Condition                           | Required outcome                                   | Invariant             |
| ----------------------------------- | -------------------------------------------------- | --------------------- |
| No published items                  | Friendly empty status                              | Empty is not failure  |
| One category empty                  | Render available array                             | Accurate grouping     |
| More than five announcements        | Exactly newest five                                | Approved cap          |
| Equal creation times                | Stable `id DESC` tie-break                         | Determinism           |
| Direct draft read                   | No row                                             | RLS privacy           |
| Signed-out/inactive caller          | No content                                         | Active-user boundary  |
| One query fails or result malformed | Generic unavailable alert, no partial content      | Safe failure          |
| Hostile markup/instructions         | Literal text with preserved body breaks; no action | Stored-content safety |
| Item unpublished after render       | Absent on next fresh read                          | Trusted lifecycle     |
| AI unavailable                      | No effect                                          | No-AI isolation       |

## Acceptance criteria and verification

Shared guarantees map to existing ADM-03 evidence rather than duplicate tests under new labels. Results
from open PR #38 are evidence only, not results on `develop` or a substitute for final integration checks.

| ID         | Requirement | Observable outcome                                                                                                             | Evidence / required method                                                                               | Shared mapping              |
| ---------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | --------------------------- |
| STU-06-AC1 | R1, R3, R4  | Active Student opening `/student` sees published projection in the card, without drafts/admin fields                           | Existing live integration + E2E at PR #38                                                                | `ADM-03-AC7`, `AC8`, `AC14` |
| STU-06-AC2 | R5          | Two guidelines and six announcements yield both guidelines and exactly five newest announcements in deterministic order        | Existing live integration; E2E dashboard consumption                                                     | `ADM-03-AC13`, `AC14`       |
| STU-06-AC3 | R6          | Multiline HTML/script-like content preserves line breaks and stays inert literal text                                          | Existing component/static security check plus browser check; preserve reviewer-noted labeling limitation | `ADM-03-AC12`, `AC14`       |
| STU-06-AC4 | R3          | Signed-out/deactivated caller gets no data at reader/direct-table boundaries                                                   | Existing pgTAP + integration                                                                             | `ADM-03-AC7`, `AC15`        |
| STU-06-AC5 | R9          | Success, empty, hostile, and failure paths make no model call or `ai_usage` write                                              | Existing unit + database before/after                                                                    | `ADM-03-AC11`               |
| STU-06-AC6 | R7          | Empty result shows friendly status; dependency/malformed failure shows generic alert with no partial/raw error                 | **Student-specific gap:** component/E2E assertion required; shared reader unit covers typed failure only | ADM-03 UI contract          |
| STU-06-AC7 | R8          | At keyboard, 320px, 200% zoom, and both themes, max-bound multiline content, semantics, contrast, and navigation remain usable | **Student-specific gap:** browser + manual accessibility check required                                  | `SH-07`                     |
| STU-06-AC8 | R9, R10     | After unpublish, fresh Student read omits item without deletion or Student controls                                            | Existing live lifecycle/read evidence; focused dashboard assertion may reuse AC14 flow                   | `ADM-03-AC5`, `AC7`, `AC14` |

## Review evidence

- Approved source: ADM-03 at PR #38 head, approved by Johannsen on 2026-10-21.
- Implementation inspected: `9f71393245c755300dba5e47f1350f9ff09f8ff7`.
- Independent verification at that head reports ADM-03 AC1–AC15 covered and announcement browser tests
  passing. Tester noted a low-severity misleading AC12 label; sound inert-rendering evidence exists in a
  separate static component-source check.
- Joseph commented “Looks good!” on PR #38 on 2026-10-22. This is not recorded as approval of this later
  revised STU-06 digest.
- Human input: explicitly approve or request changes to the exact revised digest.

## Open questions blocking approval

No product question remains: ADM-03 resolves category, bounds, publication/lifecycle, RLS reads,
projection, ordering/cap, placement, rendering, and AI behavior. Approval awaits exact-digest teammate
review. Before claiming complete STU-06 verification, cover AC6/AC7 or record the limitation honestly.

## Change impact

- Old proposal: standalone route/nav; Student-only shared-reader guard; projection without ID and with
  `publishedAt`; combined 50-item cap; publication/lifecycle unresolved.
- New contract: dashboard card; shared active-user reader; bucketed `id/title/body/updatedAt`; all
  guidelines plus newest five announcements; direct RLS; approved ADM-03 bounds/lifecycle.
- Reason: approved ADM-03 is now authoritative and PR #38 supplies implementation evidence.
- Invalidated: prior STU-06 digest and planned AC1–AC12; no approved tests/code relied on them.
- Renewal: explicit teammate review of this digest; PR #38 retains its own merge gates.

## Change log

| Date       | Change                                                                                              | IDs affected                | Evidence invalidated       | By                     |
| ---------- | --------------------------------------------------------------------------------------------------- | --------------------------- | -------------------------- | ---------------------- |
| 2026-10-21 | Initial pre-ADM-03 draft                                                                            | R1–R10, NFR1–NFR4, AC1–AC12 | None                       | requirements_architect |
| 2026-10-22 | Aligned to approved ADM-03/open PR #38; removed obsolete proposals and deduplicated shared coverage | R1–R10, NFR1–NFR4, AC1–AC8  | Prior draft digest/AC plan | requirements_architect |
