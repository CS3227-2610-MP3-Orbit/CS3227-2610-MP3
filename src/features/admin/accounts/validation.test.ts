import { describe, expect, it } from "vitest";

import {
  boundedInput,
  createAccountInputSchema,
  emailSchema,
  fullNameSchema,
  listAccountsInputSchema,
  setActiveInputSchema,
  setRoleInputSchema,
} from "./validation";

const id = "11111111-1111-4111-8111-111111111111";

describe("ADM-01 account input normalization", () => {
  it("[ADM-01-AC11] rejects a malformed email", () => {
    for (const email of ["not-an-email", "", "  ", "a@", "@b.com"]) {
      expect(emailSchema.safeParse(email).success).toBe(false);
    }
  });
  it("trims and lowercases a valid email", () => {
    expect(emailSchema.parse("  Foo@Example.COM  ")).toBe("foo@example.com");
  });
  it("[ADM-01-AC11] rejects an empty or oversized full name", () => {
    expect(fullNameSchema.safeParse("   ").success).toBe(false);
    expect(fullNameSchema.safeParse("x".repeat(201)).success).toBe(false);
    expect(fullNameSchema.safeParse("x".repeat(200)).success).toBe(true);
  });
  it("[ADM-01-AC11] rejects an invalid role, and malformed/duplicate/unknown fields", () => {
    const base = { email: "ok@example.test", fullName: "Ok Name", role: "student" };
    expect(createAccountInputSchema.safeParse({ ...base, role: "superadmin" }).success).toBe(false);
    expect(createAccountInputSchema.safeParse({ ...base, isProtected: true }).success).toBe(false);
    expect(boundedInput({ ...base, extra: "x" })).not.toBeNull();
    expect(createAccountInputSchema.safeParse(boundedInput({ ...base, extra: "x" })).success).toBe(
      false,
    );
    const form = new FormData();
    form.append("email", "first@example.test");
    form.append("email", "second@example.test");
    form.append("fullName", "Name");
    form.append("role", "student");
    expect(boundedInput(form)).toBeNull();
  });
  it("[ADM-01-AC4] setRole/setActive accept only canonical UUID targets and valid values", () => {
    expect(setRoleInputSchema.safeParse({ targetId: id, role: "lecturer" }).success).toBe(true);
    expect(setRoleInputSchema.safeParse({ targetId: "not-a-uuid", role: "lecturer" }).success).toBe(
      false,
    );
    expect(setActiveInputSchema.safeParse({ targetId: id, active: true }).success).toBe(true);
    expect(setActiveInputSchema.safeParse({ targetId: id, active: "true" }).success).toBe(false);
  });
  it("[ADM-01-AC4] listAccounts normalizes GET search-param strings", () => {
    expect(listAccountsInputSchema.parse({})).toEqual({});
    expect(
      listAccountsInputSchema.parse({
        query: "  ada  ",
        roleFilter: "lecturer",
        activeFilter: "true",
      }),
    ).toEqual({ query: "ada", roleFilter: "lecturer", activeFilter: true });
    expect(listAccountsInputSchema.parse({ query: "", roleFilter: "", activeFilter: "" })).toEqual(
      {},
    );
    expect(listAccountsInputSchema.safeParse({ activeFilter: "yes" }).success).toBe(false);
    expect(listAccountsInputSchema.safeParse({ roleFilter: "superadmin" }).success).toBe(false);
  });
});
