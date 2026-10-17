#!/usr/bin/env node

import { evaluatePreToolUse, readHookInput, writeAudit } from "./lib.mjs";

function hookOutput(decision) {
  if (decision.result === "deny") {
    return {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: decision.reason,
      },
    };
  }
  if (decision.result === "review") {
    return {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        additionalContext: decision.reason,
      },
      systemMessage: decision.reason,
    };
  }
  return null;
}

let payload = { hook_event_name: "PreToolUse" };
let decision;
try {
  payload = await readHookInput();
  decision = evaluatePreToolUse(payload);
} catch {
  decision = {
    result: "deny",
    ruleId: "DEV-HOOK-INPUT",
    reason: "Malformed or unsupported hook input was denied.",
  };
}

try {
  await writeAudit(payload, decision);
} catch {
  process.stderr.write("Hook audit write failed; the policy decision is unchanged.\n");
}

const output = hookOutput(decision);
if (output) process.stdout.write(`${JSON.stringify(output)}\n`);
