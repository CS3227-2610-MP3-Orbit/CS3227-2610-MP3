import { RoleShell } from "@/components/role-shell";
import { requireUser } from "@/lib/auth/session";

// SH-06-R5: any signed-in active user may reach /account/**, not one requireRole(role).
export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const user = await requireUser();
  return <RoleShell user={user}>{children}</RoleShell>;
}
