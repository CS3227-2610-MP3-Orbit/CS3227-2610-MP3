export const ROLES = ["student", "lecturer", "admin"] as const;

export type Role = (typeof ROLES)[number];

const HOME_BY_ROLE: Record<Role, string> = {
  student: "/student",
  lecturer: "/lecturer",
  admin: "/admin",
};

/** The dashboard a user of the given role lands on after signing in. */
export function homePathFor(role: Role): string {
  return HOME_BY_ROLE[role];
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}
