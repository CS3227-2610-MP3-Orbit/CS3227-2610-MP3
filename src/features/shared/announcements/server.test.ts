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

  it("[ADM-03-AC8] returns published guidelines and announcements, requiring any active role (not just admin)", async () => {
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

  it("[ADM-03-AC11] the reader path never calls the SoC LLM client", async () => {
    const from = vi.fn().mockReturnValueOnce(queryResult([])).mockReturnValueOnce(queryResult([]));
    mocks.client.mockResolvedValue({ from });
    await listPublishedAnnouncements();
    expect(mocks.generateText).not.toHaveBeenCalled();
  });

  it("returns temporarily_unavailable if either read fails, never throwing", async () => {
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
});
