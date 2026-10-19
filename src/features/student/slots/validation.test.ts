import { describe, expect, it } from "vitest";

import { filtersToQuery, parseBrowseInput, type RawBrowseSearchParams } from "./validation";

const LECTURER_ID = "11111111-1111-4111-8111-111111111111";
const COURSE_ID = "22222222-2222-4222-8222-222222222222";

describe("student slot browse input", () => {
  it("[STU-01-AC9] [STU-01-AC10] [STU-01-AC11] [STU-01-AC12] accepts the allowlisted filters", () => {
    expect(
      parseBrowseInput({ lecturerId: LECTURER_ID, courseId: COURSE_ID, date: "2026-10-18" }),
    ).toEqual({
      ok: true,
      input: {
        lecturerId: LECTURER_ID,
        courseId: COURSE_ID,
        date: "2026-10-18",
        cursor: undefined,
      },
    });
  });

  it.each<[RawBrowseSearchParams, string]>([
    [{ lecturerId: "not-a-uuid" }, "lecturerId"],
    [{ courseId: "NOT-CANONICAL-UUID" }, "courseId"],
    [{ date: "2026-02-30" }, "date"],
    [{ cursor: "tampered cursor" }, "cursor"],
    [{ sort: "desc" }, "query"],
    [{ courseId: [COURSE_ID, LECTURER_ID] }, "courseId"],
  ])("[STU-01-AC14] rejects malformed or unsupported input %#", (input, field) => {
    expect(parseBrowseInput(input)).toMatchObject({ ok: false, field });
  });

  it("[STU-01-AC22] rejects an oversized query and never accepts limits or sort expressions", () => {
    expect(parseBrowseInput({ cursor: `${"a".repeat(2_049)}.b` })).toMatchObject({
      ok: false,
      field: "query",
    });
    expect(parseBrowseInput({ limit: "100", order: "desc" })).toMatchObject({
      ok: false,
      field: "query",
    });
  });

  it("[STU-01-AC13] removes the cursor when filters are applied again", () => {
    expect(filtersToQuery({ courseId: COURSE_ID, cursor: "payload.signature" }, false)).toBe(
      `courseId=${COURSE_ID}`,
    );
  });

  it("[STU-01-AC13] preserves validated filters when an invalid cursor requires restart", () => {
    expect(parseBrowseInput({ courseId: COURSE_ID, cursor: "tampered" })).toMatchObject({
      ok: false,
      field: "cursor",
      input: { courseId: COURSE_ID },
    });
  });
});
