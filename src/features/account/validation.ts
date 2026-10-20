import { z } from "zod";

// Byte length per bcrypt's 72-byte input limit; a multibyte character can cost more than
// one byte, so this must be measured in UTF-8 bytes, not JS string length.
function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export const fieldSchema = z.enum(["currentPassword", "newPassword", "confirmPassword", "request"]);
export type ChangePasswordField = z.infer<typeof fieldSchema>;

// The current password's own shape is whatever the user's existing password is; it is
// verified by attempting a real sign-in, not by a shape check here. Only bound it to
// prevent an unbounded string from reaching the network call.
const currentPasswordSchema = z.string().min(1).max(1024);
const newPasswordSchema = z
  .string()
  .refine((value) => utf8ByteLength(value) >= 12, {
    message: "New password must be at least 12 bytes long.",
  })
  .refine((value) => utf8ByteLength(value) <= 72, {
    message: "New password must be at most 72 bytes long.",
  });

export const changePasswordInputSchema = z
  .object({
    currentPassword: currentPasswordSchema,
    newPassword: newPasswordSchema,
    confirmPassword: z.string().max(1024),
  })
  .strict()
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Confirmation must match the new password.",
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ["newPassword"],
    message: "New password must differ from the current password.",
  });
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;

// Decode only scalar application fields, retaining duplicate/unknown-field rejection.
// Mirrors src/features/student/bookings/request-validation.ts's boundedInput.
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
    if (typeof value !== "string") return null;
    size += new TextEncoder().encode(key).length + new TextEncoder().encode(value).length;
    if (size > 16384) return null;
  }
  return raw;
}

export const resultSchema = z.discriminatedUnion("kind", [
  // SH-06-R6: otherSessionsEnded is false (not omitted) when the best-effort
  // signOut({scope:"others"}) call itself failed -- the message must stay honest rather than
  // claim other devices were signed out when that could not be confirmed.
  z.object({ kind: z.literal("success"), otherSessionsEnded: z.boolean() }).strict(),
  z.object({ kind: z.literal("validation_error"), field: fieldSchema }).strict(),
  z.object({ kind: z.literal("conflict"), reason: z.literal("wrong_current_password") }).strict(),
  z.object({ kind: z.literal("temporarily_unavailable"), correlationId: z.string() }).strict(),
  // SH-06-R7: refused before any Supabase Auth call; retryAfterSeconds counts down to when
  // the oldest counted attempt ages out of the rolling window.
  z
    .object({ kind: z.literal("rate_limited"), retryAfterSeconds: z.number().int().positive() })
    .strict(),
]);
export type ChangePasswordResult = z.infer<typeof resultSchema>;
