import { readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  role: vi.fn(),
  client: vi.fn(),
  rpc: vi.fn(),
  rpcAbort: vi.fn(),
  from: vi.fn(),
  generateText: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ requireRole: mocks.role }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
// ADM-03-R7: this feature must never import/call the SoC LLM client. Mocked here (rather than
// left unmocked) so a future regression that DOES call it fails loudly instead of silently
// hitting a real network client in a unit test.
vi.mock("@/lib/ai/client", () => ({ generateText: mocks.generateText }));

import {
  createAnnouncement,
  listAnnouncementsForAdmin,
  setAnnouncementPublished,
  updateAnnouncement,
} from "./server";

const actorId = "99999999-9999-4999-8999-999999999999";
const id = "11111111-1111-4111-8111-111111111111";

describe("ADM-03 admin announcements server boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.role.mockResolvedValue({ id: actorId, role: "admin", fullName: "Admin" });
    mocks.client.mockResolvedValue({ rpc: mocks.rpc, from: mocks.from });
    mocks.rpc.mockReturnValue({ abortSignal: mocks.rpcAbort });
    mocks.rpcAbort.mockResolvedValue({
      data: {
        kind: "success",
        id,
        announcementKind: "guideline",
        title: "Title",
        body: "Body",
        isPublished: false,
        createdAt: "2026-10-21T00:00:00Z",
        updatedAt: "2026-10-21T00:00:00Z",
      },
      error: null,
    });
  });

  it("[ADM-03-AC9] auth redirects propagate before any database work, for every action", async () => {
    const redirect = new Error("NEXT_REDIRECT");
    mocks.role.mockRejectedValue(redirect);
    await expect(
      createAnnouncement({ kind: "guideline", title: "Title", body: "Body" }),
    ).rejects.toBe(redirect);
    await expect(
      updateAnnouncement({ id, kind: "guideline", title: "Title", body: "Body" }),
    ).rejects.toBe(redirect);
    await expect(setAnnouncementPublished({ id, isPublished: true })).rejects.toBe(redirect);
    await expect(listAnnouncementsForAdmin()).rejects.toBe(redirect);
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("[ADM-03-AC11] no announcement operation ever calls the SoC LLM client", async () => {
    mocks.from.mockReturnValue({
      select: () => ({
        order: () => ({
          order: () => ({ abortSignal: vi.fn().mockResolvedValue({ data: [], error: null }) }),
        }),
      }),
    });
    await createAnnouncement({ kind: "guideline", title: "Title", body: "Body" });
    await updateAnnouncement({ id, kind: "guideline", title: "Title", body: "Body" });
    await setAnnouncementPublished({ id, isPublished: true });
    await listAnnouncementsForAdmin();
    expect(mocks.generateText).not.toHaveBeenCalled();
  });

  it("[ADM-03-AC2] createAnnouncement rejects an invalid kind/title/body before any RPC call", async () => {
    const badKind = await createAnnouncement({ kind: "notice", title: "Title", body: "Body" });
    expect(badKind).toEqual({ kind: "validation_error", field: "kind" });
    const badTitle = await createAnnouncement({ kind: "guideline", title: "", body: "Body" });
    expect(badTitle).toEqual({ kind: "validation_error", field: "title" });
    const badBody = await createAnnouncement({
      kind: "guideline",
      title: "Title",
      body: "x".repeat(2001),
    });
    expect(badBody).toEqual({ kind: "validation_error", field: "body" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("createAnnouncement sends the normalized kind/title/body to admin_create_announcement", async () => {
    await createAnnouncement({ kind: "guideline", title: "  Title  ", body: "  Body  " });
    expect(mocks.rpc).toHaveBeenCalledWith("admin_create_announcement", {
      p_kind: "guideline",
      p_title: "Title",
      p_body: "Body",
    });
  });

  it("updateAnnouncement and setAnnouncementPublished call their respective RPCs by name", async () => {
    mocks.rpcAbort.mockResolvedValue({
      data: {
        kind: "success",
        id,
        announcementKind: "announcement",
        title: "Title",
        body: "Body",
        isPublished: true,
        updatedAt: "2026-10-21T00:00:00Z",
      },
      error: null,
    });
    await updateAnnouncement({ id, kind: "announcement", title: "Title", body: "Body" });
    expect(mocks.rpc).toHaveBeenCalledWith("admin_update_announcement", {
      p_id: id,
      p_kind: "announcement",
      p_title: "Title",
      p_body: "Body",
    });

    mocks.rpcAbort.mockResolvedValue({
      data: { kind: "success", id, isPublished: true },
      error: null,
    });
    await setAnnouncementPublished({ id, isPublished: true });
    expect(mocks.rpc).toHaveBeenCalledWith("admin_set_announcement_published", {
      p_id: id,
      p_published: true,
    });
  });

  it("[ADM-03-AC6] listAnnouncementsForAdmin reads the table directly, ordered newest-first, with no RPC", async () => {
    const order2 = vi.fn().mockReturnValue({
      abortSignal: vi.fn().mockResolvedValue({
        data: [
          {
            id,
            kind: "guideline",
            title: "Title",
            body: "Body",
            is_published: false,
            created_at: "2026-10-21T00:00:00Z",
            updated_at: "2026-10-21T00:00:00Z",
          },
        ],
        error: null,
      }),
    });
    const order1 = vi.fn().mockReturnValue({ order: order2 });
    const select = vi.fn().mockReturnValue({ order: order1 });
    mocks.from.mockReturnValue({ select });

    const result = await listAnnouncementsForAdmin();
    expect(mocks.from).toHaveBeenCalledWith("announcements");
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(result).toEqual({
      kind: "success",
      items: [
        {
          id,
          kind: "guideline",
          title: "Title",
          body: "Body",
          isPublished: false,
          createdAt: "2026-10-21T00:00:00Z",
          updatedAt: "2026-10-21T00:00:00Z",
        },
      ],
    });
  });

  it("[ADM-03-AC12] the row/card/list components render only as text, never dangerouslySetInnerHTML or Markdown", () => {
    const files = [
      "src/app/admin/announcements/announcement-table-row.tsx",
      "src/app/admin/announcements/announcement-row.tsx",
      "src/app/admin/announcements/announcements-list.tsx",
      "src/app/admin/announcements/edit-announcement-form.tsx",
      "src/components/announcements-card.tsx",
    ];
    for (const file of files) {
      const source = readFileSync(join(process.cwd(), file), "utf8");
      expect(source).not.toContain("dangerouslySetInnerHTML");
      expect(source).not.toMatch(/react-markdown|[^.]marked\(|remark/);
    }
    const card = readFileSync(join(process.cwd(), "src/components/announcements-card.tsx"), "utf8");
    expect(card).toContain("whitespace-pre-wrap");
  });
});
