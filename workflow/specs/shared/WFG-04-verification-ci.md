---
id: WFG-04
title: Shared verification and CI
owner: team
status: draft
---

# WFG-04: Shared verification and CI

## Acceptance criteria

- **WFG-04-AC1** One versioned entry point runs formatting, linting, types, application tests, traceability, workflow tests, and a maintained secret scanner.
- **WFG-04-AC2** The verifier reports actual per-check results and fails when a required check fails; missing prerequisites are blocked/not-run.
- **WFG-04-AC3** Local instructions and GitHub Actions use the same entry point.
- **WFG-04-AC4** PR CI has minimum permissions, pinned actions, no privileged untrusted-code trigger, and no production credentials.
- **WFG-04-AC5** Database and browser tests run with prerequisites or are truthfully reported blocked/not-run.

## Human review

- Reviewed commit/digest:
- Reviewer other than author:
- Decision: pending
