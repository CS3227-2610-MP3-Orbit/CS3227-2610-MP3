/**
 * SH-07-R11: the single shared utility for Geist Mono eyebrow/numeric styling, applied only to
 * eyebrow labels (e.g. sidebar group labels, stat-tile labels) and numeric stat-tile values --
 * never to ordinary body text. `font-mono` resolves to Geist Mono via the `--font-mono` token
 * registered in globals.css's `@theme inline` block (next/font/google, no runtime CDN request).
 */
export const EYEBROW_CLASS = "font-mono text-[0.6875rem] font-medium uppercase tracking-[0.08em]";

export const STAT_VALUE_CLASS = "font-mono text-2xl font-semibold tabular-nums";
