/** Shared web stacking layers for drag-selectable overlays. */

export const DRAG_SELECTABLE_LAYERS = {
  /** Body portal layer for the marquee and live count badge. */
  overlay: 1_000_050,
} as const;

export function dragSelectableOverlayClearsSurface(
  overlayLayer: number,
  surfaceLayer: number,
): boolean {
  return overlayLayer > surfaceLayer;
}
