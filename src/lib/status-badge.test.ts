import { describe, expect, it } from "vitest";

import { ROLES } from "@/lib/auth/roles";

import { statusBadgeVariant } from "./status-badge";

// Mirrors the status enums defined in src/features/student/bookings/manage-validation.ts
// (bookingStatus), src/features/lecturer/requests-validation.ts, and
// src/features/lecturer/consultations/validation.ts (displayStatus) -- duplicated here rather
// than cross-imported, the same cross-feature-independence convention those files already use
// for each other (see their own "not imported" comments).
const BOOKING_STATUSES = ["pending", "approved", "rejected", "cancelled", "completed"] as const;
const CONSULTATION_DISPLAY_STATUSES = [
  "pending",
  "upcoming",
  "ongoing",
  "rejected",
  "cancelled",
  "completed",
] as const;
// account/course active-state words (ADM-01/ADM-02's isActive boolean has no string enum of its
// own in validation.ts, but src/features/admin/{accounts,courses}/presentation.ts render it as
// exactly these two words).
const ACTIVE_STATE_WORDS = ["active", "deactivated"] as const;

describe("statusBadgeVariant [SH-07-AC16]", () => {
  it("maps active, approved and completed to success", () => {
    expect(statusBadgeVariant("active")).toBe("success");
    expect(statusBadgeVariant("approved")).toBe("success");
    expect(statusBadgeVariant("completed")).toBe("success");
  });

  it("maps pending to warning", () => {
    expect(statusBadgeVariant("pending")).toBe("warning");
  });

  it("maps rejected, cancelled, deactivated and error to destructive", () => {
    expect(statusBadgeVariant("rejected")).toBe("destructive");
    expect(statusBadgeVariant("cancelled")).toBe("destructive");
    expect(statusBadgeVariant("deactivated")).toBe("destructive");
    expect(statusBadgeVariant("error")).toBe("destructive");
  });

  it("maps every value of the shared booking/consultation status enums to a defined bucket", () => {
    for (const status of [...BOOKING_STATUSES, ...CONSULTATION_DISPLAY_STATUSES]) {
      expect(["success", "warning", "destructive", "secondary"]).toContain(
        statusBadgeVariant(status),
      );
    }
  });

  it("maps every role in src/lib/auth/roles.ts to default/secondary", () => {
    for (const role of ROLES) expect(statusBadgeVariant(role)).toBe("secondary");
  });

  it("maps every account/course active-state word correctly", () => {
    for (const word of ACTIVE_STATE_WORDS) {
      expect(statusBadgeVariant(word)).toBe(word === "active" ? "success" : "destructive");
    }
  });

  it("maps an unrecognised or display-only status to default/secondary", () => {
    expect(statusBadgeVariant("upcoming")).toBe("secondary");
    expect(statusBadgeVariant("ongoing")).toBe("secondary");
    expect(statusBadgeVariant("something-else")).toBe("secondary");
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(statusBadgeVariant(" PENDING ")).toBe("warning");
    expect(statusBadgeVariant("Active")).toBe("success");
  });
});
