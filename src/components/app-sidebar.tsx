"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_GROUPS, ROLE_LABEL } from "@/components/app-nav";
import { OrbitMark } from "@/components/orbit-mark";
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
