# Workflow

How features move from request to production. Details are in the Developer Guide.

```
request → requirements_architect → spec + plan (draft) → human review → approved
        → developer → code + unit tests → tester_verifier + security_reviewer → findings
        → developer fix (maximum two review cycles) → human evidence review
        → pull request (human review, CI) → develop → master (human production approval)
```

| Path                                     | Purpose                                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------- |
| `INDEX.md`                               | Current feature status and navigation to canonical evidence                        |
| `specs/_TEMPLATE.md`                     | Template for every feature spec                                                    |
| `specs/{shared,student,lecturer,admin}/` | Specs, one file per feature, owned by the role owner                               |
| `agents/`                                | Coordinator procedure, prompts, and compatibility notes for native agents          |
| `handoffs/`                              | Current summaries, project setup records, and archived agent handoffs              |
| `reviews/`                               | Feature-grouped challenges, dispositions, and change-impact records                |
| `evaluation/`                            | Harmless fixtures and recorded results used to validate the agent workflow         |
| `policies/development-security.md`       | Agent action policy: automatic denies, review flags, and enforcement boundaries    |
| `hooks/`                                 | Tested PreToolUse and writer-role SubagentStop hook implementations                |
| `scripts/verify.mjs`                     | Shared local/CI verification entry point with truthful per-check results           |
| `scripts/review-sensitive-changes.mjs`   | Identifies paths that need independent review before merge                         |
| `templates/task-handoff.md`              | Structured final-message handoff checked at completion                             |
| `templates/specification-challenge.md`   | Findings and counterexamples from an independent or self-review spec challenge     |
| `templates/requirement-change-impact.md` | Traceable impact and approval renewal record for material requirement changes      |
| `examples/feature-specification/`        | Clearly non-authoritative examples of the feature-specification workflow           |
| `logs/hooks/`                            | Metadata-only local evidence; JSONL records are gitignored                         |
| `scripts/check-traceability.mjs`         | Links tests to acceptance criteria; run by CI                                      |
| `scripts/setup-github.sh`                | Creates the GitHub environments and secrets (one-off setup)                        |
| `scripts/setup-vercel-env.sh`            | Sets the Vercel Preview/Production variables (one-off setup)                       |
| `scripts/create-user.mjs`                | Creates a confirmed user with a role in the dev or prod project                    |
| `scripts/seed-sample-data.mjs`           | Adds fictional courses, slots, bookings and announcements for testers (rerunnable) |
| `notes/`                                 | Reference material, e.g. SoC LLM limits copied from the NUS-only documentation     |

Native Codex discovery files live in `.codex/config.toml`, `.codex/hooks.json`, `.codex/agents/*.toml`,
and `.codex/skills/*/SKILL.md`; they are outside `workflow/` because Codex discovers project-scoped
configuration there. Invoke the specification workflow with `$feature-specification`, for example:

```text
Use $feature-specification to turn this feature idea into a draft spec and challenge it. Do not implement it.
```

The skill uses the existing requirements-architect, review, approval, handoff, and traceability process;
it does not create a parallel approval mechanism or start implementation.

This is a project-scoped skill, not a global installation. It is available only from a checkout containing
`.codex/skills/feature-specification/`; start a fresh Codex session after adding or updating it so discovery
metadata reloads. Discovery in one local environment does not prove availability on another machine, and
the skill files must receive the same trust and review as other agent-control configuration.
See `workflow/agents/README.md` for effective permissions and invocation.
