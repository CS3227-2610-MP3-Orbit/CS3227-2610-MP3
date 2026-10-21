"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS, ROLE_LABEL } from "@/components/app-nav";
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
import { homePathFor, type Role } from "@/lib/auth/roles";

/**
 * SH-07-R2 / SH-07-AC2: renders only the nav items for the server-resolved `role` passed in by
 * `RoleShell` -- never a client-side guess -- so no other role's links ever reach the DOM.
 */
export function AppSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV_ITEMS[role];

  return (
    <Sidebar>
      <SidebarHeader>
        <Link
          href={homePathFor(role)}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Consultation Booking
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label={`${ROLE_LABEL[role]} navigation`}>
          <SidebarGroup>
            <SidebarGroupLabel>{ROLE_LABEL[role]} navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== homePathFor(role) && pathname?.startsWith(`${item.href}/`));
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton isActive={isActive} render={<Link href={item.href} />}>
                        {item.label}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </nav>
      </SidebarContent>
    </Sidebar>
  );
}
