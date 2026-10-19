# Compatibility note: tester-security

The former combined role is now split for independence:

- `.codex/agents/tester_verifier.toml` owns executable acceptance, boundary, failure, and security tests.
- `.codex/agents/security_reviewer.toml` performs a read-oriented application and workflow review.

Use `workflow/agents/README.md` for coordinator prompts and the review/fix loop. This file remains only
so older logs and documentation links do not break; do not duplicate live instructions here.
