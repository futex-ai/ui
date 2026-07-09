/** Pure sizing helper shared by the Sheet's platform builds. */

/**
 * The sheet body never grows past this fraction of the viewport height, so a
 * tall body scrolls inside the sheet instead of covering the whole screen.
 */
export const SHEET_VIEWPORT_RATIO = 0.7;

/**
 * The body cap for a sheet: the smaller of an optional explicit `cap` and
 * ~70% of the viewport. With no `cap` it is just the viewport fraction. Never
 * negative, and rounded to a whole pixel.
 */
export function sheetMaxHeight(
  cap: number | undefined,
  viewportHeight: number,
): number {
  const viewportCap = viewportHeight * SHEET_VIEWPORT_RATIO;
  const bounded = cap === undefined ? viewportCap : Math.min(cap, viewportCap);
  return Math.round(Math.max(0, bounded));
}
