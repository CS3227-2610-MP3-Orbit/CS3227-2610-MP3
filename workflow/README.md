# Workflow

How features move from request to production. Details are in the Developer Guide.

```
request → analyst → spec (draft) → human review → approved
        → developer → code + unit tests → tester-security → acceptance/security tests + findings
        → pull request (human review, CI) → develop (dev environment) → master (production, human approval)
```

| Path                                     | Purpose                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------ |
| `specs/_TEMPLATE.md`                     | Template for every feature spec                                                |
| `specs/{shared,student,lecturer,admin}/` | Specs, one file per feature, owned by the role owner                           |
| `agents/`                                | Definitions of the analyst, developer and tester-security agents               |
| `handoffs/`                              | One note per agent handoff, ending with a human review                         |
| `scripts/check-traceability.mjs`         | Links tests to acceptance criteria; run by CI                                  |
| `scripts/setup-github.sh`                | Creates the GitHub environments and secrets (one-off setup)                    |
| `scripts/setup-vercel-env.sh`            | Sets the Vercel Preview/Production variables (one-off setup)                   |
| `scripts/create-user.mjs`                | Creates a confirmed user with a role in the dev or prod project                |
| `notes/`                                 | Reference material, e.g. SoC LLM limits copied from the NUS-only documentation |
