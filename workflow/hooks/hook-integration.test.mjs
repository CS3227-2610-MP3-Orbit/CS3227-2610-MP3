import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

function invoke(script, input) {
  return spawnSync(process.execPath, [script], {
    input: typeof input === "string" ? input : JSON.stringify(input),
    encoding: "utf8",
    timeout: 4_000,
  });
}

describe("project hook integration", () => {
  it("[WFG-05-AC2] registers supported PreToolUse and SubagentStop command hooks", () => {
    const config = JSON.parse(readFileSync(".codex/hooks.json", "utf8"));
    expect(config.hooks.PreToolUse[0].hooks[0].command).toContain(
      "workflow/hooks/pre-tool-use.mjs",
    );
    expect(config.hooks.SubagentStop[0].hooks[0].command).toContain(
      "workflow/hooks/stop-handoff.mjs",
    );
    expect(config.hooks.Stop).toBeUndefined();
  });

  it("[WFG-05-AC2] invokes the pre-action executable and receives a native deny shape", () => {
    const event = JSON.parse(
      readFileSync("workflow/evaluation/guardrails/fixtures/prohibited-pretool.json", "utf8"),
    );
    const result = invoke("workflow/hooks/pre-tool-use.mjs", event);
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny" },
    });
  });

  it("[WFG-03-AC5] makes malformed executable input a valid denial, without echoing it", () => {
    const malformed = '{"token":"fixture-not-a-secret"';
    const result = invoke("workflow/hooks/pre-tool-use.mjs", malformed);
    expect(result.status).toBe(0);
    expect(result.stdout).not.toContain("fixture-not-a-secret");
    expect(JSON.parse(result.stdout).hookSpecificOutput.permissionDecision).toBe("deny");
  });
});
