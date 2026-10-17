# Workflow

How features move from request to production. Details are in the Developer Guide.

```
request → requirements_architect → spec + plan (draft) → human review → approved
        → developer → code + unit tests → tester_verifier + security_reviewer → findings
        → developer fix (maximum two review cycles) → human evidence review
        → pull request (human review, CI) → develop → master (human production approval)
```

| Path                                     | Purpose                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------ |
| `specs/_TEMPLATE.md`                     | Template for every feature spec                                                |
| `specs/{shared,student,lecturer,admin}/` | Specs, one file per feature, owned by the role owner                           |
| `agents/`                                | Coordinator procedure, prompts, and compatibility notes for native agents      |
| `handoffs/`                              | One note per agent handoff, ending with a human review                         |
| `evaluation/`                            | Harmless fixtures and recorded results used to validate the agent workflow      |
| `scripts/check-traceability.mjs`         | Links tests to acceptance criteria; run by CI                                  |
| `scripts/setup-github.sh`                | Creates the GitHub environments and secrets (one-off setup)                    |
| `scripts/setup-vercel-env.sh`            | Sets the Vercel Preview/Production variables (one-off setup)                   |
| `scripts/create-user.mjs`                | Creates a confirmed user with a role in the dev or prod project                |
| `notes/`                                 | Reference material, e.g. SoC LLM limits copied from the NUS-only documentation |

Native Codex discovery files live in `.codex/config.toml` and `.codex/agents/*.toml`; they are
outside `workflow/` because Codex only auto-discovers project-scoped agent configuration there.
See `workflow/agents/README.md` for effective permissions and invocation.
