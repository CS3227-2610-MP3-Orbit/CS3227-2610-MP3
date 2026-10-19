# Handoff: AGENT-SETUP-01 — coordinator → human reviewers

<!-- HANDOFF:BEGIN -->

{
"schemaVersion": 1,
"taskId": "AGENT-SETUP-01",
"requirementIds": ["VAL-01-AC1", "VAL-01-AC2"],
"status": "incomplete",
"changedFiles": [
".codex/config.toml",
".codex/agents/",
"workflow/agents/",
"workflow/evaluation/",
"logs/agent-setup/2026-10-17-summary.md"
],
"verification": [
{
"check": "codex --strict-config doctor --summary",
"result": "passed",
"evidence": "21 checks passed and configuration loaded with one environment warning"
},
{
"check": "native non-interactive agent run",
"result": "blocked",
"evidence": "nested session did not produce native role reports"
}
],
"unresolvedIssues": [
"Native custom-agent discovery still required interactive verification at this handoff.",
"Path and child-delegation limits were instruction-only rather than sandbox-enforced."
]
}

<!-- HANDOFF:END -->

- Date: 2026-10-17
- Task ID: AGENT-SETUP-01
- Requirement IDs: specialized-agent setup request; fixture criteria VAL-01-AC1 and VAL-01-AC2
- Specification version or commit: user request received 2026-10-17; working tree not committed
- Specification status and human approver: setup requested by user; agent-generated files need review
- Relevant context files: `AGENTS.md`, `.codex/`, `workflow/`, `docs/DeveloperGuide.md`
- Allowed edit scope: native agent configuration, workflow/docs, isolated evaluation fixture, log summary
- Agent session log: `logs/agent-setup/2026-10-17-summary.md`

## Decisions and assumptions

- Used standalone project agent TOMLs supported by installed Codex instead of inventing per-role
  sandbox or approval fields.
- Limited concurrency to two so independent tester/security reviews can run together.
- Kept live role instructions only in `.codex/agents`; legacy workflow role files are pointers.
- Recorded read-only/path/no-delegation restrictions as instruction-only where Codex cannot enforce
  them per child.

## Changes

- Added `.codex/config.toml` and four `.codex/agents/*.toml` definitions.
- Added coordinator documentation, updated handoff template and project/developer documentation.
- Added isolated validation fixture, actual results, and verified interaction summary.
- No application feature, deployment, production credential, database, `src/`, `supabase/`, or
  `.github/` file was changed.

## Evidence

| Command or check                                          | Result                              | Evidence                                        |
| --------------------------------------------------------- | ----------------------------------- | ----------------------------------------------- |
| `codex --version`                                         | passed                              | `codex-cli 0.154.0-alpha.6.2`                   |
| `codex --strict-config doctor --summary` with normal TERM | passed with one environment warning | 21 ok, 0 fail; config loaded                    |
| Fixture baseline                                          | passed but incomplete by design     | One AC2 test passed; AC1 absent                 |
| Native non-interactive agent run                          | incomplete                          | No native role reports; nested sessions blocked |
| Orchestrator tester/security role run                     | failed fixture as expected          | Both found defect, missing test, and injection  |
| `npm run check:spec`                                      | passed with draft warnings          | 6 specs, 41 criteria, 5 covered                 |
| `git diff --check`                                        | passed                              | No whitespace errors at interim check           |

## Changes outside the owner's area

- `AGENTS.md` and `docs/DeveloperGuide.md` were updated because they are the natural project-wide
  instruction and developer-documentation locations.
- `.codex/` is required for native Codex discovery.

## Findings and open questions

| #   | Severity | Finding                                                                           | Status                                              |
| --- | -------- | --------------------------------------------------------------------------------- | --------------------------------------------------- |
| 1   | Medium   | Native custom-agent invocation was unavailable in the tested non-interactive run. | Open; verify interactively                          |
| 2   | High     | Read-only sandbox allowed reads outside fixture; prompt scope was exceeded.       | Open; use isolated environment for sensitive review |
| 3   | Medium   | Path limits and no-child-delegation are instruction-only per agent.               | Documented limitation                               |
| 4   | Medium   | External GitHub approval/branch/secret controls were not verified locally.        | Open; human/platform check                          |

## Next action

A human should review the four role instructions and run the documented interactive discovery check.
Do not approve the workflow as fully runtime-verified until the four names appear and a named agent can
be inspected under `/subagents`.

## Human review

- Reviewed by:
- Decision: approved / changes requested
- Notes:
