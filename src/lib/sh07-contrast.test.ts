import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { blendOklab, contrastRatio, type Oklch } from "./color-contrast";

// Reads the real, live tokens from globals.css (the same file SH-07-AC5's check:colors scans)
// rather than duplicating literal numbers here, so this test tracks the actual shipped values.
const css = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
const DARK_MEDIA_QUERY = "@media (prefers-color-scheme: dark)";

function themeBlock(dark: boolean): string {
  const [light, afterDarkMarker] = css.split(DARK_MEDIA_QUERY);
  if (dark && afterDarkMarker === undefined) {
    throw new Error("globals.css is missing its prefers-color-scheme: dark block");
  }
  return dark ? afterDarkMarker : light;
}

function token(block: string, name: string): Oklch {
  const pattern = new RegExp(`--${name}:\\s*oklch\\(\\s*([-\\d.]+)\\s+([-\\d.]+)\\s+([-\\d.]+)`);
  const match = block.match(pattern);
  if (!match) throw new Error(`token --${name} not found in this theme block of globals.css`);
  const [, l, c, h] = match;
  return { l: Number(l), c: Number(c), h: Number(h) };
}

const AA_NORMAL_TEXT = 4.5;

describe.each([
  { theme: "light", dark: false },
  { theme: "dark", dark: true },
])("[SH-07-AC19] token contrast in $theme mode", ({ dark }) => {
  const block = themeBlock(dark);

  it("the teal/navy sidebar foreground meets WCAG AA against the sidebar background", () => {
    const ratio = contrastRatio(token(block, "sidebar-foreground"), token(block, "sidebar"));
    expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  it("the teal/navy sidebar's hover/active accent foreground meets WCAG AA against its background", () => {
    const ratio = contrastRatio(
      token(block, "sidebar-accent-foreground"),
      token(block, "sidebar-accent"),
    );
    expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  it("the success badge text meets WCAG AA against the page background", () => {
    const ratio = contrastRatio(token(block, "success"), token(block, "background"));
    expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  it("the warning badge text meets WCAG AA against the page background", () => {
    const ratio = contrastRatio(token(block, "warning"), token(block, "background"));
    expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  it("the primary button/badge text meets WCAG AA against the primary background", () => {
    const ratio = contrastRatio(token(block, "primary-foreground"), token(block, "primary"));
    expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  // The real failure mode a solid-token-vs-solid-background check misses: every status Badge
  // (src/components/ui/badge.tsx) and the destructive Button draw text in the status colour
  // over a *translucent* fill of that same colour (`bg-success/10`, `dark:bg-success/20`,
  // etc.), composited over the card it sits on -- not over a solid token swatch. This is the
  // chip a person actually reads (e.g. the "Active" badge), so it is what AC19 must cover.
  const PILL_ALPHA = { light: 0.1, dark: 0.2 } as const;

  it.each([
    ["success", "success"],
    ["warning", "warning"],
    ["destructive", "destructive"],
  ])(
    "the rendered %s pill (text over its own translucent fill on a card) meets WCAG AA",
    (_label, tokenName) => {
      const alpha = dark ? PILL_ALPHA.dark : PILL_ALPHA.light;
      const text = token(block, tokenName);
      const cardBackground = token(block, "card");
      const renderedFill = blendOklab(text, alpha, cardBackground);
      const ratio = contrastRatio(text, renderedFill);
      expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    },
  );
});
