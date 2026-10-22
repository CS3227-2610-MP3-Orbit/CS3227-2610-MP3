import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const formStatus = vi.hoisted(() => ({ pending: false }));
vi.mock("react-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-dom")>()),
  useFormStatus: () => formStatus,
}));
vi.mock("@/app/lecturer/briefing-actions", () => ({ submitLecturerBriefing: vi.fn() }));

import { BriefingButton } from "./briefing-button";

const render = () => renderToStaticMarkup(createElement(BriefingButton, { bookingId: "b-1" }));

describe("LEC-04 briefing button", () => {
  beforeEach(() => {
    formStatus.pending = false;
  });

  it("[LEC-04-AC8] is enabled and labelled Generate AI briefing when idle", () => {
    const html = render();
    expect(html).toContain("Generate AI briefing");
    expect(html).not.toMatch(/<button[^>]*\sdisabled=""/);
    expect(html).toContain('name="bookingId" value="b-1"');
  });

  it("[LEC-04-AC8] is disabled and announces progress while the briefing is generating", () => {
    formStatus.pending = true;
    const html = render();
    expect(html).toMatch(/<button[^>]*\sdisabled=""/);
    expect(html).toContain("Generating briefing…");
    expect(html).toMatch(/role="status"[^>]*>[^<]*up to 20 seconds/);
  });
});
