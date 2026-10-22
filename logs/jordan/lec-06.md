# LEC-06 — Lecturer authorization and AI security

## Specification status

- The current repository marks `LEC-06-authorization-ai-security.md` as `draft`.
- The recorded decisions cover no Administrator Lecturer-dashboard access, safe category/correlation
  logging without prompts/secrets/generated content, existing shared input/output/quota/timeout limits,
  and CI controls for authorization, ownership/RLS, prompt injection, output safety, quota, failure, and
  traceability.

## Security implementation history

- Lecturer routes and Server Actions use server-side role checks and derive identity from the session.
- The AI briefing uses the shared gateway, untrusted-data wrapper, input/output limits, timeout handling,
  quota accounting, and plain-text output handling.
- `fix/lecturer-data-access` added role-checked Lecturer data-access functions, lock/serialization failure
  handling, and admin/signed-out coverage.
- `branch-lecturer-fix` corrected the remaining direct-RLS lookup and form-action boundary problems.

## Verification boundary

- Focused typecheck and AI tests passed locally.
- Security-sensitive hosted configuration, live CI evidence, and production release review were not claimed
  as complete.
- The draft status must remain visible until the repository’s approval process records formal approval.

Generated summary verified against the current LEC-06 document, branch history, and recorded fixes.
