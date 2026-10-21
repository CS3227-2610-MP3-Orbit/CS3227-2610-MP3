import { describe, expect, it } from "vitest";

import {
  assignLecturerInputSchema,
  boundedInput,
  codeSchema,
  createCourseInputSchema,
  listCoursesInputSchema,
  nameSchema,
  setCourseActiveInputSchema,
  updateCourseInputSchema,
} from "./validation";

const courseId = "11111111-1111-4111-8111-111111111111";
const lecturerId = "22222222-2222-4222-8222-222222222222";

describe("ADM-02 course input normalization", () => {
  it("[ADM-02-AC1] normalizes a valid code to upper(trim())", () => {
    expect(codeSchema.parse("  cs3227  ")).toBe("CS3227");
    expect(codeSchema.parse("cs-22/1_a")).toBe("CS-22/1_A");
  });

  it("[ADM-02-AC3] rejects an out-of-bounds or invalid-character code", () => {
    for (const value of ["a", "ab!", "x".repeat(21), "", "   ", "has space"]) {
      expect(codeSchema.safeParse(value).success).toBe(false);
    }
    // Boundary values are accepted.
    expect(codeSchema.safeParse("ab").success).toBe(true);
    expect(codeSchema.safeParse("a".repeat(20)).success).toBe(true);
  });

  it("[ADM-02-AC3] rejects an empty or oversized name", () => {
    expect(nameSchema.safeParse("   ").success).toBe(false);
    expect(nameSchema.safeParse("x".repeat(201)).success).toBe(false);
    expect(nameSchema.safeParse("x".repeat(200)).success).toBe(true);
    expect(nameSchema.safeParse("x").success).toBe(true);
  });

  it("[ADM-02-AC3] createCourse input: empty name or invalid code names the field, no row created", () => {
    const badCode = createCourseInputSchema.safeParse({ code: "a", name: "Valid Name" });
    expect(badCode.success).toBe(false);
    if (!badCode.success) expect(badCode.error.issues[0]?.path[0]).toBe("code");

    const badName = createCourseInputSchema.safeParse({ code: "CS3227", name: "" });
    expect(badName.success).toBe(false);
    if (!badName.success) expect(badName.error.issues[0]?.path[0]).toBe("name");

    expect(
      createCourseInputSchema.safeParse({ code: "cs3227", name: "  Software Engineering  " })
        .success,
    ).toBe(true);
    expect(
      createCourseInputSchema.parse({ code: "cs3227", name: "  Software Engineering  " }),
    ).toEqual({ code: "CS3227", name: "Software Engineering" });
  });

  it("[ADM-02-AC5] updateCourse requires a canonical UUID courseId alongside valid code/name", () => {
    expect(
      updateCourseInputSchema.safeParse({ courseId, code: "CS3227", name: "Name" }).success,
    ).toBe(true);
    expect(
      updateCourseInputSchema.safeParse({ courseId: "not-a-uuid", code: "CS3227", name: "Name" })
        .success,
    ).toBe(false);
  });

  it("rejects malformed/duplicate/unknown fields the same way admin/accounts does", () => {
    const base = { code: "CS3227", name: "Software Engineering" };
    expect(createCourseInputSchema.safeParse({ ...base, isActive: true }).success).toBe(false);
    expect(boundedInput({ ...base, extra: "x" })).not.toBeNull();
    expect(createCourseInputSchema.safeParse(boundedInput({ ...base, extra: "x" })).success).toBe(
      false,
    );
    const form = new FormData();
    form.append("code", "CS3227");
    form.append("code", "CS1010");
    form.append("name", "Name");
    expect(boundedInput(form)).toBeNull();
  });

  it("setCourseActive and assignLecturer accept only canonical UUID targets", () => {
    expect(setCourseActiveInputSchema.safeParse({ courseId, isActive: true }).success).toBe(true);
    expect(setCourseActiveInputSchema.safeParse({ courseId, isActive: "true" }).success).toBe(
      false,
    );
    expect(assignLecturerInputSchema.safeParse({ courseId, lecturerId }).success).toBe(true);
    expect(assignLecturerInputSchema.safeParse({ courseId: "bad", lecturerId }).success).toBe(
      false,
    );
  });

  it("[ADM-02-AC14] listCourses normalizes GET search-param strings", () => {
    expect(listCoursesInputSchema.parse({})).toEqual({});
    expect(listCoursesInputSchema.parse({ query: "  cs  ", activeFilter: "true" })).toEqual({
      query: "cs",
      activeFilter: true,
    });
    expect(listCoursesInputSchema.parse({ query: "", activeFilter: "" })).toEqual({});
  });
});
