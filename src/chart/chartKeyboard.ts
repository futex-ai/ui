/**
 * Keyboard navigation model for a chart's hit layer. Pure index maths, kept
 * out of the component so it is unit-testable without pulling React Native in.
 */

/**
 * Resolve the next stop for a navigation key, or `null` when the key is not
 * handled and should keep bubbling.
 *
 * Movement clamps rather than wraps: wrapping from the last category back to
 * the first reads as a jump backwards in time on a chart whose x axis is
 * ordered. Mirrors the `Heatmap` model so keyboard behaviour is consistent
 * across the library's data visualizations.
 */
export function nextHitIndex(
  key: string,
  current: number,
  count: number,
): number | null {
  if (count <= 0) {
    return null;
  }
  switch (key) {
    case "ArrowRight":
    case "ArrowDown":
      return Math.min(count - 1, current + 1);
    case "ArrowLeft":
    case "ArrowUp":
      return Math.max(0, current - 1);
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
}
