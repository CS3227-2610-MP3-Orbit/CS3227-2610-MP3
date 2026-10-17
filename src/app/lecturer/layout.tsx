import { RoleShell } from "@/components/role-shell";
import { requireRole } from "@/lib/auth/session";

export default async function LecturerLayout({ children }: LayoutProps<"/lecturer">) {
  const user = await requireRole("lecturer");
  return <RoleShell user={user}>{children}</RoleShell>;
}
