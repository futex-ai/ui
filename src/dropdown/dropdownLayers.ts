/** Shared web stacking layers for portal-backed dropdowns. */

export const DROPDOWN_LAYERS = {
  /** Resting content layer. */
  base: 0,
  /** Portal layer used by dropdown surfaces. */
  portal: 10_000,
  /** Menu surface within the portal layer. */
  surface: 10_001,
} as const;

export function dropdownPortalClearsContent(
  portalLayer: number,
  contentLayer: number,
): boolean {
  return portalLayer > contentLayer;
}
