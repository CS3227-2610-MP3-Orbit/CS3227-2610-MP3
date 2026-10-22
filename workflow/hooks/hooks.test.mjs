import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  evaluateHandoff,
  evaluatePreToolUse,
  inspectPatch,
  inspectShell,
  writeAudit,
} from "./lib.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));

function bash(command) {
  return {
    hook_event_name: "PreToolUse",
    session_id: "synthetic-session",
    turn_id: "synthetic-turn",
    tool_name: "Bash",
    tool_input: { command },
  };
}

const completeHandoff = `# Task handoff

Outcome: complete
Task ID: TASK-HOOK-01
Requirement IDs: HOOK-AC1, HOOK-AC2

## Changed files
- workflow/hooks/lib.mjs: added policy checks.

## Checks run and actual results
- npm run test:hooks: passed, 12 tests.

## Checks not run and reasons
- None — all planned hook checks ran.

## Unresolved issues
- Native behavior evaluation has not run.

## Next action
- A teammate reviews and trusts the hook definition.
`;

test("[WFG-03-AC1] normal local test command is allowed", () => {
  assert.equal(evaluatePreToolUse(bash("npm test")).result, "allow");
});

test("[WFG-03-AC2] force-push variants are denied without executing them", () => {
  for (const command of [
    "git push --force origin feature",
    "git -C . push origin feature -f",
    "env SAFE=1 /usr/bin/git push --force-with-lease",
    "git push origin +feature:feature",
    'bash -c "git push --force-if-includes origin feature"',
  ]) {
    assert.equal(inspectShell(command).ruleId, "DEV-DENY-FORCE-PUSH", command);
  }
});

test("[WFG-03-AC2] destructive history reset is denied", () => {
  assert.equal(inspectShell("git reset --hard HEAD~1").ruleId, "DEV-DENY-HISTORY-RESET");
});

test("[WFG-03-AC2] destructive working-tree operations are denied", () => {
  for (const command of [
    "git clean -df",
    "git checkout -- src",
    "git restore src",
    "git branch -D old",
  ]) {
    assert.equal(inspectShell(command).ruleId, "DEV-DENY-DESTRUCTIVE-GIT", command);
  }
});

test("[WFG-03-AC2] recognized direct production deployment forms are denied", () => {
  for (const command of [
    "vercel deploy --prod",
    "npx vercel deploy --prod",
    "npm run deploy:production",
    "pnpm exec supabase db push",
    "pnpm deploy -- --environment production",
    "supabase db push",
  ]) {
    assert.equal(inspectShell(command).ruleId, "DEV-DENY-PROD-DEPLOY", command);
  }
});

test("dynamic shell construction documents an intentional parsing limitation", () => {
  assert.equal(inspectShell('ACTION=push; git "$ACTION" --force').result, "allow");
});

test("review-sensitive file edits are flagged but not denied", () => {
  const patch =
    "*** Begin Patch\n*** Update File: src/lib/auth/session.ts\n@@\n-old\n+new\n*** End Patch";
  assert.equal(inspectPatch(patch).result, "review");
});

test("[WFG-02-AC2] Claude Code agent and settings edits are flagged like Codex controls", () => {
  for (const file of [
    "CLAUDE.md",
    ".claude/agents/developer.md",
    ".claude/settings.json",
    ".codex/config.toml",
  ]) {
    const patch = `*** Begin Patch\n*** Update File: ${file}\n@@\n-old\n+new\n*** End Patch`;
    assert.equal(inspectPatch(patch).result, "review", file);
  }
});

test("[WFG-03-AC5] malformed tool input receives an explicit deny decision", () => {
  const decision = evaluatePreToolUse({ hook_event_name: "PreToolUse", tool_name: "Bash" });
  assert.deepEqual(
    { result: decision.result, ruleId: decision.ruleId },
    { result: "deny", ruleId: "DEV-HOOK-INPUT" },
  );
});

test("[WFG-03-AC5] malformed JSON at the executable boundary emits a valid deny response", async () => {
  const temp = await mkdtemp(path.join(tmpdir(), "cs3227-hook-test-"));
  const result = spawnSync(process.execPath, [path.join(directory, "pre-tool-use.mjs")], {
    input: "{not-json",
    encoding: "utf8",
    env: { ...process.env, CS3227_HOOK_AUDIT_PATH: path.join(temp, "audit.jsonl") },
  });
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).hookSpecificOutput.permissionDecision, "deny");
});

test("[WFG-03-AC5] audit sink failure does not corrupt the deny response", async () => {
  const temp = await mkdtemp(path.join(tmpdir(), "cs3227-hook-test-"));
  const result = spawnSync(process.execPath, [path.join(directory, "pre-tool-use.mjs")], {
    input: JSON.stringify(bash("git push --force")),
    encoding: "utf8",
    env: { ...process.env, CS3227_HOOK_AUDIT_PATH: temp },
  });
  assert.equal(result.status, 0);
  assert.match(result.stderr, /audit write failed/i);
  assert.equal(JSON.parse(result.stdout).hookSpecificOutput.permissionDecision, "deny");
});

test("[WFG-03-AC3] complete handoff is accepted", () => {
  assert.equal(evaluateHandoff({ last_assistant_message: completeHandoff }).result, "accept");
});

test("[WFG-03-AC3] missing handoff triggers one bounded follow-up", () => {
  const first = evaluateHandoff({ last_assistant_message: "Done.", stop_hook_active: false });
  const second = evaluateHandoff({ last_assistant_message: "Done.", stop_hook_active: true });
  assert.equal(first.result, "follow-up");
  assert.equal(second.result, "bounded-accept");
});

test("[WFG-03-AC4] truthful blocked outcome is accepted", () => {
  const blocked = completeHandoff
    .replace("Outcome: complete", "Outcome: blocked")
    .replace("Native behavior evaluation has not run.", "Blocked by unavailable local Supabase.");
  assert.equal(evaluateHandoff({ last_assistant_message: blocked }).result, "accept");
});

test("[WFG-03-AC3] a persistent structured handoff is accepted", () => {
  const decision = evaluateHandoff({
    cwd: process.cwd(),
    last_assistant_message:
      "Handoff evidence: workflow/handoffs/project-setup/2026-10-17-development-hooks-coordinator.md",
  });
  assert.equal(decision.result, "accept");
});

test("[WFG-03-AC6] audit log redacts sensitive-looking values and omits raw arguments", async () => {
  const temp = await mkdtemp(path.join(tmpdir(), "cs3227-hook-test-"));
  const auditPath = path.join(temp, "audit.jsonl");
  await writeAudit(
    {
      hook_event_name: "PreToolUse",
      session_id: "synthetic-session",
      turn_id: "synthetic-turn",
      tool_input: { command: "never-log-this-command" },
    },
    {
      result: "deny",
      ruleId: "DEV-TEST",
      reason: "SOC_LLM_API_KEY=fixture-secret Bearer fixture-token",
    },
    { auditPath },
  );
  const text = await readFile(auditPath, "utf8");
  assert.doesNotMatch(text, /fixture-secret|fixture-token|never-log-this-command/);
  assert.match(text, /\[REDACTED\]/);
});
