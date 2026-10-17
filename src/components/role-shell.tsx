import type { ReactNode } from "react";

import { signOut } from "@/app/login/actions";
import type { CurrentUser } from "@/lib/auth/session";

const ROLE_LABEL = { student: "Student", lecturer: "Lecturer", admin: "Administrator" } as const;

/** Page frame shared by the three role dashboards. */
export function RoleShell({ user, children }: { user: CurrentUser; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <span className="font-semibold">{ROLE_LABEL[user.role]}</span>
        <div className="flex items-center gap-4 text-sm">
          <span>{user.fullName}</span>
          <form action={signOut}>
            <button type="submit" className="underline">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 p-6">{children}</main>
    </div>
  );
}
