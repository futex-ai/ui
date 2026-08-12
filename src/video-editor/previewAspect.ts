/**
 * Frame-shape maths for {@link PreviewSurface}. Pure and free of any runtime
 * `react-native` import, so `node --test` can exercise it directly.
 */

/** Named frame shapes, or an explicit width / height ratio. */
export type PreviewAspect = "1:1" | "2.39:1" | "4:3" | "9:16" | "16:9" | number;

const NAMED_ASPECTS: Record<string, number> = {
  "1:1": 1,
  "2.39:1": 2.39,
  "4:3": 4 / 3,
  "9:16": 9 / 16,
  "16:9": 16 / 9,
};

/**
 * Resolves an aspect to a numeric width / height ratio. An unknown name or a
 * non-positive number would collapse the frame, so both fall back to 16:9.
 */
export function aspectRatioOf(aspect: PreviewAspect): number {
  if (typeof aspect === "number") {
    return aspect > 0 ? aspect : 16 / 9;
  }
  return NAMED_ASPECTS[aspect] ?? 16 / 9;
}

/**
 * Fractions of the frame that the action-safe and title-safe rectangles inset
 * by — the broadcast convention of 5% and 10%.
 */
export const SAFE_INSETS = { action: 0.05, title: 0.1 } as const;
