"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_GROUPS, ROLE_LABEL } from "@/components/app-nav";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { EYEBROW_CLASS } from "@/lib/eyebrow";
import { homePathFor, type Role } from "@/lib/auth/roles";

/**
 * SH-07-R9: the decorative "Orbit" mark -- a centre dot with two orbiting rings/satellites.
 * `aria-hidden` throughout, and it shares the wordmark link's accessible name (the wordmark
 * text itself), per SH-07-AC12.
 */
function OrbitMark() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className="shrink-0">
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      <ellipse
        cx="12"
        cy="12"
        rx="10"
        ry="4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <ellipse
        cx="12"
        cy="12"
        rx="4.5"
        ry="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        transform="rotate(35 12 12)"
      />
      <circle cx="21.2" cy="12" r="1.4" fill="currentColor" />
    </svg>
  );
}

/**
 * SH-07-R2 / SH-07-AC2: renders only the nav items for the server-resolved `role` passed in by
 * `RoleShell` -- never a client-side guess -- so no other role's links ever reach the DOM.
 * SH-07-R9/R10: shows the "Orbit" wordmark + mark, and groups the role's items under
 * uppercase, letter-spaced labels on the SuperCane-style teal/navy panel.
 */
export function AppSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const groups = NAV_GROUPS[role];

  return (
    <Sidebar>
      <SidebarHeader>
        <Link
          href={homePathFor(role)}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-base font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <OrbitMark />
          Orbit
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label={`${ROLE_LABEL[role]} navigation`}>
          {groups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className={EYEBROW_CLASS}>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== homePathFor(role) && pathname?.startsWith(`${item.href}/`));
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton isActive={isActive} render={<Link href={item.href} />}>
                          <Icon aria-hidden="true" />
                          {item.label}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>
    </Sidebar>
  );
}
