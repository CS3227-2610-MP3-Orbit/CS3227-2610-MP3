# Handoff: LEC-05 dashboard — analyst → coordinator/developer

<!-- HANDOFF:BEGIN -->
{
  "schemaVersion": 1,
  "taskId": "LEC-05-dashboard",
  "requirementIds": ["LEC-05-R1", "LEC-05-R2", "LEC-05-R3", "LEC-05-R4", "LEC-05-R5", "LEC-05-R6", "LEC-05-AC1", "LEC-05-AC12"],
  "status": "blocked",
  "changedFiles": ["workflow/specs/lecturer/LEC-05-lecturer-dashboard.md", "workflow/handoffs/analyst-to-developer-lec-05-dashboard.md"],
  "verification": [
    {
      "check": "Repository inspection",
      "result": "passed",
      "evidence": "Inspected AGENTS.md, specification/template files, shared specifications, Lecturer page, consultation server/validation, request server, and relevant migrations."
    },
    {
      "check": "Application/migration/test modification guardrail",
      "result": "passed",
      "evidence": "Only the draft specification and handoff were added; no application code, migration, or test was modified."
    },
    {
      "check": "Human approval gate",
      "result": "blocked",
      "evidence": "The specification remains status=draft and implementation is not authorized until the open questions and scope are approved by a human."
    }
  ],
  "unresolvedIssues": [
    "LEC-05 identifier collides with existing workflow/specs/lecturer/LEC-05-authorization-ai-security.md",
    "Whether unbooked slots appear",
    "Default date range and result bound/pagination",
    "Default/history visibility for rejected and cancelled records",
    "Administrator access policy",
    "Whether decision controls belong in dashboard blocks",
    "Whether course name is also required beside module code"
  ]
}
<!-- HANDOFF:END -->

- Date: 2026-10-20
- Task ID: LEC-05-dashboard
- Requirement / acceptance-criterion IDs: `LEC-05-R1`–`R6`; `LEC-05-AC1`–`AC12`
- Specification: `workflow/specs/lecturer/LEC-05-lecturer-dashboard.md`
- Specification version or commit: working-tree draft; no commit assigned
- Specification status and human approver: `draft`; no human approver yet
- Relevant context files: `src/app/lecturer/page.tsx`, `src/features/lecturer/consultations/server.ts`, `src/features/lecturer/consultations/validation.ts`, `src/features/lecturer/requests-server.ts`, `src/components/consultation-list.tsx`, `workflow/specs/shared/SH-01-foundation.md`, `workflow/specs/shared/SH-03-slots-bookings-and-availability.md`, `workflow/specs/shared/SH-05-slot-and-booking-mutations.md`, `workflow/specs/INTEGRATION-SPEC.md`
- Allowed edit scope: specification and handoff only during analysis; after human approval, developer scope must be explicitly confirmed.
- Agent session log: no separate session log created; this handoff records the repository inspection evidence.

## Decisions and assumptions

### Confirmed from the request

- The Lecturer needs a general dashboard with date/time blocks.
- Each block should show student name, topic, module/course code, and status.
- Pending and confirmed/approved states must be visually distinguishable.
- The screenshot is a visual reference, not an exact design requirement.

### Working assumptions requiring approval

- The first version is a responsive chronological list/timeline, not a full weekly calendar.
- The dashboard is read-only and reuses existing consultation/request decision workflows.
- Singapore time is used for human-readable dates/times.
- No AI or schema migration is needed for the read-only projection unless a later approved inspection proves otherwise.

## Existing behavior inspected

- `src/app/lecturer/page.tsx` currently renders separate slot, saved-briefing, active/past consultation, and pending-request sections.
- `list_staff_consultations` already returns owned Lecturer consultation projections and derives `upcoming`, `ongoing`, and `completed` for approved bookings.
- `ConsultationList` already displays course code, topic, time, student name/email, questions, course name, rejection reason, and an AI briefing action for upcoming items.
- `list_lecturer_requests` separately returns pending requests for decision controls.
- Existing consultation RPCs and policies scope Lecturer reads to `auth.uid()` and active course assignment, but the proposed dashboard contract must preserve and test those boundaries.

## Findings and open questions

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| 1 | high | `LEC-05` is already assigned to the authorization/AI security specification. | Human decision required before approval | 
| 2 | medium | Existing consultation data includes student email/questions, while the dashboard request only requires name/topic/module code/status. | Proposed least-data projection; human confirmation required |
| 3 | medium | The existing page has separate lists rather than a consolidated date/time block dashboard. | Proposed UI change; no code changed |
| 4 | medium | The repository does not define dashboard date horizon, maximum rows, pagination, or unbooked-slot visibility. | Open question |

## Evidence

| Command or check | Result | Evidence |
| --- | --- | --- |
| Read consultation-spec skill | passed | Guardrails require repository inspection, stable Given/When/Then criteria, explicit open questions, and draft status. |
| Read repository rules/template/shared specs | passed | `AGENTS.md`, `_TEMPLATE.md`, `SH-01`, `SH-03`, `SH-05`, and `INT-01` inspected. |
| Inspect current Lecturer implementation | passed | Lecturer page, consultation list/server/validation, request server/actions, and relevant migrations inspected. |
| Application tests | unexecuted | Analysis task did not authorize implementation or test changes. |
| Database/E2E verification | unexecuted | Analysis task did not authorize implementation or test changes. |

## Changes outside the owner's area

None. No `src/lib/`, `supabase/migrations/`, or CI files were changed.

## Next action

Human reviews `LEC-05-lecturer-dashboard.md`, resolves the identifier collision and open questions, and
approves the scope. Only then should the Developer Agent derive tests and implementation tasks from the
approved specification.

## Human review

- Reviewed by: pending
- Decision: changes requested / pending
- Notes: This handoff is not approval and must not be treated as implementation authorization.
