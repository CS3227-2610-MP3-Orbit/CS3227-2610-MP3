---
id: WFG-02
title: Development approval gates
owner: team
status: draft
---

# WFG-02: Development approval gates

## Acceptance criteria

- **WFG-02-AC1** A named independent teammate approves a feature spec at a reviewed commit/digest; material requirement changes invalidate approval.
- **WFG-02-AC2** Auth/authz, agent controls, CI/deploy, migrations, and destructive operations are identified as sensitive and reviewed before merge/use.
- **WFG-02-AC3** Prepared `master` protection requires a PR, independent approval, required CI, stale-review dismissal, and restricted pushes/bypasses where supported.
- **WFG-02-AC4** Production runs only from `master` through a reviewed environment whose credentials are absent from PR and coding-agent sessions.
- **WFG-02-AC5** Each gate documents trigger, approver, evidence, enforcement, invalidation, and bypass/limitation.
- **WFG-02-AC6** Editable files and model output are evidence only, not an enforced human approval boundary.

## Human review

- Reviewed commit/digest:
- Reviewer other than author:
- Decision: pending
