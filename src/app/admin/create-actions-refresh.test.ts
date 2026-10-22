import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  requireRole: vi.fn(),
  createCourse: vi.fn(),
  createAccount: vi.fn(),
  createAnnouncement: vi.fn(),
}));
vi.mock("next/cache", () => ({ refresh: mocks.refresh }));
vi.mock("@/lib/auth/session", () => ({ requireRole: mocks.requireRole }));
vi.mock("@/features/admin/courses/server", () => ({ createCourse: mocks.createCourse }));
vi.mock("@/features/admin/accounts/server", () => ({ createAccount: mocks.createAccount }));
vi.mock("@/features/admin/announcements/server", () => ({
  createAnnouncement: mocks.createAnnouncement,
}));

import { createAccountAction } from "./accounts/actions";
import { createAnnouncementAction } from "./announcements/actions";
import { createCourseAction } from "./courses/actions";

const cases = [
  { name: "course", action: createCourseAction, create: mocks.createCourse },
  { name: "account", action: createAccountAction, create: mocks.createAccount },
  { name: "announcement", action: createAnnouncementAction, create: mocks.createAnnouncement },
];

describe("SH-07-R19 create dialogs refresh the list behind them", () => {
  beforeEach(() => vi.resetAllMocks());

  for (const { name, action, create } of cases) {
    it(`[SH-07-AC23] refreshes the page after a successful ${name} create`, async () => {
      const result = { kind: "success", id: "x" };
      create.mockResolvedValue(result);

      await expect(action(new FormData())).resolves.toBe(result);
      expect(mocks.requireRole).toHaveBeenCalledWith("admin");
      expect(mocks.refresh).toHaveBeenCalledOnce();
    });

    it(`[SH-07-AC23] does not refresh when the ${name} create fails`, async () => {
      const result = { kind: "validation_error", field: "request" };
      create.mockResolvedValue(result);

      await expect(action(new FormData())).resolves.toBe(result);
      expect(mocks.refresh).not.toHaveBeenCalled();
    });
  }
});
