import { describe, expect, it } from "vitest";

import { assignedLecturerIds, courseStatusLabel } from "./presentation";

describe("ADM-02 course presentation helpers", () => {
  it("[ADM-02-AC14] assignedLecturerIds returns exactly the course's current lecturer ids", () => {
    const course = {
      lecturers: [
        { assignmentId: "a", lecturerId: "lec-1", lecturerName: "A" },
        { assignmentId: "b", lecturerId: "lec-2", lecturerName: "B" },
      ],
    };
    expect(assignedLecturerIds(course)).toEqual(new Set(["lec-1", "lec-2"]));
    expect(assignedLecturerIds({ lecturers: [] })).toEqual(new Set());
  });

  it("[ADM-02-AC6] courseStatusLabel reflects isActive", () => {
    expect(courseStatusLabel({ isActive: true })).toBe("Active");
    expect(courseStatusLabel({ isActive: false })).toBe("Deactivated");
  });
});
