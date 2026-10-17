import { describe, expect, it } from "vitest";

import { homePathFor, isRole } from "./roles";

describe("roles", () => {
  it("[SH-01-AC3] sends each role to its own dashboard", () => {
    expect(homePathFor("student")).toBe("/student");
    expect(homePathFor("lecturer")).toBe("/lecturer");
    expect(homePathFor("admin")).toBe("/admin");
  });

  it("[SH-01-AC3] accepts only known roles", () => {
    expect(isRole("lecturer")).toBe(true);
    expect(isRole("superuser")).toBe(false);
    expect(isRole(undefined)).toBe(false);
  });
});
