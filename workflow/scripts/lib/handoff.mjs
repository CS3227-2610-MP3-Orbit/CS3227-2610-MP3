import { readFileSync } from "node:fs";
import path from "node:path";

const START = "<!-- HANDOFF:BEGIN -->";
const END = "<!-- HANDOFF:END -->";
const RESULTS = new Set(["passed", "failed", "blocked", "not-run"]);
const STATUSES = new Set(["passed", "failed", "blocked", "incomplete"]);

export function parseHandoff(text) {
  if (typeof text !== "string") return { errors: ["handoff must be text"] };
  const start = text.indexOf(START);
  const end = text.indexOf(END);
  if (start === -1 || end === -1 || end <= start) {
    return { errors: [`missing ${START} / ${END} structured block`] };
  }

  let data;
  try {
    data = JSON.parse(text.slice(start + START.length, end).trim());
  } catch {
    return { errors: ["structured handoff block is not valid JSON"] };
  }

  const errors = [];
  if (data?.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (typeof data?.taskId !== "string" || !data.taskId.trim()) errors.push("taskId is required");
  if (!Array.isArray(data?.requirementIds) || data.requirementIds.length === 0)
    errors.push("requirementIds must be a non-empty array");
  else if (data.requirementIds.some((value) => typeof value !== "string" || !value.trim()))
    errors.push("requirementIds entries must be non-empty strings");
  if (!STATUSES.has(data?.status))
    errors.push("status must be passed, failed, blocked, or incomplete");
  if (!Array.isArray(data?.changedFiles))
    errors.push("changedFiles must be an array (use [] for none)");
  else if (data.changedFiles.some((value) => typeof value !== "string" || !value.trim()))
    errors.push("changedFiles entries must be non-empty strings");
  if (!Array.isArray(data?.verification) || data.verification.length === 0) {
    errors.push("verification must contain at least one result");
  } else {
    data.verification.forEach((entry, index) => {
      if (typeof entry?.check !== "string" || !entry.check.trim())
        errors.push(`verification[${index}].check is required`);
      if (!RESULTS.has(entry?.result))
        errors.push(`verification[${index}].result must be passed, failed, blocked, or not-run`);
      if (typeof entry?.evidence !== "string" || !entry.evidence.trim())
        errors.push(`verification[${index}].evidence is required`);
    });
  }
  if (!Array.isArray(data?.unresolvedIssues))
    errors.push("unresolvedIssues must be an array (use [] for none)");
  else if (data.unresolvedIssues.some((value) => typeof value !== "string" || !value.trim()))
    errors.push("unresolvedIssues entries must be non-empty strings");

  return { data, errors };
}

export function validateHandoffFile(file, cwd = process.cwd()) {
  const root = path.resolve(cwd);
  const handoffRoot = path.join(root, "workflow", "handoffs");
  const absolute = path.resolve(root, file);
  if (!absolute.startsWith(`${handoffRoot}${path.sep}`) || path.extname(absolute) !== ".md") {
    return { errors: ["handoff path must be a Markdown file inside workflow/handoffs/"] };
  }
  try {
    return parseHandoff(readFileSync(absolute, "utf8"));
  } catch {
    return { errors: ["handoff file could not be read"] };
  }
}

export function extractHandoffPath(message) {
  if (typeof message !== "string") return null;
  return (
    message.match(/^Handoff evidence:\s+(workflow\/handoffs\/[A-Za-z0-9._/-]+\.md)\s*$/m)?.[1] ??
    null
  );
}
