import { describe, expect, it } from "vitest";
import { boundedInput, updateInputSchema } from "./manage-validation";
const base = {
  bookingId: "11111111-1111-4111-8111-111111111111",
  version: "v",
  topic: " topic ",
  questions: " questions ",
  idempotencyKey: "22222222-2222-4222-8222-222222222222",
};
describe("manage booking input", () => {
  it("[STU-04-AC4] validates both editable fields and trims them", () =>
    expect(updateInputSchema.parse(base)).toMatchObject({
      topic: "topic",
      questions: "questions",
    }));
  it("[STU-04-AC4] rejects forged and duplicate values", () => {
    expect(updateInputSchema.safeParse({ ...base, status: "approved" }).success).toBe(false);
    const form = new FormData();
    Object.entries(base).forEach(([k, v]) => form.append(k, v));
    form.append("topic", "duplicate");
    expect(boundedInput(form)).toBeNull();
  });
});
