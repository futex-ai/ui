/** Shared web stacking layers for portal-backed dropdowns. */

export const DROPDOWN_LAYERS = {
  /** Resting content layer. */
  base: 0,
  /** Portal layer used by dropdown surfaces. */
  portal: 1_000_000,
  /** Menu surface within the portal layer. */
  surface: 1_000_001,
} as const;

/** Default or consumer-supplied z-index for the dropdown portal layer. */
export function dropdownPortalZIndex(zIndex?: number): number {
  return zIndex ?? DROPDOWN_LAYERS.portal;
}

export function dropdownPortalClearsContent(
  portalLayer: number,
  contentLayer: number,
): boolean {
  return portalLayer > contentLayer;
}
