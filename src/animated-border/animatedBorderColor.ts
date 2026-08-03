/**
 * Pure resolution of the {@link AnimatedBorder} trail color into the value its
 * SVG `stroke` takes — a plain color, or a reference to a two-color gradient the
 * component defines alongside the trail. Like the geometry beside it, this
 * imports nothing from `react-native`, so it is unit-testable on its own.
 */

/**
 * Trail color: one color, or a `[from, to]` pair drawn as a gradient.
 *
 * A pair lets a trail carry a brand color pair — the connected app's primary and
 * secondary, say — so the border says both "this is working" and "this is whose
 * work it is". Passing the same color twice renders exactly as passing it once.
 */
export type AnimatedBorderColor = string | readonly [string, string];

/**
 * The two colors of a resolved trail gradient. `from` is drawn at both ends of
 * the sweep and `to` through the middle, so the pair reads symmetrically around
 * the box (`from → to → from`) rather than as a one-way ramp that leaves the two
 * sides of the border looking mismatched.
 */
export type AnimatedBorderGradient = {
  /** Color at both ends of the sweep — the pair's first entry. */
  from: string;
  /** Color through the middle of the sweep — the pair's second entry. */
  to: string;
};

/** How the trail (and the reduced-motion outline) should be stroked. */
export type AnimatedBorderStroke = {
  /** Gradient to define in `<Defs>`, or `null` when the trail is one color. */
  gradient: AnimatedBorderGradient | null;
  /** Value for the SVG `stroke` prop: a color, or a `url(#…)` gradient reference. */
  stroke: string;
};

/**
 * Build the SVG id for a trail gradient from a `useId` value. React's raw output
 * is not a safe fragment reference on its own — it has carried colons (React 18)
 * and guillemets (React 19.0) — and either one breaks the `url(#…)` the stroke
 * points at, leaving the trail unpainted. Keep only plain id characters; the
 * digits that distinguish one `useId` value from the next always survive, so the
 * result stays unique per instance.
 */
export function animatedBorderGradientId(rawId: string): string {
  return `animated-border-trail-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

/**
 * Resolve the `color` prop into a stroke value, falling back to the given theme
 * color when it is omitted. A single color strokes the trail directly; a
 * `[from, to]` pair strokes it with `url(#gradientId)` and asks the caller to
 * define that gradient. A pair of identical colors resolves to the solid case:
 * the rendered result is the same, so a caller that only has one brand color can
 * repeat it rather than branch, and the component skips a `<Defs>` whose stops
 * would all match.
 */
export function resolveAnimatedBorderStroke({
  color,
  fallback,
  gradientId,
}: {
  color: AnimatedBorderColor | undefined;
  fallback: string;
  gradientId: string;
}): AnimatedBorderStroke {
  const resolved = color ?? fallback;
  if (typeof resolved === "string") {
    return { gradient: null, stroke: resolved };
  }

  const [from, to] = resolved;
  if (from === to) {
    return { gradient: null, stroke: from };
  }

  return { gradient: { from, to }, stroke: `url(#${gradientId})` };
}
