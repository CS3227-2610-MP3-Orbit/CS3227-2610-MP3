import { z } from "zod";

import { ROLES } from "@/lib/auth/roles";

// Mirrors the Student feature's own request-validation.ts (not imported: src/features/student/
// belongs to a different owner per CODEOWNERS, so the small amount of shared shape is duplicated
// here rather than cross-imported).
export const uuid = z
  .string()
  .max(36)
  .uuid()
  .transform((value) => value.toLowerCase());

const safeText = z
  .string()
  .refine(
    (value) =>
      !value.includes("\0") &&
      !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value),
  );
const text = (max: number) =>
  safeText
    .transform((value) => value.trim())
    .refine((value) => [...value].length >= 1 && [...value].length <= max);
const optionalText = (max: number) =>
  safeText.transform((value) => value.trim()).refine((value) => [...value].length <= max);

export const roleSchema = z.enum(ROLES);
export const fullNameSchema = text(200);
// Bounded, then trimmed/lowercased before the format check so "  Foo@Example.com  " and
// "foo@example.com" are treated as the same address (matches auth.users' own normalization).
export const emailSchema = z
  .string()
  .max(320)
  .refine((value) => !value.includes("\0"))
  .trim()
  .toLowerCase()
  .email();

// Decode only scalar application fields, retaining duplicate/unknown-field rejection. Copied
// from the Student feature's request-validation.ts for the same cross-ownership reason as above.
export function boundedInput(raw: unknown): unknown {
  if (raw instanceof FormData) {
    const object: Record<string, unknown> = {};
    for (const [key, value] of raw) {
      if (key.startsWith("$ACTION_")) continue;
      if (Object.hasOwn(object, key) || typeof value !== "string") return null;
      Object.defineProperty(object, key, { value, enumerable: true });
    }
    raw = object;
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  let size = 0;
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value !== "string" && typeof value !== "boolean") return null;
    size += new TextEncoder().encode(key).length;
    if (typeof value === "string") size += new TextEncoder().encode(value).length;
    if (size > 16384) return null;
  }
  return raw;
}

export const createAccountInputSchema = z
  .object({ email: emailSchema, fullName: fullNameSchema, role: roleSchema })
  .strict();
export type CreateAccountInput = z.infer<typeof createAccountInputSchema>;

export const setRoleInputSchema = z.object({ targetId: uuid, role: roleSchema }).strict();
export type SetRoleInput = z.infer<typeof setRoleInputSchema>;

export const setActiveInputSchema = z.object({ targetId: uuid, active: z.boolean() }).strict();
export type SetActiveInput = z.infer<typeof setActiveInputSchema>;

export const resetPasswordInputSchema = z.object({ targetId: uuid }).strict();
export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;

// A GET search form on the accounts page's own searchParams: every value arrives as a string
// (or is absent), never a real boolean, so "" / "true" / "false" are normalized here.
const trueFalse = z
  .string()
  .optional()
  .transform((value) => (value === "" || value === undefined ? undefined : value))
  .pipe(z.enum(["true", "false"]).optional())
  .transform((value) => (value === undefined ? undefined : value === "true"));
const optionalRole = z
  .string()
  .optional()
  .transform((value) => (value === "" || value === undefined ? undefined : value))
  .pipe(roleSchema.optional());
const optionalQuery = z
  .string()
  .optional()
  .transform((value) => (value === "" || value === undefined ? undefined : value))
  .pipe(optionalText(200).optional());
export const listAccountsInputSchema = z
  .object({
    query: optionalQuery,
    roleFilter: optionalRole,
    activeFilter: trueFalse,
  })
  .strict();
export type ListAccountsInput = z.infer<typeof listAccountsInputSchema>;

export const accountSchema = z
  .object({
    id: uuid,
    email: z.string(),
    fullName: z.string(),
    role: roleSchema,
    isActive: z.boolean(),
    isProtected: z.boolean(),
  })
  .strict();
export type Account = z.infer<typeof accountSchema>;

export const fieldSchema = z.enum([
  "email",
  "fullName",
  "role",
  "targetId",
  "active",
  "query",
  "roleFilter",
  "activeFilter",
  "request",
]);
export type AccountField = z.infer<typeof fieldSchema>;

export const createResultSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("success"),
      account: accountSchema,
      initialCredential: z.string(),
    })
    .strict(),
  z.object({ kind: z.literal("validation_error"), field: fieldSchema }).strict(),
  z.object({ kind: z.literal("conflict"), reason: z.literal("duplicate_email") }).strict(),
  // The auth user was created but the role-set step did not confirm success; the app never
  // reports this as the requested role (ADM-01 edge case: "no account is misreported").
  z.object({ kind: z.literal("incomplete"), correlationId: uuid }).strict(),
  z.object({ kind: z.literal("temporarily_unavailable"), correlationId: uuid }).strict(),
]);
export type CreateResult = z.infer<typeof createResultSchema>;

export const listResultSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("success"), accounts: z.array(accountSchema) }).strict(),
  z.object({ kind: z.literal("validation_error"), field: fieldSchema }).strict(),
  z.object({ kind: z.literal("forbidden_or_not_found") }).strict(),
  z.object({ kind: z.literal("temporarily_unavailable"), correlationId: uuid }).strict(),
]);
export type ListResult = z.infer<typeof listResultSchema>;

const mutateFailures = [
  z.object({ kind: z.literal("validation_error"), field: fieldSchema }).strict(),
  z.object({ kind: z.literal("forbidden_or_not_found") }).strict(),
  z.object({ kind: z.literal("forbidden_self_change") }).strict(),
  z.object({ kind: z.literal("forbidden_protected") }).strict(),
  z.object({ kind: z.literal("forbidden_zero_admins") }).strict(),
  z.object({ kind: z.literal("outcome_unknown"), correlationId: uuid }).strict(),
] as const;

export const setRoleResultSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("success"), targetId: uuid, role: roleSchema }).strict(),
  ...mutateFailures,
]);
export type SetRoleResult = z.infer<typeof setRoleResultSchema>;

export const setActiveResultSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("success"), targetId: uuid, isActive: z.boolean() }).strict(),
  ...mutateFailures,
]);
export type SetActiveResult = z.infer<typeof setActiveResultSchema>;

export const resetResultSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("success"), initialCredential: z.string() }).strict(),
  // ADM-01-R10: the password change itself already succeeded by the time this kind can be
  // returned, so the new one-time credential is still included here -- the caller is told the
  // password changed but that ending the target's existing sessions could not be confirmed,
  // never told sessions ended when they did not (see server.ts's resetPassword).
  z
    .object({
      kind: z.literal("password_reset_sessions_not_revoked"),
      initialCredential: z.string(),
    })
    .strict(),
  z.object({ kind: z.literal("validation_error"), field: fieldSchema }).strict(),
  z.object({ kind: z.literal("forbidden_self_change") }).strict(),
  z.object({ kind: z.literal("forbidden_protected") }).strict(),
  z.object({ kind: z.literal("forbidden_or_not_found") }).strict(),
  z.object({ kind: z.literal("temporarily_unavailable"), correlationId: uuid }).strict(),
  z.object({ kind: z.literal("outcome_unknown"), correlationId: uuid }).strict(),
]);
export type ResetResult = z.infer<typeof resetResultSchema>;

// ADM-01-R10: the admin_revoke_sessions RPC's own result shape, parsed the same way every other
// RPC result in this module is (reject/ignore anything that does not match exactly, rather than
// trust an unexpected shape as success).
export const revokeSessionsResultSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("success"),
      targetId: uuid,
      sessionsRevoked: z.number().int().nonnegative(),
    })
    .strict(),
  z.object({ kind: z.literal("validation_error"), field: fieldSchema }).strict(),
  z.object({ kind: z.literal("forbidden_self_change") }).strict(),
  z.object({ kind: z.literal("forbidden_protected") }).strict(),
  z.object({ kind: z.literal("forbidden_or_not_found") }).strict(),
  z.object({ kind: z.literal("temporarily_unavailable"), correlationId: uuid }).strict(),
]);
export type RevokeSessionsResult = z.infer<typeof revokeSessionsResultSchema>;
