import { z } from "zod";

const malformedUnicode = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u;
const plain = (max: number) =>
  z
    .string()
    .refine((value) => !value.includes("\0") && !malformedUnicode.test(value))
    .transform((value) => value.trim())
    .refine((value) => [...value].length >= 1 && [...value].length <= max);

export const adviceSchema = z
  .object({ topic: plain(200), questions: plain(2000), suggestions: z.array(plain(500)).max(5) })
  .strict();
export type Advice = z.infer<typeof adviceSchema>;

/** Safe-parse an exact, bounded JSON provider response. No prose/fences are accepted. */
export function parseAdvice(raw: string) {
  if (raw.length > 6_000 || raw.includes("\0") || malformedUnicode.test(raw))
    return { success: false as const };
  try {
    return adviceSchema.safeParse(JSON.parse(raw));
  } catch {
    return { success: false as const };
  }
}
