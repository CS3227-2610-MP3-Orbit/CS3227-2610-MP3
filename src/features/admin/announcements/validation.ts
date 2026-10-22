import { z } from "zod";

// Mirrors src/features/admin/courses/validation.ts (not imported: kept self-contained per
// feature, the same convention ADM-02 used relative to admin/accounts/validation.ts).
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

// Decode only scalar application fields, retaining duplicate/unknown-field rejection. Copied
// from src/features/admin/courses/validation.ts for the same cross-feature-independence reason.
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

// ADM-03-R1: kind is one of exactly two values; title 1-120 and body 1-2000 trimmed characters,
// each rejecting an embedded NUL byte or an unpaired UTF-16 surrogate (safeText, above).
export const kindSchema = z.enum(["guideline", "announcement"]);
export const titleSchema = text(120);
export const bodySchema = text(2000);

export const createAnnouncementInputSchema = z
  .object({ kind: kindSchema, title: titleSchema, body: bodySchema })
  .strict();
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementInputSchema>;

export const updateAnnouncementInputSchema = z
  .object({ id: uuid, kind: kindSchema, title: titleSchema, body: bodySchema })
  .strict();
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementInputSchema>;

export const setAnnouncementPublishedInputSchema = z
  .object({ id: uuid, isPublished: z.boolean() })
  .strict();
export type SetAnnouncementPublishedInput = z.infer<typeof setAnnouncementPublishedInputSchema>;

export const fieldSchema = z.enum(["kind", "title", "body", "id", "isPublished", "request"]);
export type AnnouncementField = z.infer<typeof fieldSchema>;

// The full admin-list row shape (ADM-03-R4): every allowlisted field, including the draft flag.
export const announcementSchema = z
  .object({
    id: uuid,
    kind: kindSchema,
    title: z.string(),
    body: z.string(),
    isPublished: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict();
export type Announcement = z.infer<typeof announcementSchema>;

const mutateFailures = [
  z.object({ kind: z.literal("validation_error"), field: fieldSchema }).strict(),
  z.object({ kind: z.literal("forbidden_or_not_found") }).strict(),
  z.object({ kind: z.literal("temporarily_unavailable"), correlationId: uuid }).strict(),
] as const;

// Note: the RPC/result "kind" discriminant ("success" | "validation_error" | ...) would collide
// with the announcement's own "kind" domain field (guideline/announcement) if both lived at the
// same object level, so the single-item mutate echoes carry the category as "announcementKind"
// instead -- the UI already has the kind it submitted and never needs to round-trip it through
// this field; the full admin list (announcementSchema, above) is unaffected since there the
// domain "kind" sits one level deeper, inside each array item, never beside a "success" tag.
export const createAnnouncementResultSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("success"),
      id: uuid,
      announcementKind: kindSchema,
      title: z.string(),
      body: z.string(),
      isPublished: z.literal(false),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
    .strict(),
  ...mutateFailures,
]);
export type CreateAnnouncementResult = z.infer<typeof createAnnouncementResultSchema>;

export const updateAnnouncementResultSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("success"),
      id: uuid,
      announcementKind: kindSchema,
      title: z.string(),
      body: z.string(),
      isPublished: z.boolean(),
      updatedAt: z.string(),
    })
    .strict(),
  ...mutateFailures,
]);
export type UpdateAnnouncementResult = z.infer<typeof updateAnnouncementResultSchema>;

export const setAnnouncementPublishedResultSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("success"), id: uuid, isPublished: z.boolean() }).strict(),
  ...mutateFailures,
]);
export type SetAnnouncementPublishedResult = z.infer<typeof setAnnouncementPublishedResultSchema>;

export const listAnnouncementsForAdminResultSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("success"), items: z.array(announcementSchema) }).strict(),
  z.object({ kind: z.literal("forbidden_or_not_found") }).strict(),
  z.object({ kind: z.literal("temporarily_unavailable"), correlationId: uuid }).strict(),
]);
export type ListAnnouncementsForAdminResult = z.infer<typeof listAnnouncementsForAdminResultSchema>;
