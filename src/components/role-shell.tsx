import type { ReactNode } from "react";
import Link from "next/link";

import { signOut } from "@/app/login/actions";
import { ROLE_LABEL } from "@/components/app-nav";
import { AppSidebar } from "@/components/app-sidebar";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { CurrentUser } from "@/lib/auth/session";

/**
 * Page frame shared by the three role dashboards (SH-07-R2). Nav items come from
 * `src/components/app-nav.ts`, keyed by the already server-resolved `user.role` -- never guessed
 * client-side. The sidebar collapses to a keyboard-operable sheet/menu button below `md`
 * (`SidebarTrigger`, from the shadcn sidebar kit) per SH-07-AC9.
 */
export function RoleShell({ user, children }: { user: CurrentUser; children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar role={user.role} />
      <SidebarInset>
        <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-5" />
            <span className="font-semibold">{ROLE_LABEL[user.role]}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="text-right leading-tight">
              <p className="font-medium">{user.fullName}</p>
              <p className="text-muted-foreground">{ROLE_LABEL[user.role]}</p>
            </div>
            <Link
              href="/account/password"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Change password
            </Link>
            <form action={signOut}>
              <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Sign out
              </button>
            </form>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
