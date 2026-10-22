# LEC-02 — Lecturer consultation request decisions

## Specification and decisions

- Branch history: `feature/lecturer-request-decisions`.
- Scope: active owning Lecturers review pending requests and approve or reject them atomically.
- Rejection reasons were confirmed as a controlled list: `Schedule unavailable`, `Insufficient
information`, `Course mismatch`, `Feeling Unwell`, and `Family emergency`.
- Students can see the selected rejection reason.
- Decisions are allowed until the consultation starts; terminal history is retained.
- Notifications are in-app only, with safe generic user-facing failure messages.
- Audit records contain booking ID, actor ID, decision, timestamp, and operation ID only; consultation
  text is not logged.
- Administrator request access/management was discussed in the original decision set, but the current
  LEC-02 document remains `draft`; its exact approval state must follow the repository spec status.

## Branch and verification history

- The branch includes the request-decision implementation, develop merges, traceability/verification
  corrections, and a duplicate-notification migration fix.
- The current repository records no claim here that every LEC-02 acceptance criterion has a final live
  E2E verification result.

Generated summary checked against `LEC-02-request-decisions.md` and the retained remote branch history.
