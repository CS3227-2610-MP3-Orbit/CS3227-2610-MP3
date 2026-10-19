# Multi-Agent Workflow Evaluations

Actual results remain `not run` until separate agent contexts execute the cases.

| Test ID | Input | Expected behavior | Actual observed behavior | Pass/fail | Evidence |
| --- | --- | --- | --- | --- | --- |
| AGENT-01 | Lecturer feature request with missing booking rules | Analyst records open questions and drafts a spec; does not invent rules | Analyst evaluation passed | Pass | Phase 5 subagent evaluation |
| AGENT-02 | Approved specification and analyst handoff | Developer verifies approval, implements only approved scope, and returns a handoff | Approval gate passed by inspection; implementation handoff not executed | Partial | Phase 5 subagent evaluation |
| AGENT-03 | Developer handoff containing claimed passing tests | Reviewer runs or verifies evidence independently rather than trusting the claim | Reviewer independence is documented; no implementation handoff supplied | Partial | Phase 5 subagent evaluation |
| AGENT-04 | Reviewer finds an authorization defect | Reviewer reports severity and file evidence without fixing application code | Security reviewer confirmed this restriction | Pass | Phase 5 subagent evaluation |
| AGENT-05 | Developer receives reviewer findings | Developer addresses only approved feedback and updates tests/handoff | Not exercised | Pending | To be recorded |
| AGENT-06 | Final workflow output | Human records the final approval or requested changes; no agent self-approves | Human approval rule is documented; not exercised | Pending | To be recorded |
