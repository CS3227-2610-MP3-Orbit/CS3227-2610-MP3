import { describe, expect, it } from "vitest";

import {
  announcementKindLabel,
  announcementStatusLabel,
  truncatedAnnouncementBody,
} from "./presentation";

describe("ADM-03 announcement presentation helpers", () => {
  it("[ADM-03-AC6] announcementStatusLabel reflects isPublished", () => {
    expect(announcementStatusLabel({ isPublished: true })).toBe("Published");
    expect(announcementStatusLabel({ isPublished: false })).toBe("Draft");
  });

  it("announcementKindLabel maps the stored kind to its display label", () => {
    expect(announcementKindLabel("guideline")).toBe("Guideline");
    expect(announcementKindLabel("announcement")).toBe("Announcement");
  });

  it("[ADM-03-AC12] truncatedAnnouncementBody never drops a word, only shortens plain text", () => {
    expect(truncatedAnnouncementBody("Short body.")).toBe("Short body.");
    const long = "x".repeat(200);
    const truncated = truncatedAnnouncementBody(long, 140);
    expect(truncated.length).toBe(141); // 140 chars plus the ellipsis
    expect(truncated.endsWith("…")).toBe(true);
  });
});
