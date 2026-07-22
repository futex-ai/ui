/**
 * Stacking-layer (z-index) tokens for the date fields.
 *
 * The web calendar renders through a fixed body portal, so it escapes ancestor
 * stacking contexts and scroll clipping. `open` is the portal's default layer
 * and is also applied to open trigger wrappers so their active chrome stays
 * above overlapping sibling content. `base` is the resting field elevation.
 */
export const DATE_FIELD_LAYERS = {
  /** Resting elevation of closed fields, the range row, and later-DOM siblings. */
  base: 0,
  /** Elevation of an open field root and the range row while an endpoint is open. */
  open: 1_000_000,
} as const;

/** Default or consumer-supplied elevation for an open web calendar portal. */
export function dateFieldZIndex(zIndex?: number): number {
  return zIndex ?? DATE_FIELD_LAYERS.open;
}

/**
 * Whether a field/row lifted to `fieldLayer` while open paints above sibling
 * content resting at `siblingLayer`.
 *
 * This models ordinary sibling stacking for the trigger wrappers; the portaled
 * calendar itself is outside those local contexts.
 */
export function openFieldClearsSiblings(
  fieldLayer: number,
  siblingLayer: number,
): boolean {
  return fieldLayer > siblingLayer;
}
