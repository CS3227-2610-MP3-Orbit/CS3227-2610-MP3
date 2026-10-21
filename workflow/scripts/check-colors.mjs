#!/usr/bin/env node
// SH-07-AC5: fails if a raw Tailwind palette colour class or a hex/rgb colour literal appears in
// application code outside the committed shadcn/ui kit (`src/components/ui/**`). The kit (and
// `globals.css`, which is not a `.ts`/`.tsx` file and so is out of this check's scope) is the only
// place allowed to name a concrete colour; every other file must reference a shadcn CSS-variable
// token (e.g. `bg-background`, `text-destructive`) so dark mode (SH-07-R3) stays fully themed.
// Usage: node workflow/scripts/check-colors.mjs

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SCAN_DIR = "src";
const EXCLUDED_PREFIX = path.join("src", "components", "ui") + path.sep;
const SOURCE_FILE = /\.(ts|tsx)$/;

// Tailwind's default palette colour names (every shade of these is a "raw" colour -- the kit's
// tokens such as `background`, `primary`, `destructive`, `muted`, `accent`, `border`, `ring`,
// `card`, `popover`, `sidebar*`, `chart-*` are deliberately not in this list).
const PALETTE_COLORS = [
  "black",
  "white",
  "slate",
  "gray",
  "grey",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
].join("|");

// Any Tailwind "colour-accepting" utility prefix, optionally after responsive/state variants
// (e.g. `dark:`, `hover:`, `focus-visible:`, `sm:`) which this pattern does not need to enumerate
// since it only anchors on the prefix immediately before the colour name.
const UTILITY_PREFIX =
  "bg|text|border|ring|fill|stroke|from|via|to|outline|decoration|divide|caret|accent|shadow|placeholder";

const CLASS_COLOR = new RegExp(
  `(?:^|[\\s"'\`:])(?:${UTILITY_PREFIX})-(?:${PALETTE_COLORS})(?:-(?:50|100|200|300|400|500|600|700|800|900|950))?(?=[\\s"'\`/]|$)`,
  "g",
);
const HEX_COLOR = /#[0-9a-fA-F]{3,8}\b/g;
const RGB_COLOR = /\brgba?\s*\(/g;

/** Finds raw-colour matches in one file's text. Returns [{ line, match }]. */
export function findColorViolations(text) {
  const violations = [];
  text.split("\n").forEach((line, index) => {
    for (const pattern of [CLASS_COLOR, HEX_COLOR, RGB_COLOR]) {
      for (const match of line.matchAll(pattern)) {
        violations.push({ line: index + 1, match: match[0].trim() });
      }
    }
  });
  return violations;
}

function listSourceFiles(dir) {
  try {
    return readdirSync(dir, { recursive: true })
      .map((entry) => path.join(dir, entry))
      .filter((file) => !file.startsWith(EXCLUDED_PREFIX) && SOURCE_FILE.test(file));
  } catch {
    return [];
  }
}

function main() {
  const files = listSourceFiles(SCAN_DIR);
  const errors = [];
  for (const file of files) {
    const violations = findColorViolations(readFileSync(file, "utf8"));
    for (const { line, match } of violations) {
      errors.push(
        `${file}:${line}: raw colour "${match}" (use a shadcn CSS-variable token instead)`,
      );
    }
  }

  console.log(`Scanned ${files.length} file(s) outside src/components/ui for raw colours.`);
  errors.forEach((error) => console.error(`error: ${error}`));
  process.exitCode = errors.length > 0 ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
