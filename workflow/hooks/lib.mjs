import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { extractHandoffPath, validateHandoffFile } from "../scripts/lib/handoff.mjs";

const MAX_INPUT_BYTES = 1024 * 1024;
const hookDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultAuditPath = path.resolve(hookDirectory, "../logs/hooks/audit.jsonl");

const fixedReasons = {
  malformed: "Malformed or unsupported hook input was denied.",
  forcePush: "Force-pushes are prohibited for coding agents.",
  historyReset: "Destructive Git history resets are prohibited for coding agents.",
  destructiveGit: "Destructive Git working-tree operations are prohibited for coding agents.",
  productionDeploy: "Direct production deployment is prohibited for coding agents.",
  review: "This change touches a review-required control; obtain teammate review before merge.",
};

export function sanitizeText(value) {
  return String(value ?? "")
    .replace(/\b(Bearer)\s+[^\s,;]+/gi, "$1 [REDACTED]")
    .replace(
      /\b([A-Z][A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|KEY|CREDENTIAL)[A-Z0-9_]*)\s*[:=]\s*([^\s,;]+)/gi,
      "$1=[REDACTED]",
    )
    .replace(/\b(?:sk|pk|ghp|glpat)_[A-Za-z0-9_-]{8,}\b/g, "[REDACTED]")
    .slice(0, 240);
}

function safeIdentifier(value) {
  if (typeof value !== "string") return null;
  return value.replace(/[^A-Za-z0-9_.:/-]/g, "_").slice(0, 100) || null;
}

export async function writeAudit(payload, decision, options = {}) {
  const auditPath = options.auditPath ?? process.env.CS3227_HOOK_AUDIT_PATH ?? defaultAuditPath;
  const record = {
    timestamp: new Date().toISOString(),
    eventType: safeIdentifier(payload?.hook_event_name) ?? "unknown",
    ruleId: safeIdentifier(decision.ruleId) ?? "DEV-HOOK-UNKNOWN",
    result: safeIdentifier(decision.result) ?? "error",
    reason: sanitizeText(decision.reason),
    taskId: safeIdentifier(decision.taskId),
    sessionId: safeIdentifier(payload?.session_id),
    turnId: safeIdentifier(payload?.turn_id),
  };

  await mkdir(path.dirname(auditPath), { recursive: true });
  await appendFile(auditPath, `${JSON.stringify(record)}\n`, { encoding: "utf8", mode: 0o600 });
}

export async function readHookInput(stream = process.stdin) {
  const chunks = [];
  let length = 0;
  for await (const chunk of stream) {
    length += Buffer.byteLength(chunk);
    if (length > MAX_INPUT_BYTES) throw new Error("input-too-large");
    chunks.push(chunk);
  }
  const raw = chunks.join("");
  if (!raw.trim()) throw new Error("empty-input");
  const value = JSON.parse(raw);
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("invalid-object");
  return value;
}

export function tokenizeShell(command) {
  const tokens = [];
  let token = "";
  let quote = null;
  let escaped = false;

  const flush = () => {
    if (token) tokens.push(token);
    token = "";
  };

  for (let index = 0; index < command.length; index += 1) {
    const character = command[index];
    const next = command[index + 1];

    if (escaped) {
      token += character;
      escaped = false;
      continue;
    }
    if (character === "\\" && quote !== "'") {
      escaped = true;
      continue;
    }
    if (quote) {
      if (character === quote) quote = null;
      else token += character;
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
      continue;
    }
    if (character === "\n" || character === ";" || character === "|") {
      flush();
      if ((character === "|" && next === "|") || (character === ";" && next === ";")) index += 1;
      tokens.push(";");
      continue;
    }
    if (character === "&" && next === "&") {
      flush();
      index += 1;
      tokens.push(";");
      continue;
    }
    if (/\s/.test(character)) {
      flush();
      continue;
    }
    token += character;
  }

  if (quote || escaped) throw new Error("unclosed-shell-token");
  flush();
  return tokens;
}

function commandSegments(tokens) {
  const segments = [];
  let segment = [];
  for (const token of tokens) {
    if (token === ";") {
      if (segment.length) segments.push(segment);
      segment = [];
    } else {
      segment.push(token);
    }
  }
  if (segment.length) segments.push(segment);
  return segments;
}

function executableName(value) {
  return path.posix.basename(String(value).replaceAll("\\", "/")).toLowerCase();
}

function unwrapCommand(segment) {
  let index = 0;
  while (index < segment.length) {
    const current = executableName(segment[index]);
    if (current === "command" || current === "sudo") {
      index += 1;
      continue;
    }
    if (current === "env") {
      index += 1;
      while (index < segment.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(segment[index])) index += 1;
      continue;
    }
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(segment[index])) {
      index += 1;
      continue;
    }
    break;
  }
  return segment.slice(index);
}

function gitInvocation(segment) {
  const command = unwrapCommand(segment);
  if (executableName(command[0]) !== "git") return null;
  let index = 1;
  while (index < command.length) {
    const token = command[index];
    if (token === "-C" || token === "-c" || token === "--git-dir" || token === "--work-tree") {
      index += 2;
      continue;
    }
    if (
      token.startsWith("--git-dir=") ||
      token.startsWith("--work-tree=") ||
      token.startsWith("-c")
    ) {
      index += 1;
      continue;
    }
    if (token.startsWith("-")) {
      index += 1;
      continue;
    }
    return { subcommand: token.toLowerCase(), args: command.slice(index + 1) };
  }
  return null;
}

function hasForceFlag(args) {
  return args.some(
    (argument) =>
      argument === "-f" ||
      /^-[^-]*f[^-]*$/.test(argument) ||
      argument === "--force" ||
      argument.startsWith("--force-with-lease") ||
      argument === "--force-if-includes" ||
      argument.startsWith("+"),
  );
}

function isProductionDeployment(segment) {
  let command = unwrapCommand(segment);
  let executable = executableName(command[0]);
  if (["npx", "bunx"].includes(executable)) {
    command = command.slice(1);
    executable = executableName(command[0]);
  } else if (
    ["npm", "pnpm", "yarn", "bun"].includes(executable) &&
    ["exec", "dlx"].includes(command[1])
  ) {
    command = command.slice(2);
    while (command[0]?.startsWith("-")) command = command.slice(1);
    executable = executableName(command[0]);
  }
  const args = command.slice(1).map((value) => value.toLowerCase());
  const hasProductionFlag = args.some(
    (value, index) =>
      value === "--prod" ||
      value === "--production" ||
      value === "--environment=production" ||
      (value === "--environment" && args[index + 1] === "production"),
  );

  if (executable === "vercel" && hasProductionFlag) return true;
  if (executable === "supabase" && args[0] === "db" && args[1] === "push") return true;
  if (
    executable === "gh" &&
    args[0] === "workflow" &&
    args[1] === "run" &&
    /(?:deploy|production)/.test(args[2] ?? "")
  )
    return true;
  if (["npm", "pnpm", "yarn", "bun"].includes(executable)) {
    const script = args[0] === "run" ? args[1] : args[0];
    if (/^(deploy|release)(:|-)(prod|production)$/.test(script ?? "")) return true;
    if (["deploy", "release"].includes(script) && hasProductionFlag) return true;
  }
  return false;
}

function nestedShellCommands(segment) {
  const command = unwrapCommand(segment);
  const executable = executableName(command[0]);
  if (!["bash", "sh", "zsh"].includes(executable)) return [];
  const flagIndex = command.findIndex((value, index) => index > 0 && /^-[^-]*c/.test(value));
  return flagIndex >= 0 && typeof command[flagIndex + 1] === "string"
    ? [command[flagIndex + 1]]
    : [];
}

export function inspectShell(command, depth = 0) {
  let segments;
  try {
    segments = commandSegments(tokenizeShell(command));
  } catch {
    return { result: "deny", ruleId: "DEV-HOOK-INPUT", reason: fixedReasons.malformed };
  }

  for (const segment of segments) {
    const git = gitInvocation(segment);
    if (git?.subcommand === "push" && hasForceFlag(git.args)) {
      return { result: "deny", ruleId: "DEV-DENY-FORCE-PUSH", reason: fixedReasons.forcePush };
    }
    if (
      git?.subcommand === "reset" &&
      git.args.some((arg) => ["--hard", "--merge", "--keep"].includes(arg))
    ) {
      return {
        result: "deny",
        ruleId: "DEV-DENY-HISTORY-RESET",
        reason: fixedReasons.historyReset,
      };
    }
    if (
      (git?.subcommand === "clean" &&
        git.args.some((arg) => arg === "--force" || /^-[^-]*f/.test(arg))) ||
      (git?.subcommand === "checkout" && git.args.includes("--")) ||
      git?.subcommand === "restore" ||
      (git?.subcommand === "branch" && git.args.some((arg) => /^-[^-]*D/.test(arg)))
    ) {
      return {
        result: "deny",
        ruleId: "DEV-DENY-DESTRUCTIVE-GIT",
        reason: fixedReasons.destructiveGit,
      };
    }
    if (isProductionDeployment(segment)) {
      return {
        result: "deny",
        ruleId: "DEV-DENY-PROD-DEPLOY",
        reason: fixedReasons.productionDeploy,
      };
    }
    if (depth < 2) {
      for (const nested of nestedShellCommands(segment)) {
        const decision = inspectShell(nested, depth + 1);
        if (decision.result === "deny") return decision;
      }
    }
  }

  return { result: "allow", ruleId: "DEV-ALLOW-SCOPED", reason: "No covered deny rule matched." };
}

const reviewPaths = [
  /^AGENTS\.md$/,
  /^\.codex\//,
  /^\.claude\//,
  /^\.github\/(?:workflows\/|CODEOWNERS$)/,
  /^workflow\/(?:agents|hooks|policies)\//,
  /^src\/lib\/auth\//,
  /^src\/app\/login\//,
  /^src\/proxy\.ts$/,
  /^supabase\/migrations\//,
];

function pathsFromPatch(patch) {
  return [...patch.matchAll(/^\*\*\* (?:Add|Update|Delete) File: (.+)$/gm)].map((match) =>
    match[1].trim().replace(/^\.\//, ""),
  );
}

export function inspectPatch(patch) {
  const paths = pathsFromPatch(patch);
  if (!paths.length) {
    return { result: "deny", ruleId: "DEV-HOOK-INPUT", reason: fixedReasons.malformed };
  }
  if (paths.some((file) => reviewPaths.some((pattern) => pattern.test(file)))) {
    return { result: "review", ruleId: "DEV-REVIEW-SENSITIVE", reason: fixedReasons.review };
  }
  return { result: "allow", ruleId: "DEV-ALLOW-SCOPED", reason: "Scoped file edit allowed." };
}

export function evaluatePreToolUse(payload) {
  if (!payload || payload.hook_event_name !== "PreToolUse") {
    return { result: "deny", ruleId: "DEV-HOOK-INPUT", reason: fixedReasons.malformed };
  }
  const command = payload.tool_input?.command;
  if (
    typeof command !== "string" ||
    !command.trim() ||
    Buffer.byteLength(command) > MAX_INPUT_BYTES
  ) {
    return { result: "deny", ruleId: "DEV-HOOK-INPUT", reason: fixedReasons.malformed };
  }
  if (payload.tool_name === "Bash") return inspectShell(command);
  if (payload.tool_name === "apply_patch") return inspectPatch(command);
  return { result: "deny", ruleId: "DEV-HOOK-INPUT", reason: fixedReasons.malformed };
}

const requiredSections = [
  "Changed files",
  "Checks run and actual results",
  "Checks not run and reasons",
  "Unresolved issues",
  "Next action",
];

function extractField(message, name) {
  const match = message.match(new RegExp(`^${name}:\\s*(.+)$`, "im"));
  return match?.[1]?.trim() ?? "";
}

function sectionBody(message, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = message.match(
    new RegExp(`^##\\s+${escaped}\\s*$([\\s\\S]*?)(?=^##\\s+|(?![\\s\\S]))`, "im"),
  );
  return match?.[1]?.trim() ?? "";
}

export function evaluateHandoff(payload) {
  const message =
    typeof payload?.last_assistant_message === "string" ? payload.last_assistant_message : "";
  const handoffPath = extractHandoffPath(message);
  if (handoffPath) {
    const checked = validateHandoffFile(handoffPath, payload?.cwd ?? process.cwd());
    if (checked.errors.length === 0) {
      return {
        result: "accept",
        ruleId: "DEV-HANDOFF-FILE",
        reason: `Structured ${checked.data.status} handoff file present; claims still require verification.`,
        taskId: checked.data.taskId,
      };
    }
  }
  const outcome = extractField(message, "Outcome").toLowerCase();
  const taskId = extractField(message, "Task ID");
  const requirementIds = extractField(message, "Requirement IDs");
  const missing = [];

  if (!["complete", "blocked", "incomplete"].includes(outcome)) missing.push("Outcome");
  if (!taskId) missing.push("Task ID");
  if (!requirementIds) missing.push("Requirement IDs");
  for (const section of requiredSections) {
    if (!sectionBody(message, section)) missing.push(section);
  }

  if (!missing.length) {
    return {
      result: "accept",
      ruleId: "DEV-HANDOFF-COMPLETE",
      reason: `Structured ${outcome} handoff present; claims still require verification.`,
      taskId,
    };
  }

  if (payload?.stop_hook_active === true) {
    return {
      result: "bounded-accept",
      ruleId: "DEV-HANDOFF-BOUNDED",
      reason: "Handoff remains incomplete after one continuation; stopping to avoid a loop.",
      taskId: taskId || null,
      missing,
    };
  }

  return {
    result: "follow-up",
    ruleId: "DEV-HANDOFF-MISSING",
    reason:
      "Provide the structured handoff before stopping. Truthful blocked or incomplete outcomes are valid.",
    taskId: taskId || null,
    missing,
  };
}
