/**
 * Corner-radius geometry for {@link Avatar}. Kept as a pure sibling module —
 * like `animatedBorderGeometry.ts` — so the shape math is unit-testable
 * without a renderer.
 */

/**
 * `circle` is a full disc; `square` is the same 1:1 box with proportionally
 * rounded corners. Mirrors `ButtonShape`'s meaning of `square`.
 */
export type AvatarShape = "circle" | "square";

/** Above half the box a "rounded square" is just a circle, so clamp there. */
const MAX_RATIO = 0.5;

/**
 * Resolve the avatar's `borderRadius` in pixels. A `circle` is always half the
 * diameter. A `square` scales its radius with `size` from the theme's
 * `radii.avatarRatio`, so the corner looks identical at every size; the ratio
 * is clamped to `[0, 0.5]` so a bad theme override cannot render a negative
 * corner, an accidental disc, or `NaN`.
 */
export function avatarBorderRadius(
  size: number,
  shape: AvatarShape,
  ratio: number,
): number {
  if (shape === "circle") return size / 2;
  const clamped = Number.isFinite(ratio)
    ? Math.min(Math.max(ratio, 0), MAX_RATIO)
    : 0;
  return size * clamped;
}
