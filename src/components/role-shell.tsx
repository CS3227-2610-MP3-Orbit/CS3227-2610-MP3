import type { ReactNode } from "react";
import { KeyRound, LogOut } from "lucide-react";
import Link from "next/link";

import { signOut } from "@/app/login/actions";
import { ROLE_LABEL } from "@/components/app-nav";
import { AppSidebar } from "@/components/app-sidebar";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { CurrentUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

/**
 * Page frame shared by the three role dashboards (SH-07-R2). Nav items come from
 * `src/components/app-nav.ts`, keyed by the already server-resolved `user.role` -- never guessed
 * client-side. The sidebar collapses to a keyboard-operable sheet/menu button below `md`
 * (`SidebarTrigger`, from the shadcn sidebar kit) per SH-07-AC9.
 *
 * Polish pass: below `md` the name/role block hides and "Change password"/"Sign out" collapse
 * to icon buttons so the row never wraps onto two lines. `aria-label` pins each button's
 * accessible name to the exact same string at every width, so `getByRole("link"/"button",
 * { name: /change password/i | /sign out/i })` keeps matching regardless of viewport.
 */
export function RoleShell({ user, children }: { user: CurrentUser; children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar role={user.role} />
      <SidebarInset>
        <header className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-5" />
            <span className="font-semibold">{ROLE_LABEL[user.role]}</span>
          </div>
          <div className="flex items-center gap-2 text-sm sm:gap-4">
            <div className="hidden text-right leading-tight md:block">
              <p className="font-medium">{user.fullName}</p>
              <p className="text-muted-foreground">{ROLE_LABEL[user.role]}</p>
            </div>
            <Link
              href="/account/password"
              aria-label="Change password"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
            >
              <KeyRound aria-hidden="true" className="size-3.5" />
              <span className="hidden md:inline">Change password</span>
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                aria-label="Sign out"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
              >
                <LogOut aria-hidden="true" className="size-3.5" />
                <span className="hidden md:inline">Sign out</span>
              </button>
            </form>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
