// WCAG contrast-ratio math for CSS `oklch(L C H)` colours, used to verify SH-07-AC19 without a
// browser: this stays a plain, dependency-free, unit-testable module (no canvas/DOM colour
// APIs are available under Vitest's node environment).

export interface Oklch {
  l: number;
  c: number;
  h: number;
}

// Oklab -> linear sRGB (Björn Ottosson's published matrices).
function oklabToLinearSrgb(lightness: number, a: number, b: number) {
  const l_ = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = lightness - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** WCAG relative luminance of an `oklch(L C H)` colour (L in [0,1], H in degrees). */
export function relativeLuminance({ l, c, h }: Oklch): number {
  const radians = (h * Math.PI) / 180;
  const { r, g, b } = oklabToLinearSrgb(l, c * Math.cos(radians), c * Math.sin(radians));
  // The WCAG relative-luminance formula is defined over *linear* RGB -- no sRGB gamma step is
  // needed here, since oklabToLinearSrgb already returns linear-light values.
  return 0.2126 * clamp01(r) + 0.7152 * clamp01(g) + 0.0722 * clamp01(b);
}

/** WCAG contrast ratio between two colours: 1 (no contrast) to 21 (maximum). */
export function contrastRatio(a: Oklch, b: Oklch): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * The colour a translucent `foreground` (e.g. a Badge's `bg-success/10`) actually renders as
 * once composited over an opaque `background`, blended in OKLab -- the space Tailwind v4's
 * `color-mix(in oklab, ...)` opacity modifier uses for a CSS-variable colour. Used so a
 * contrast check can verify the *rendered pill* (translucent fill + solid text), not just the
 * raw token against a solid background, which is what actually determines legibility
 * (SH-07-AC19).
 */
export function blendOklab(foreground: Oklch, alpha: number, background: Oklch): Oklch {
  const fgRad = (foreground.h * Math.PI) / 180;
  const bgRad = (background.h * Math.PI) / 180;
  const fgA = foreground.c * Math.cos(fgRad);
  const fgB = foreground.c * Math.sin(fgRad);
  const bgA = background.c * Math.cos(bgRad);
  const bgB = background.c * Math.sin(bgRad);
  const l = foreground.l * alpha + background.l * (1 - alpha);
  const a = fgA * alpha + bgA * (1 - alpha);
  const b = fgB * alpha + bgB * (1 - alpha);
  // Re-derive an equivalent (c, h) pair so the result stays a plain Oklch for contrastRatio/
  // relativeLuminance -- h is irrelevant when c is ~0, which chroma() guards against NaN for.
  const c = Math.sqrt(a * a + b * b);
  const h = (Math.atan2(b, a) * 180) / Math.PI;
  return { l, c, h };
}
