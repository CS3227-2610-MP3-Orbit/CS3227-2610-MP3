import { RoleShell } from "@/components/role-shell";
import { requireRole } from "@/lib/auth/session";

export default async function StudentLayout({ children }: LayoutProps<"/student">) {
  const user = await requireRole("student");
  return <RoleShell user={user}>{children}</RoleShell>;
}
