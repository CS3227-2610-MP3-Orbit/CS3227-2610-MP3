# Reflections

## AI Security

Using an external LLM gateway highlighted that secrets must be protected throughout the
development process, not only in Git. The local environment file was ignored and was not pushed
to GitHub, but an API key was still exposed while discussing the configuration. This showed that
ignoring a file prevents accidental commits but does not prevent exposure through chat messages,
screenshots, terminal output, logs, or copied configuration. The correct response is to treat an
exposed key as compromised, revoke it, issue a replacement, and update local or CI secrets without
sharing the replacement. We also learned to minimise the data sent to the model, wrap untrusted
student content, and test prompt-injection handling explicitly.

## Spec-Driven Development

One important lesson was that a specification created at the start of a feature should be treated as a draft rather than a complete definition of the requirements. As development progressed, we identified details that needed to be made explicit, including edge cases, ownership and permission rules, booking states, deadlines, notification behaviour, error handling, and administrator access. Asking these clarification questions helped turn broad feature descriptions into requirements that could be implemented and tested consistently. In future, we will distinguish clearly between initial assumptions and approved decisions, and review unresolved questions before implementation begins.

## Basic Multi-Agent SE

The multi-agent workflow also showed the value of structured handoffs. The Analyst's initial output provided a useful starting point, but the Developer needed the additional decisions and assumptions recorded in the specification before implementation could proceed safely. This reinforced that agent handoffs should preserve not only the feature request, but also acceptance criteria, unresolved questions, human decisions, and evidence from verification.

Independent verification was useful because implementation and review answer different questions:
the Developer builds against the approved scope, while the Tester/Security Reviewer looks for
missing tests, authorization gaps, privacy issues, and unsafe assumptions. However, the workflow
does not replace human judgement. Configuration files and agent reports alone are not proof that a
gate worked; the team must inspect actual command results, CI checks, and unresolved findings.
