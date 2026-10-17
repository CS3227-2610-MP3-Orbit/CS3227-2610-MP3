import { RoleShell } from "@/components/role-shell";
import { requireRole } from "@/lib/auth/session";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireRole("admin");
  return <RoleShell user={user}>{children}</RoleShell>;
}
