import type { Role } from "@/lib/auth/roles";

export interface NavItem {
  label: string;
  href: string;
}

/**
 * SH-07-R2: nav items for every role's sidebar are defined once, here, instead of being
 * duplicated per page. `RoleShell` reads only the entry for the server-resolved role, so a
 * signed-in user never sees another role's links (SH-07-AC2).
 */
export const NAV_ITEMS: Record<Role, NavItem[]> = {
  student: [
    { label: "Dashboard", href: "/student" },
    { label: "Available slots", href: "/student/slots" },
    { label: "My bookings", href: "/student/bookings" },
  ],
  lecturer: [{ label: "Dashboard", href: "/lecturer" }],
  admin: [
    { label: "Dashboard", href: "/admin" },
    { label: "Accounts", href: "/admin/accounts" },
    // Arrives on another branch (ADM-02); linked here so admin nav is complete once it lands.
    { label: "Courses", href: "/admin/courses" },
    { label: "Reports", href: "/admin/reports" },
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  student: "Student",
  lecturer: "Lecturer",
  admin: "Administrator",
};
