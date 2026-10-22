# LEC-01 — Lecturer consultation availability

## Development summary

- Branch history: `feature/lecturer-consultation-availability`, later `branch-lecturer`.
- Scope: Lecturer-owned consultation slot creation, listing, editing, deletion, course assignment
  checks, overlap validation, Singapore-time handling, and safe mutation failures.
- The implementation was later merged into the development line and became the base for request
  decisions and completion work.
- Follow-up fixes recorded in the branch history include shared-schema alignment, form action typing,
  traceability test references, verification formatting, and conflict resolution with `develop`.

## Decisions and requirements recorded

- A Lecturer may use only actively assigned courses.
- Slot ownership is derived from the authenticated server session, not client input.
- Slot operations use server-side validation, RLS/authorization, and safe user-facing failures.
- Singapore time is the authoritative user-facing slot timezone.
- Active-booking edits/deletes require confirmation and notify affected students according to the approved
  availability contract.

## Verification and limits

- Git history confirms implementation and subsequent formatting/traceability work.
- Later local debugging found that the shared Student migration revoked authenticated table privileges;
  `e4a4e2c` restored the required Lecturer grants for courses, assignments, slots, and booking reads.
- Typecheck passed after the grant and server-action fixes on `branch-lecturer-fix`.
- Hosted deployment and production database behavior were not claimed as independently verified.

Generated summary verified against the current specification, seed data, migration history, and Git refs.
