# Reflections

## AI Security

## Spec-Driven Development

One important lesson was that a specification created at the start of a feature should be treated as a draft rather than a complete definition of the requirements. As development progressed, we identified details that needed to be made explicit, including edge cases, ownership and permission rules, booking states, deadlines, notification behaviour, error handling, and administrator access. Asking these clarification questions helped turn broad feature descriptions into requirements that could be implemented and tested consistently. In future, we will distinguish clearly between initial assumptions and approved decisions, and review unresolved questions before implementation begins.

## Basic Multi-Agent SE

The multi-agent workflow also showed the value of structured handoffs. The Analyst's initial output provided a useful starting point, but the Developer needed the additional decisions and assumptions recorded in the specification before implementation could proceed safely. This reinforced that agent handoffs should preserve not only the feature request, but also acceptance criteria, unresolved questions, human decisions, and evidence from verification.
