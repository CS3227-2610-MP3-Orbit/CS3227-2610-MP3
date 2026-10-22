const ALLOWED_KEYS = new Set(["lecturerId", "courseId", "date", "cursor"]);
const CANONICAL_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const CURSOR = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export type BrowseAvailableSlotsInput = {
  lecturerId?: string;
  courseId?: string;
  date?: string;
  cursor?: string;
};

export type RawBrowseSearchParams = Record<string, string | string[] | undefined>;

export type BrowseInputResult =
  | { ok: true; input: BrowseAvailableSlotsInput }
  | {
      ok: false;
      field: keyof BrowseAvailableSlotsInput | "query";
      message: string;
      input?: BrowseAvailableSlotsInput;
    };

function isRealDate(value: string) {
  const match = DATE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function encodedLength(params: RawBrowseSearchParams) {
  const encoded = new URLSearchParams();
  for (const [key, raw] of Object.entries(params)) {
    if (Array.isArray(raw)) raw.forEach((value) => encoded.append(key, value));
    else if (raw !== undefined) encoded.append(key, raw);
  }
  return encoded.toString().length;
}

/** Validate the complete public query contract before any database call. */
export function parseBrowseInput(params: RawBrowseSearchParams): BrowseInputResult {
  for (const [key, raw] of Object.entries(params)) {
    if (!ALLOWED_KEYS.has(key)) {
      return { ok: false, field: "query", message: "An unsupported filter was supplied." };
    }
    if (Array.isArray(raw)) {
      return {
        ok: false,
        field: key as keyof BrowseAvailableSlotsInput,
        message: "Use one value per filter.",
      };
    }
    if (raw !== undefined && typeof raw !== "string") {
      return {
        ok: false,
        field: key as keyof BrowseAvailableSlotsInput,
        message: "Use a text value for each filter.",
      };
    }
  }

  if (encodedLength(params) > 2_048) {
    return { ok: false, field: "query", message: "The filter request is too long." };
  }

  const lecturerId =
    typeof params.lecturerId === "string" ? params.lecturerId || undefined : undefined;
  const courseId = typeof params.courseId === "string" ? params.courseId || undefined : undefined;
  const date = typeof params.date === "string" ? params.date || undefined : undefined;
  const cursor = typeof params.cursor === "string" ? params.cursor || undefined : undefined;

  if (lecturerId && !CANONICAL_UUID.test(lecturerId)) {
    return { ok: false, field: "lecturerId", message: "Select a valid lecturer." };
  }
  if (courseId && !CANONICAL_UUID.test(courseId)) {
    return { ok: false, field: "courseId", message: "Select a valid course." };
  }
  if (date && !isRealDate(date)) {
    return { ok: false, field: "date", message: "Enter a real date in YYYY-MM-DD format." };
  }
  if (cursor && (cursor.length > 512 || !CURSOR.test(cursor))) {
    return {
      ok: false,
      field: "cursor",
      message: "This page link is invalid. Restart from the first page.",
      input: { lecturerId, courseId, date },
    };
  }

  return { ok: true, input: { lecturerId, courseId, date, cursor } };
}

export function filtersToQuery(input: BrowseAvailableSlotsInput, includeCursor = true) {
  const query = new URLSearchParams();
  if (input.lecturerId) query.set("lecturerId", input.lecturerId);
  if (input.courseId) query.set("courseId", input.courseId);
  if (input.date) query.set("date", input.date);
  if (includeCursor && input.cursor) query.set("cursor", input.cursor);
  return query.toString();
}
