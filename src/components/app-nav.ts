import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  CalendarSearch,
  LayoutDashboard,
  Megaphone,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { Role } from "@/lib/auth/roles";

export interface NavItem {
  label: string;
  href: string;
  /** SH-07-R10: decorative only (`aria-hidden="true"` where rendered) -- the link's accessible
   * name stays exactly `label`. */
  icon: LucideIcon;
}

export interface NavGroup {
  /** SH-07-R10: rendered uppercase and letter-spaced -- kept in natural case here so it also
   * reads correctly for a screen reader or a future non-visual consumer. */
  label: string;
  items: NavItem[];
}

/**
 * SH-07-R2 / SH-07-R10: nav items for every role's sidebar are defined once, here, grouped
 * under a role-appropriate uppercase label, instead of being duplicated per page. `RoleShell`
 * reads only the groups for the server-resolved role, so a signed-in user never sees another
 * role's links (SH-07-AC2) and every item carries a `lucide-react` icon under its group
 * (SH-07-AC13).
 */
export const NAV_GROUPS: Record<Role, NavGroup[]> = {
  student: [
    { label: "Overview", items: [{ label: "Dashboard", href: "/student", icon: LayoutDashboard }] },
    {
      label: "Bookings",
      items: [
        { label: "Available slots", href: "/student/slots", icon: CalendarSearch },
        { label: "My bookings", href: "/student/bookings", icon: CalendarCheck },
      ],
    },
  ],
  lecturer: [
    {
      label: "Overview",
      items: [{ label: "Dashboard", href: "/lecturer", icon: LayoutDashboard }],
    },
  ],
  admin: [
    { label: "Overview", items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }] },
    { label: "People", items: [{ label: "Accounts", href: "/admin/accounts", icon: Users }] },
    {
      label: "Teaching",
      items: [{ label: "Courses", href: "/admin/courses", icon: BookOpen }],
    },
    {
      label: "Communications",
      items: [{ label: "Announcements", href: "/admin/announcements", icon: Megaphone }],
    },
    {
      label: "Insights",
      items: [{ label: "Reports", href: "/admin/reports", icon: BarChart3 }],
    },
  ],
};

/** Flat view of every role's nav items, for callers that don't care about grouping. */
export const NAV_ITEMS: Record<Role, NavItem[]> = Object.fromEntries(
  Object.entries(NAV_GROUPS).map(([role, groups]) => [
    role,
    groups.flatMap((group) => group.items),
  ]),
) as Record<Role, NavItem[]>;

export const ROLE_LABEL: Record<Role, string> = {
  student: "Student",
  lecturer: "Lecturer",
  admin: "Administrator",
};
