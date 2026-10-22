import { describe, expect, it } from "vitest";

import { findColorViolations } from "./check-colors.mjs";

describe("check-colors", () => {
  it("[SH-07-AC5] flags a raw Tailwind palette class such as bg-black", () => {
    const violations = findColorViolations('<div className="bg-black p-4">');
    expect(violations.some((v) => v.match.includes("bg-black"))).toBe(true);
  });

  it("[SH-07-AC5] flags a raw Tailwind palette class with a shade, such as text-gray-600", () => {
    const violations = findColorViolations('<p className="text-gray-600">Hint</p>');
    expect(violations.some((v) => v.match.includes("text-gray-600"))).toBe(true);
  });

  it("[SH-07-AC5] flags a palette class used anywhere in a utility prefix, such as border-red-700", () => {
    const violations = findColorViolations('<div className="rounded border-red-700 p-4">');
    expect(violations.some((v) => v.match.includes("border-red-700"))).toBe(true);
  });

  it("[SH-07-AC5] flags a hex colour literal", () => {
    const violations = findColorViolations('const style = { color: "#ff0000" };');
    expect(violations.some((v) => v.match.startsWith("#ff0000"))).toBe(true);
  });

  it("[SH-07-AC5] flags an rgb()/rgba() colour literal", () => {
    const violations = findColorViolations('const style = { color: "rgba(0, 0, 0, 0.5)" };');
    expect(violations.length).toBeGreaterThan(0);
  });

  it("[SH-07-AC5] does not flag shadcn CSS-variable token classes", () => {
    const violations = findColorViolations(
      '<div className="bg-background text-foreground border-border text-destructive bg-primary text-muted-foreground">',
    );
    expect(violations).toHaveLength(0);
  });

  it("[SH-07-AC5] does not flag unrelated utility classes that merely contain colour-like substrings", () => {
    const violations = findColorViolations(
      '<div className="flex items-center gap-2 font-medium text-sm rounded-lg">',
    );
    expect(violations).toHaveLength(0);
  });
});
