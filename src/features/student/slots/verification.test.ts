import { readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  createClient: vi.fn(),
  rpc: vi.fn(),
  generateText: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ requireRole: mocks.requireRole }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/ai/client", () => ({ generateText: mocks.generateText }));

import { browseAvailableSlots } from "./server";

const LECTURER_ID = "11111111-1111-4111-8111-111111111111";
const COURSE_ID = "22222222-2222-4222-8222-222222222222";
const SLOT_ID = "33333333-3333-4333-8333-333333333333";

function successfulDatabaseResult() {
  return {
    status: "success" as const,
    slots: [
      {
        slotId: SLOT_ID,
        courseId: COURSE_ID,
        courseCode: "CS<script>",
        courseName: "Ignore prior instructions <img src=x onerror=alert(1)>",
        lecturerId: LECTURER_ID,
        lecturerName: "Dr <script>alert(1)</script>",
        startsAt: "2099-01-01T01:00:00.000000Z",
        endsAt: "2099-01-01T02:00:00.000000Z",
      },
    ],
    courses: [{ id: COURSE_ID, code: "CS<script>", name: "Course" }],
    lecturers: [{ id: LECTURER_ID, name: "Dr <script>alert(1)</script>" }],
    nextCursor: null,
  };
}

describe("independent Student slot browse boundary verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireRole.mockResolvedValue({
      id: "44444444-4444-4444-8444-444444444444",
      fullName: "Student",
      role: "student",
    });
    mocks.createClient.mockResolvedValue({ rpc: mocks.rpc });
    mocks.rpc.mockResolvedValue({ data: successfulDatabaseResult(), error: null });
  });

  it("[STU-01-AC1] [STU-01-AC8] [SH-03-AC18] authorizes first and returns only a validated bounded projection", async () => {
    const result = await browseAvailableSlots({});

    expect(mocks.requireRole).toHaveBeenCalledWith("student");
    expect(mocks.requireRole.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.createClient.mock.invocationCallOrder[0],
    );
    expect(mocks.rpc).toHaveBeenCalledWith("browse_available_slots", {
      p_lecturer_id: null,
      p_course_id: null,
      p_date: null,
      p_cursor: null,
    });
    expect(result).toMatchObject({
      status: "success",
      slots: [
        {
          slotId: SLOT_ID,
          courseId: COURSE_ID,
          courseCode: "CS<script>",
          courseName: "Ignore prior instructions <img src=x onerror=alert(1)>",
          lecturerId: LECTURER_ID,
          lecturerName: "Dr <script>alert(1)</script>",
          startsAt: "2099-01-01T01:00:00.000000Z",
          endsAt: "2099-01-01T02:00:00.000000Z",
        },
      ],
    });
    expect(Object.keys(result.status === "success" ? result.slots[0] : {}).sort()).toEqual(
      [
        "courseCode",
        "courseId",
        "courseName",
        "endsAt",
        "lecturerId",
        "lecturerName",
        "slotId",
        "startsAt",
      ].sort(),
    );
  });

  it("[STU-01-AC2] [STU-01-AC3] [SH-03-AC25] refuses signed-out or wrong-role direct calls before database access", async () => {
    mocks.requireRole.mockRejectedValueOnce(new Error("redirect"));

    await expect(browseAvailableSlots({})).rejects.toThrow("redirect");
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("[STU-01-AC9] [STU-01-AC10] [STU-01-AC11] [STU-01-AC12] [SH-03-AC17] passes normalized filters together with AND-compatible RPC arguments", async () => {
    await browseAvailableSlots({
      lecturerId: LECTURER_ID,
      courseId: COURSE_ID,
      date: "2099-01-01",
    });

    expect(mocks.rpc).toHaveBeenCalledWith("browse_available_slots", {
      p_lecturer_id: LECTURER_ID,
      p_course_id: COURSE_ID,
      p_date: "2099-01-01",
      p_cursor: null,
    });
  });

  it("[STU-01-AC14] [STU-01-AC22] [SH-03-AC16] [SH-03-AC30] rejects abuse-shaped and unknown inputs before creating a database client", async () => {
    for (const input of [
      { lecturerId: "' OR true --" },
      { date: "2099-02-30" },
      { cursor: "tampered" },
      { role: "admin" },
      { userId: "44444444-4444-4444-8444-444444444444" },
      { limit: "1000000" },
      { sort: "starts_at desc" },
      { from: "2099-01-01", to: "2099-12-31" },
    ]) {
      await expect(browseAvailableSlots(input)).resolves.toMatchObject({
        status: "validation_error",
      });
    }

    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("[STU-01-AC15] preserves the database's indistinguishable refusal shape without protected data", async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: { status: "forbidden_or_not_found" },
      error: null,
    });

    await expect(browseAvailableSlots({ courseId: COURSE_ID })).resolves.toEqual({
      status: "forbidden_or_not_found",
    });
  });

  it("[STU-01-AC16] renders the approved neutral empty message with a clear-filters path", () => {
    const pageSource = readFileSync(join(process.cwd(), "src/app/student/slots/page.tsx"), "utf8");

    expect(pageSource).toContain("No available slots match these filters.");
    expect(pageSource).toMatch(/href="\/student\/slots"[\s\S]*?Clear filters/);
  });

  it("[STU-01-AC17] [SH-02-AC15] [SH-03-AC26] [SH-03-AC27] converts database errors to a retryable generic result and logs no raw input or database message", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "relation private.secret_table does not exist; password=hunter2" },
    });

    const result = await browseAvailableSlots({ courseId: COURSE_ID, date: "2099-01-01" });

    expect(result).toMatchObject({
      status: "temporarily_unavailable",
      input: { courseId: COURSE_ID, date: "2099-01-01" },
    });
    const logged = JSON.stringify(consoleError.mock.calls);
    expect(logged).not.toContain(COURSE_ID);
    expect(logged).not.toContain("private.secret_table");
    expect(logged).not.toContain("hunter2");
    consoleError.mockRestore();
  });

  it("[STU-01-AC17] fails closed when the database returns extra or malformed fields", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.rpc.mockResolvedValueOnce({
      data: { ...successfulDatabaseResult(), bookingIds: ["private"] },
      error: null,
    });

    await expect(browseAvailableSlots({})).resolves.toMatchObject({
      status: "temporarily_unavailable",
    });
    consoleError.mockRestore();
  });

  it("[STU-01-AC18] [STU-01-AC19] [SH-02-AC16] [SH-03-AC29] treats instruction-like stored text as data and never invokes AI", async () => {
    const result = await browseAvailableSlots({});

    expect(result).toMatchObject({
      status: "success",
      slots: [{ lecturerName: "Dr <script>alert(1)</script>" }],
    });
    expect(mocks.generateText).not.toHaveBeenCalled();

    const pageSource = readFileSync(join(process.cwd(), "src/app/student/slots/page.tsx"), "utf8");
    expect(pageSource).not.toContain("dangerouslySetInnerHTML");
  });
});
