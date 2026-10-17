# Local hook audit log

The hooks append metadata-only JSON lines to `audit.jsonl`. That file is gitignored. Records contain
the time, event, rule, result, a fixed or sanitized reason, and available task/session identifiers.
They do not contain prompts, private notes, environment values, transcripts, or raw tool arguments.

These locally writable records are useful development evidence, not tamper-proof audit logs. CI or a
centrally protected log is needed if the project later requires an authoritative record.
