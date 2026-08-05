/**
 * Loader geometry for {@link Avatar}. Kept as a pure sibling module — like
 * `avatarRadius.ts` — so the sizing math is unit-testable without a renderer.
 */

/**
 * Fraction of the avatar's box the dot grid occupies. Half the diameter sits
 * comfortably inside a circle's inscribed square (`size / √2 ≈ 0.707 * size`),
 * so the same ratio works for `circle` and `square` without the grid crowding a
 * rounded corner.
 */
export const AVATAR_LOADER_RATIO = 0.5;

/**
 * The smallest grid box worth drawing. `dotGridGeometry` reserves a whole pixel
 * per gap before dividing what is left across three tracks, so below six pixels
 * the rounded-up gaps push the grid wider than its own box.
 */
const MIN_LOADER_SIZE = 6;

/**
 * Resolve the dot grid's box in pixels for an avatar of `size`. Rounded to
 * whole pixels, because the grid divides its box across three tracks and a
 * fractional box would land the dots off-centre.
 */
export function avatarLoaderSize(size: number): number {
  return Math.max(MIN_LOADER_SIZE, Math.round(size * AVATAR_LOADER_RATIO));
}
