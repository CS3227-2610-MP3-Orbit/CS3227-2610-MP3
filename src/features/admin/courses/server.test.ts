import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  role: vi.fn(),
  client: vi.fn(),
  rpc: vi.fn(),
  rpcAbort: vi.fn(),
  generateText: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ requireRole: mocks.role }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
// ADM-02-R9: this feature must never import/call the SoC LLM client. Mocked here (rather than
// left unmocked) so a future regression that DOES call it fails loudly instead of silently
// hitting a real network client in a unit test.
vi.mock("@/lib/ai/client", () => ({ generateText: mocks.generateText }));

import {
  assignLecturer,
  createCourse,
  listCourses,
  removeAssignment,
  setCourseActive,
  updateCourse,
} from "./server";

const actorId = "99999999-9999-4999-8999-999999999999";
const courseId = "11111111-1111-4111-8111-111111111111";
const lecturerId = "22222222-2222-4222-8222-222222222222";
const assignmentId = "33333333-3333-4333-8333-333333333333";

describe("ADM-02 admin courses server boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.role.mockResolvedValue({ id: actorId, role: "admin", fullName: "Admin" });
    mocks.client.mockResolvedValue({ rpc: mocks.rpc });
    mocks.rpc.mockReturnValue({ abortSignal: mocks.rpcAbort });
    mocks.rpcAbort.mockResolvedValue({
      data: {
        kind: "success",
        courseId,
        code: "CS3227",
        name: "Software Engineering",
        isActive: true,
      },
      error: null,
    });
  });

  it("[ADM-02-AC15] auth redirects propagate before any database work, for every action", async () => {
    const redirect = new Error("NEXT_REDIRECT");
    mocks.role.mockRejectedValue(redirect);
    await expect(createCourse({ code: "CS3227", name: "Software Engineering" })).rejects.toBe(
      redirect,
    );
    await expect(updateCourse({ courseId, code: "CS3227", name: "Name" })).rejects.toBe(redirect);
    await expect(setCourseActive({ courseId, isActive: false })).rejects.toBe(redirect);
    await expect(listCourses({})).rejects.toBe(redirect);
    await expect(assignLecturer({ courseId, lecturerId })).rejects.toBe(redirect);
    await expect(removeAssignment({ assignmentId })).rejects.toBe(redirect);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("[ADM-02-AC16] no course/assignment operation ever calls the SoC LLM client", async () => {
    mocks.rpcAbort.mockResolvedValue({
      data: { kind: "success", assignmentId, courseId, lecturerId },
      error: null,
    });
    await createCourse({ code: "CS3227", name: "Software Engineering" });
    await updateCourse({ courseId, code: "CS3227", name: "Software Engineering" });
    await setCourseActive({ courseId, isActive: false });
    await listCourses({});
    await assignLecturer({ courseId, lecturerId });
    await removeAssignment({ assignmentId });
    expect(mocks.generateText).not.toHaveBeenCalled();
  });

  it("[ADM-02-AC3] createCourse rejects an invalid code/name before any RPC call", async () => {
    const badCode = await createCourse({ code: "a", name: "Valid Name" });
    expect(badCode).toEqual({ kind: "validation_error", field: "code" });
    const badName = await createCourse({ code: "CS3227", name: "" });
    expect(badName).toEqual({ kind: "validation_error", field: "name" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("createCourse sends the normalized code/name to admin_create_course", async () => {
    await createCourse({ code: "  cs3227  ", name: "  Software Engineering  " });
    expect(mocks.rpc).toHaveBeenCalledWith("admin_create_course", {
      p_code: "CS3227",
      p_name: "Software Engineering",
    });
  });

  it("assignLecturer and removeAssignment call their respective RPCs by name", async () => {
    mocks.rpcAbort.mockResolvedValue({
      data: { kind: "success", assignmentId, courseId, lecturerId },
      error: null,
    });
    await assignLecturer({ courseId, lecturerId });
    expect(mocks.rpc).toHaveBeenCalledWith("admin_assign_lecturer", {
      p_course_id: courseId,
      p_lecturer_id: lecturerId,
    });

    mocks.rpcAbort.mockResolvedValue({ data: { kind: "success", assignmentId }, error: null });
    await removeAssignment({ assignmentId });
    expect(mocks.rpc).toHaveBeenCalledWith("admin_remove_assignment", {
      p_assignment_id: assignmentId,
    });
  });
});
