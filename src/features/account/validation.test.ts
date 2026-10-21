import { describe, expect, it } from "vitest";

import { boundedInput, changePasswordInputSchema } from "./validation";

const base = {
  currentPassword: "correct-current-pw",
  newPassword: "a-fresh-new-password",
  confirmPassword: "a-fresh-new-password",
};

describe("SH-06 change-password validation", () => {
  it("[SH-06-AC3] accepts a new password at the 12-byte and 72-byte boundaries", () => {
    expect(
      changePasswordInputSchema.safeParse({
        ...base,
        newPassword: "x".repeat(12),
        confirmPassword: "x".repeat(12),
      }).success,
    ).toBe(true);
    expect(
      changePasswordInputSchema.safeParse({
        ...base,
        newPassword: "x".repeat(72),
        confirmPassword: "x".repeat(72),
      }).success,
    ).toBe(true);
  });

  it("[SH-06-AC3] rejects a new password under 12 bytes or over 72 bytes", () => {
    const tooShort = changePasswordInputSchema.safeParse({
      ...base,
      newPassword: "x".repeat(11),
      confirmPassword: "x".repeat(11),
    });
    expect(tooShort.success).toBe(false);
    if (!tooShort.success) expect(tooShort.error.issues[0].path).toEqual(["newPassword"]);

    const tooLong = changePasswordInputSchema.safeParse({
      ...base,
      newPassword: "x".repeat(73),
      confirmPassword: "x".repeat(73),
    });
    expect(tooLong.success).toBe(false);
    if (!tooLong.success) expect(tooLong.error.issues[0].path).toEqual(["newPassword"]);
  });

  it("[SH-06-AC3] measures length in UTF-8 bytes, not JS string length, for multibyte passwords", () => {
    // Each "😀" is 4 bytes but 2 UTF-16 code units; 3 of them = 12 bytes, 6 string length.
    const emoji = "😀".repeat(3);
    expect(emoji.length).toBe(6);
    expect(
      changePasswordInputSchema.safeParse({
        ...base,
        newPassword: emoji,
        confirmPassword: emoji,
      }).success,
    ).toBe(true);
    // 19 copies of "😀" is 76 bytes (>72) even though JS string length is only 38.
    const tooManyBytes = "😀".repeat(19);
    const result = changePasswordInputSchema.safeParse({
      ...base,
      newPassword: tooManyBytes,
      confirmPassword: tooManyBytes,
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].path).toEqual(["newPassword"]);
  });

  it("[SH-06-AC4] rejects a new password that equals the current password", () => {
    const result = changePasswordInputSchema.safeParse({
      ...base,
      newPassword: base.currentPassword,
      confirmPassword: base.currentPassword,
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].path).toEqual(["newPassword"]);
  });

  it("[SH-06-AC4] rejects a confirmation that does not match the new password", () => {
    const result = changePasswordInputSchema.safeParse({
      ...base,
      confirmPassword: `${base.confirmPassword}-typo`,
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
  });

  it("accepts a well-formed change and rejects forged/duplicate/unknown fields before any server call", () => {
    expect(changePasswordInputSchema.safeParse(base).success).toBe(true);
    for (const invalid of [
      { ...base, role: "admin" },
      { ...base, targetUserId: "11111111-1111-4111-8111-111111111111" },
      {},
      { ...base, currentPassword: "" },
      { ...base, currentPassword: 123 },
    ]) {
      expect(changePasswordInputSchema.safeParse(invalid).success).toBe(false);
    }
  });

  it("boundedInput rejects duplicate FormData fields and non-FormData/non-object input", () => {
    const duplicate = new FormData();
    for (const [key, value] of Object.entries(base)) duplicate.append(key, value);
    duplicate.append("currentPassword", "second");
    expect(boundedInput(duplicate)).toBeNull();
    expect(boundedInput("not an object")).toBeNull();
    expect(boundedInput(null)).toBeNull();
    expect(boundedInput(["array"])).toBeNull();
  });

  it("boundedInput decodes well-formed FormData into a plain object", () => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(base)) formData.append(key, value);
    expect(boundedInput(formData)).toEqual(base);
  });
});
