import { describe, expect, it } from "vitest";

import { DEFAULT_LIMITS, decideQuota } from "./quota";

describe("decideQuota", () => {
  it("[STU-05-AC7] [STU-05-AC10] has no minute or per-Student daily quota", () => {
    expect(decideQuota({ globalLastDay: 0 }, DEFAULT_LIMITS)).toEqual({ allowed: true });
  });

  it("[STU-05-AC9] [SH-01-AC6] admits the 100th shared daily reservation and refuses the 101st", () => {
    expect(DEFAULT_LIMITS.globalPerDay).toBe(100);
    expect(decideQuota({ globalLastDay: 99 }, DEFAULT_LIMITS)).toEqual({ allowed: true });
    expect(decideQuota({ globalLastDay: 100 }, DEFAULT_LIMITS)).toMatchObject({
      allowed: false,
      reason: "global_day",
    });
  });
});
