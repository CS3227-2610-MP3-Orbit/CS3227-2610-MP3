#!/usr/bin/env node

import { evaluateHandoff, readHookInput, writeAudit } from "./lib.mjs";

let payload = { hook_event_name: "Stop" };
let decision;
try {
  payload = await readHookInput();
  decision = evaluateHandoff(payload);
} catch {
  decision = {
    result: "follow-up",
    ruleId: "DEV-HANDOFF-MISSING",
    reason:
      "Provide the structured handoff before stopping. Truthful blocked or incomplete outcomes are valid.",
    missing: ["valid hook input"],
  };
}

try {
  await writeAudit(payload, decision);
} catch {
  process.stderr.write("Hook audit write failed; the handoff decision is unchanged.\n");
}

if (decision.result === "follow-up") {
  process.stdout.write(
    `${JSON.stringify({
      decision: "block",
      reason: `${decision.reason} Missing: ${decision.missing.join(", ")}. Use workflow/templates/task-handoff.md.`,
    })}\n`,
  );
} else if (decision.result === "bounded-accept") {
  process.stdout.write(
    `${JSON.stringify({
      systemMessage: `${decision.reason} Missing: ${decision.missing.join(", ")}.`,
    })}\n`,
  );
}
