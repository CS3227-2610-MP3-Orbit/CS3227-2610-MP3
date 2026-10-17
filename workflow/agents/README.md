# Codex development-agent workflow

The main Codex session is the coordinator. The four native project agents are defined in
`.codex/agents/*.toml`; those TOML files are the single source of truth for role instructions.
Defining an agent makes it discoverable but does not run it. An agent runs only when the coordinator
explicitly assigns it a task.

## Agents

| Agent                    | May change                                            | Must not change                                           |
| ------------------------ | ----------------------------------------------------- | --------------------------------------------------------- |
| `requirements_architect` | Coordinator-approved specs, plans, handoffs           | Application code, tests, migrations, CI, approvals        |
| `developer`              | Assigned implementation paths and relevant unit tests | Specs, independent acceptance tests, unrelated files      |
| `tester_verifier`        | Assigned tests and handoff evidence                   | Application code, specs, migrations, CI/security settings |
| `security_reviewer`      | Nothing; report to coordinator                        | All repository files                                      |

The allowed paths above are instruction-enforced. Custom-agent files cannot create path-specific
filesystem permissions. All subagents inherit the parent session's sandbox, approval policy, model
provider, and MCP servers. `apps`, `plugins`, `memories`, and permission-request tools are disabled
for these agents by their native configuration; shell/file access remains available because every
role must inspect the repository and three roles may need bounded writes or test execution.

For a technically read-only security or verification run, start a separate parent session with
`codex --ask-for-approval never exec --sandbox read-only`. A custom agent instruction saying
“read-only” is otherwise a behavioral control, not a filesystem control. The no-child-delegation,
no-merge, no-deploy, retry, and role boundaries are also prompt rules. Human review, branch
protection, CODEOWNERS, CI, GitHub environments, and database/application authorization must enforce
the actual gates outside model output.

Project config disables live web search and login shells. Agent files disable common external
capabilities, but this setup cannot remove parent-configured MCP servers per child; agents are
therefore instructed not to send repository data externally. Start sensitive reviews with a parent
configuration that has no unneeded MCP servers.

## Coordinator procedure

1. Create a bounded task containing task and requirement IDs, exact spec version/commit, relevant
   context, allowed edit paths, prohibited actions, expected evidence, and retry limit.
2. Ask `requirements_architect` for draft specs and a separate plan. Obtain recorded human approval
   for every material decision before implementation.
3. Assign exactly one approved task to `developer`. Sequence overlapping writes or use `--worktree`;
   never let agents edit the same files concurrently.
4. After implementation, run `tester_verifier` and `security_reviewer`. They may run in parallel only
   because their work is independent and the security review is read-only.
5. Return concrete findings to `developer`. Run at most two automatic fix → verify/review cycles.
   Then stop and present unresolved issues to a human instead of looping or weakening requirements.
6. Present specs, handoffs, diff, commands, actual results, findings, limitations, and verified log
   summaries for human review before merge or release.

## Assignment envelope

Include this information in every coordinator prompt:

```text
Task ID:
Requirement / acceptance-criterion IDs:
Specification path and version/commit:
Human approval evidence (or "not yet approved"):
Relevant context files:
Allowed edit paths (exact):
Prohibited actions:
Expected artifacts and evidence:
Retry limit: at most two attempts for the same failed check
```

## Example invocations

These prompts invoke an already defined agent; editing a TOML file alone does not invoke it.

### Requirements architect

```text
Use the requirements_architect agent for TASK-STU-02 covering STU-02-AC1 through AC6.
Spec version: new draft based on PRODUCT-SPEC.md at <commit>.
Read: workflow/specs/PRODUCT-SPEC.md and workflow/specs/shared/SH-03-bookings.md.
Write only: workflow/specs/student/STU-02-manage-bookings.md,
workflow/specs/PLAN.md, and one workflow/handoffs note.
Do not implement code. Identify decisions requiring human approval and return the required evidence.
```

### Developer

```text
Use the developer agent for TASK-STU-02A covering STU-02-AC1 and STU-02-AC2.
Approved spec: workflow/specs/student/STU-02-manage-bookings.md at <commit>, approved by <name>.
Read the latest analyst/human handoff.
Write only: src/app/student/<paths>, src/features/student/<paths>, and named unit-test files.
Do not change specs, acceptance tests, shared code, migrations, CI, or deployment.
Run the listed checks and report actual results in the required format.
```

### Tester/verifier

```text
Use the tester_verifier agent for TASK-STU-02A-V covering STU-02-AC1 and STU-02-AC2.
Review the approved spec at <commit> and the developer handoff <path>.
Write only the named test files and a handoff; do not fix application code.
Exercise happy, boundary, ownership-substitution, conflict, and failure cases. Classify every check
passed, failed, blocked, or unexecuted and include reproduction evidence.
```

### Security reviewer

```text
Use the security_reviewer agent for TASK-STU-02A-S covering STU-02-AC1 and STU-02-AC2.
Parent sandbox: read-only. Review the approved spec, diff, auth/RLS path, agent handoffs, CI permissions,
and secret exposure risk. Do not modify files or use external tools. Report findings first and state
which restrictions were technically enforced versus instruction-only.
```

### Complete workflow

```text
Coordinate TASK-<ID> for requirements <IDs> using the four project agents. First have
requirements_architect draft the spec and plan, then stop for my approval. After I approve, invoke
developer for one bounded implementation. Then run tester_verifier and security_reviewer in parallel
only if their writes cannot overlap. Route findings through no more than two developer/review cycles.
Finish with the handoffs, actual command results, unresolved findings, and evidence I need to decide
whether to merge. Do not merge, deploy, approve specs, or let child agents delegate.
```

## Manual discovery and configuration checks

From the repository root:

```sh
codex --version
codex --strict-config doctor --summary
codex features list
```

Start a new Codex session after changing `.codex/agents/*.toml`. Ask it to list the four project
agents, then use a named agent in a bounded prompt. `/subagents` in the CLI shows active and completed
subagent threads. The validation fixture and recorded run are under `workflow/evaluation/`.
