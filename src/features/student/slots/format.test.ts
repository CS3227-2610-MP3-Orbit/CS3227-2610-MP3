import { describe, expect, it } from "vitest";

import { formatSingaporeDateTime } from "./format";

describe("student slot date-time formatting", () => {
  it("[STU-01-AC8] formats an instant in Singapore Time without throwing", () => {
    expect(formatSingaporeDateTime("2026-01-02T00:00:00.000Z")).toBe("2 Jan 2026, 8:00 am SGT");
  });
});
