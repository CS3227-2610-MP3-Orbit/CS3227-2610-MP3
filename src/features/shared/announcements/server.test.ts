import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  client: vi.fn(),
  from: vi.fn(),
  generateText: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ requireUser: mocks.user }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
// ADM-03-R7: this feature must never import/call the SoC LLM client.
vi.mock("@/lib/ai/client", () => ({ generateText: mocks.generateText }));

import { listPublishedAnnouncements } from "./server";

const guidelineRow = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Consult before the deadline",
  body: "Line one\nLine two",
  updated_at: "2026-10-21T00:00:00Z",
};
const announcementRow = {
  id: "22222222-2222-4222-8222-222222222222",
  title: "Office closed Friday",
  body: "The office is closed this Friday.",
  updated_at: "2026-10-20T00:00:00Z",
};

function queryResult(data: unknown) {
  const abortSignal = vi.fn().mockResolvedValue({ data, error: null });
  const order2 = vi
    .fn()
    .mockReturnValue({ limit: vi.fn().mockReturnValue({ abortSignal }), abortSignal });
  const order1 = vi.fn().mockReturnValue({ order: order2 });
  const eq2 = vi.fn().mockReturnValue({ order: order1 });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  return { select: vi.fn().mockReturnValue({ eq: eq1 }) };
}

describe("ADM-03 shared announcements reader boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.user.mockResolvedValue({ id: "actor", role: "student", fullName: "Student" });
  });

  it("[ADM-03-AC8] auth redirect propagates before any database work", async () => {
    const redirect = new Error("NEXT_REDIRECT");
    mocks.user.mockRejectedValue(redirect);
    await expect(listPublishedAnnouncements()).rejects.toBe(redirect);
    expect(mocks.client).not.toHaveBeenCalled();
  });

  it("[ADM-03-AC8] [STU-06-AC1] returns published guidelines and announcements, requiring any active role (not just admin)", async () => {
    const from = vi
      .fn()
      .mockReturnValueOnce(queryResult([guidelineRow]))
      .mockReturnValueOnce(queryResult([announcementRow]));
    mocks.client.mockResolvedValue({ from });

    const result = await listPublishedAnnouncements();
    expect(mocks.user).toHaveBeenCalled();
    expect(result).toEqual({
      kind: "success",
      guidelines: [
        {
          id: guidelineRow.id,
          title: guidelineRow.title,
          body: guidelineRow.body,
          updatedAt: guidelineRow.updated_at,
        },
      ],
      announcements: [
        {
          id: announcementRow.id,
          title: announcementRow.title,
          body: announcementRow.body,
          updatedAt: announcementRow.updated_at,
        },
      ],
    });
  });

  it("[ADM-03-AC11] [STU-06-AC5] the reader path never calls the SoC LLM client", async () => {
    const from = vi.fn().mockReturnValueOnce(queryResult([])).mockReturnValueOnce(queryResult([]));
    mocks.client.mockResolvedValue({ from });
    await listPublishedAnnouncements();
    expect(mocks.generateText).not.toHaveBeenCalled();
  });

  it("[STU-06-AC6] returns temporarily_unavailable if either read fails, never throwing", async () => {
    const from = vi
      .fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  abortSignal: vi.fn().mockResolvedValue({ data: null, error: new Error("boom") }),
                }),
              }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce(queryResult([]));
    mocks.client.mockResolvedValue({ from });

    const result = await listPublishedAnnouncements();
    expect(result.kind).toBe("temporarily_unavailable");
  });

  it("[STU-06-AC2] [STU-06-AC6] returns a successful empty projection when no items are published", async () => {
    const from = vi.fn().mockReturnValueOnce(queryResult([])).mockReturnValueOnce(queryResult([]));
    mocks.client.mockResolvedValue({ from });
    await expect(listPublishedAnnouncements()).resolves.toEqual({
      kind: "success",
      guidelines: [],
      announcements: [],
    });
  });

  it("[STU-06-AC3] [STU-06-AC7] renders bounded multiline content as inert, responsive plain text", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/announcements-card.tsx"),
      "utf8",
    );
    const emptyState = readFileSync(join(process.cwd(), "src/components/empty-state.tsx"), "utf8");
    expect(source).toContain('aria-labelledby="guidelines-and-announcements"');
    expect(source).toContain("sm:p-6");
    expect(source).toContain("whitespace-pre-wrap");
    expect(source).toContain('role="alert"');
    expect(emptyState).toContain('role="status"');
    expect(source).not.toContain("dangerouslySetInnerHTML");
  });

  it("[STU-06-AC4] [STU-06-AC8] keeps direct reads published-only and requires an active session", async () => {
    const from = vi
      .fn()
      .mockReturnValueOnce(queryResult([guidelineRow]))
      .mockReturnValueOnce(queryResult([]));
    mocks.client.mockResolvedValue({ from });
    await listPublishedAnnouncements();
    expect(from).toHaveBeenCalledTimes(2);
    for (const call of from.mock.results)
      expect(call.value.select).toHaveBeenCalledWith("id, title, body, updated_at");
    expect(mocks.user).toHaveBeenCalledTimes(1);
  });
});
