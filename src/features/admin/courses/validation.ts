import { z } from "zod";

// Mirrors src/features/admin/accounts/validation.ts (not imported: kept self-contained per
// feature, the same convention ADM-01 used for the Student feature's own validation primitives,
// even though both admin features share one CODEOWNERS owner).
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

// ADM-02-R1: normalized to upper(trim()), 2-20 characters, A-Z0-9 plus / - _. Normalization
// happens here too (not only in the RPC) so the client never submits a code the server would
// silently rewrite before the uniqueness check.
export const codeSchema = safeText
  .transform((value) => value.trim().toUpperCase())
  .refine((value) => /^[A-Z0-9/_-]{2,20}$/.test(value));
export const nameSchema = text(200);

// Decode only scalar application fields, retaining duplicate/unknown-field rejection. Copied
// from src/features/admin/accounts/validation.ts for the same cross-feature-independence
// reason as above.
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

export const createCourseInputSchema = z.object({ code: codeSchema, name: nameSchema }).strict();
export type CreateCourseInput = z.infer<typeof createCourseInputSchema>;

export const updateCourseInputSchema = z
  .object({ courseId: uuid, code: codeSchema, name: nameSchema })
  .strict();
export type UpdateCourseInput = z.infer<typeof updateCourseInputSchema>;

export const setCourseActiveInputSchema = z
  .object({ courseId: uuid, isActive: z.boolean() })
  .strict();
export type SetCourseActiveInput = z.infer<typeof setCourseActiveInputSchema>;

export const assignLecturerInputSchema = z.object({ courseId: uuid, lecturerId: uuid }).strict();
export type AssignLecturerInput = z.infer<typeof assignLecturerInputSchema>;

export const removeAssignmentInputSchema = z.object({ assignmentId: uuid }).strict();
export type RemoveAssignmentInput = z.infer<typeof removeAssignmentInputSchema>;

// A GET search form on the courses page's own searchParams: every value arrives as a string
// (or is absent), never a real boolean, so "" / "true" / "false" are normalized here (same
// convention as admin/accounts/validation.ts's listAccountsInputSchema).
const trueFalse = z
  .string()
  .optional()
  .transform((value) => (value === "" || value === undefined ? undefined : value))
  .pipe(z.enum(["true", "false"]).optional())
  .transform((value) => (value === undefined ? undefined : value === "true"));
const optionalQuery = z
  .string()
  .optional()
  .transform((value) => (value === "" || value === undefined ? undefined : value))
  .pipe(optionalText(200).optional());
export const listCoursesInputSchema = z
  .object({ query: optionalQuery, activeFilter: trueFalse })
  .strict();
export type ListCoursesInput = z.infer<typeof listCoursesInputSchema>;

export const lecturerSchema = z
  .object({ assignmentId: uuid, lecturerId: uuid, lecturerName: z.string() })
  .strict();
export type CourseLecturer = z.infer<typeof lecturerSchema>;

export const courseSchema = z
  .object({
    id: uuid,
    code: z.string(),
    name: z.string(),
    isActive: z.boolean(),
    createdAt: z.string(),
    lecturers: z.array(lecturerSchema),
  })
  .strict();
export type Course = z.infer<typeof courseSchema>;

export const fieldSchema = z.enum([
  "code",
  "name",
  "courseId",
  "lecturerId",
  "assignmentId",
  "isActive",
  "query",
  "activeFilter",
  "request",
]);
export type CourseField = z.infer<typeof fieldSchema>;

const mutateCourseFailures = [
  z.object({ kind: z.literal("validation_error"), field: fieldSchema }).strict(),
  z.object({ kind: z.literal("conflict_duplicate_code") }).strict(),
  z.object({ kind: z.literal("forbidden_or_not_found") }).strict(),
  z.object({ kind: z.literal("temporarily_unavailable"), correlationId: uuid }).strict(),
] as const;

export const createCourseResultSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("success"),
      courseId: uuid,
      code: z.string(),
      name: z.string(),
      isActive: z.boolean(),
    })
    .strict(),
  z.object({ kind: z.literal("validation_error"), field: fieldSchema }).strict(),
  z.object({ kind: z.literal("conflict_duplicate_code") }).strict(),
  z.object({ kind: z.literal("temporarily_unavailable"), correlationId: uuid }).strict(),
]);
export type CreateCourseResult = z.infer<typeof createCourseResultSchema>;

export const updateCourseResultSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("success"),
      courseId: uuid,
      code: z.string(),
      name: z.string(),
      isActive: z.boolean(),
    })
    .strict(),
  ...mutateCourseFailures,
]);
export type UpdateCourseResult = z.infer<typeof updateCourseResultSchema>;

export const setCourseActiveResultSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("success"), courseId: uuid, isActive: z.boolean() }).strict(),
  z.object({ kind: z.literal("validation_error"), field: fieldSchema }).strict(),
  z.object({ kind: z.literal("forbidden_or_not_found") }).strict(),
  z.object({ kind: z.literal("temporarily_unavailable"), correlationId: uuid }).strict(),
]);
export type SetCourseActiveResult = z.infer<typeof setCourseActiveResultSchema>;

export const listCoursesResultSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("success"), courses: z.array(courseSchema) }).strict(),
  z.object({ kind: z.literal("validation_error"), field: fieldSchema }).strict(),
  z.object({ kind: z.literal("forbidden_or_not_found") }).strict(),
  z.object({ kind: z.literal("temporarily_unavailable"), correlationId: uuid }).strict(),
]);
export type ListCoursesResult = z.infer<typeof listCoursesResultSchema>;

export const assignLecturerResultSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("success"),
      assignmentId: uuid,
      courseId: uuid,
      lecturerId: uuid,
    })
    .strict(),
  z.object({ kind: z.literal("validation_error"), field: fieldSchema }).strict(),
  z.object({ kind: z.literal("course_not_found") }).strict(),
  z.object({ kind: z.literal("course_inactive") }).strict(),
  z.object({ kind: z.literal("lecturer_not_found") }).strict(),
  z.object({ kind: z.literal("lecturer_inactive") }).strict(),
  z.object({ kind: z.literal("lecturer_wrong_role") }).strict(),
  z.object({ kind: z.literal("conflict_duplicate_assignment") }).strict(),
  z.object({ kind: z.literal("forbidden_or_not_found") }).strict(),
  z.object({ kind: z.literal("temporarily_unavailable"), correlationId: uuid }).strict(),
]);
export type AssignLecturerResult = z.infer<typeof assignLecturerResultSchema>;

export const removeAssignmentResultSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("success"), assignmentId: uuid }).strict(),
  z.object({ kind: z.literal("validation_error"), field: fieldSchema }).strict(),
  z.object({ kind: z.literal("forbidden_or_not_found") }).strict(),
  z.object({ kind: z.literal("temporarily_unavailable"), correlationId: uuid }).strict(),
]);
export type RemoveAssignmentResult = z.infer<typeof removeAssignmentResultSchema>;
