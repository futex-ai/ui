/**
 * Stacking-layer (z-index) tokens for the date fields.
 *
 * React Native Web renders every `View` with `position: relative` and an
 * explicit `z-index: 0`, so each one forms its own stacking context at the same
 * elevation and paints in DOM order. The web calendar is positioned with
 * `position: absolute`, so it stays trapped behind any later sibling whose
 * wrapper rests at the same elevation — even though the calendar sets its own
 * high `z-index`, because that inner value only orders children *within* its
 * wrapper's context.
 *
 * Two wrappers must therefore be lifted while a calendar is open: the field root
 * (so the calendar paints over the form fields that follow it) and, in
 * {@link DateRangeField}, the endpoints' row (so the calendar — nested one level
 * deeper inside the row — escapes the row's later-DOM hint and error siblings).
 * `base` is the resting elevation of a closed field, the row at rest, and that
 * ordinary later-DOM content.
 */
export const DATE_FIELD_LAYERS = {
  /** Resting elevation of closed fields, the range row, and later-DOM siblings. */
  base: 0,
  /** Elevation of an open field root and the range row while an endpoint is open. */
  open: 1_000_000,
} as const;

/** Default or consumer-supplied elevation for an open calendar field/popover. */
export function dateFieldZIndex(zIndex?: number): number {
  return zIndex ?? DATE_FIELD_LAYERS.open;
}

/**
 * Whether a field/row lifted to `fieldLayer` while open paints above sibling
 * content resting at `siblingLayer`.
 *
 * In React Native Web an open calendar only escapes its later siblings when its
 * wrapper's stacking context strictly outranks them, so the calendar is visible
 * iff the wrapper sits strictly above that content.
 */
export function openFieldClearsSiblings(
  fieldLayer: number,
  siblingLayer: number,
): boolean {
  return fieldLayer > siblingLayer;
}
