import { describe, expect, it } from "vitest";

import {
  bodySchema,
  boundedInput,
  createAnnouncementInputSchema,
  kindSchema,
  setAnnouncementPublishedInputSchema,
  titleSchema,
  updateAnnouncementInputSchema,
} from "./validation";

const id = "11111111-1111-4111-8111-111111111111";

describe("ADM-03 announcement input normalization", () => {
  it("[ADM-03-AC2] kindSchema accepts only guideline/announcement", () => {
    expect(kindSchema.safeParse("guideline").success).toBe(true);
    expect(kindSchema.safeParse("announcement").success).toBe(true);
    expect(kindSchema.safeParse("Guideline").success).toBe(false);
    expect(kindSchema.safeParse("notice").success).toBe(false);
    expect(kindSchema.safeParse("").success).toBe(false);
  });

  it("[ADM-03-AC2] titleSchema rejects an out-of-bounds title, accepting the 1 and 120 boundaries", () => {
    expect(titleSchema.safeParse("   ").success).toBe(false);
    expect(titleSchema.safeParse("x".repeat(121)).success).toBe(false);
    expect(titleSchema.safeParse("x").success).toBe(true);
    expect(titleSchema.safeParse("x".repeat(120)).success).toBe(true);
    expect(titleSchema.parse("  Midterm guidance  ")).toBe("Midterm guidance");
  });

  it("[ADM-03-AC2] bodySchema rejects an out-of-bounds body, accepting the 1 and 2000 boundaries", () => {
    expect(bodySchema.safeParse("").success).toBe(false);
    expect(bodySchema.safeParse("x".repeat(2001)).success).toBe(false);
    expect(bodySchema.safeParse("x").success).toBe(true);
    expect(bodySchema.safeParse("x".repeat(2000)).success).toBe(true);
  });

  it("[ADM-03-AC2] [ADM-03-AC12] title/body reject an embedded NUL byte or an unpaired surrogate", () => {
    expect(titleSchema.safeParse("bad\0title").success).toBe(false);
    expect(bodySchema.safeParse("bad\uD800body").success).toBe(false);
    // A real newline is fine -- line breaks are preserved, never stripped (ADM-03-R8).
    expect(bodySchema.safeParse("line one\nline two").success).toBe(true);
  });

  it("[ADM-03-AC2] createAnnouncement input: invalid kind, empty title, or oversized body each name their own field", () => {
    const badKind = createAnnouncementInputSchema.safeParse({
      kind: "notice",
      title: "Title",
      body: "Body",
    });
    expect(badKind.success).toBe(false);
    if (!badKind.success) expect(badKind.error.issues[0]?.path[0]).toBe("kind");

    const badTitle = createAnnouncementInputSchema.safeParse({
      kind: "guideline",
      title: "",
      body: "Body",
    });
    expect(badTitle.success).toBe(false);
    if (!badTitle.success) expect(badTitle.error.issues[0]?.path[0]).toBe("title");

    const badBody = createAnnouncementInputSchema.safeParse({
      kind: "guideline",
      title: "Title",
      body: "x".repeat(2001),
    });
    expect(badBody.success).toBe(false);
    if (!badBody.success) expect(badBody.error.issues[0]?.path[0]).toBe("body");

    expect(
      createAnnouncementInputSchema.parse({
        kind: "announcement",
        title: "  Midterm reminder  ",
        body: "  Bring your student ID.  ",
      }),
    ).toEqual({
      kind: "announcement",
      title: "Midterm reminder",
      body: "Bring your student ID.",
    });
  });

  it("[ADM-03-AC4] updateAnnouncement requires a canonical UUID id alongside valid kind/title/body", () => {
    expect(
      updateAnnouncementInputSchema.safeParse({ id, kind: "guideline", title: "T", body: "B" })
        .success,
    ).toBe(true);
    expect(
      updateAnnouncementInputSchema.safeParse({
        id: "not-a-uuid",
        kind: "guideline",
        title: "T",
        body: "B",
      }).success,
    ).toBe(false);
  });

  it("setAnnouncementPublished accepts only a canonical UUID id and a real boolean", () => {
    expect(setAnnouncementPublishedInputSchema.safeParse({ id, isPublished: true }).success).toBe(
      true,
    );
    expect(setAnnouncementPublishedInputSchema.safeParse({ id, isPublished: "true" }).success).toBe(
      false,
    );
  });

  it("rejects malformed/duplicate/unknown fields the same way admin/courses does", () => {
    const base = { kind: "guideline", title: "Title", body: "Body" };
    expect(createAnnouncementInputSchema.safeParse({ ...base, isPublished: true }).success).toBe(
      false,
    );
    expect(boundedInput({ ...base, extra: "x" })).not.toBeNull();
    expect(
      createAnnouncementInputSchema.safeParse(boundedInput({ ...base, extra: "x" })).success,
    ).toBe(false);
    const form = new FormData();
    form.append("kind", "guideline");
    form.append("kind", "announcement");
    form.append("title", "Title");
    form.append("body", "Body");
    expect(boundedInput(form)).toBeNull();
  });
});
