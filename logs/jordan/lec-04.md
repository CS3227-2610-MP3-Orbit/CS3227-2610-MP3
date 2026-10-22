# LEC-04 — Lecturer AI consultation briefing

## Feature scope

- Branch history: `feature/lecturer-ai-briefing-v3`, followed by `branch-lecturer-fix`.
- An active Lecturer can generate a briefing for one upcoming approved consultation they own.
- The briefing contains a consultation summary, grouped question themes, and preparation topics.
- Student email is excluded from the model input. Student-provided fields are wrapped as untrusted data.
- The shared `generateText()` gateway handles quota, timeout, provider failure, output validation, and
  safe typed failures. Generated briefings are stored for the owning Lecturer and saved history is shown.

## CI and implementation fixes

- Resolved the quota test/type mismatch by using the current shared daily quota shape.
- Corrected traceability/format checks and the raw-color violation by using `text-muted-foreground`.
- Added Supabase reset before admin E2E tests and fixed a seeded-admin UUID collision that hid
  `demo-admin@localhost.test`.
- Fixed Next.js Server/Client boundary errors by removing inline form actions and introducing dedicated
  server-action entry points.
- Briefing submission now redirects with a visible success or safe error status instead of silently
  discarding the action result.
- Direct profile/course reads were replaced with the authorized `list_staff_consultations` projection,
  because RLS blocked the original briefing lookup even though the consultation list could display it.

## Provider troubleshooting

- The local briefing initially returned “temporarily unavailable” because the environment used
  `SOC_LLM_*`, then `SOCLASS_*`, while the code expects `SOCLAAS_BASE_URL`, `SOCLAAS_API_KEY`, and
  `SOCLAAS_MODEL`.
- After correcting the exact variable names and restarting Next.js, the local SoC LLM request succeeded.
- No API key, prompt, private consultation content, or provider response is stored in this log.

## Evidence

- Focused AI briefing tests: 2/2 passed.
- Typecheck passed after the final server-action/projection changes.
- Local browser flow reached successful briefing generation after provider configuration was corrected.
- Hosted CI/provider/release verification remains separate and was not inferred from local success.

Generated summary verified against the conversation, current LEC-04 spec, implementation commits, and local
verification output.
