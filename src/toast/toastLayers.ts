/** Shared web stacking layer for the toast viewport. */

/**
 * Toast notifications float above every other overlay surface. The viewport
 * sits above the modal portal, the nested overlay floor used by dropdowns
 * opened inside modals (`WEB_MODAL_LAYERS.nestedOverlay`, 1_000_000), and the
 * cookie-consent banner (`COOKIE_CONSENT_LAYERS.banner`, 1_000_100) so a toast
 * is never occluded by chrome — a confirmation or error must always be visible.
 */
export const TOAST_LAYERS = {
  /** Full-viewport toast region (web `position: fixed`). */
  viewport: 1_000_200,
} as const;

/** Whether the toast viewport renders above a given overlay layer. */
export function toastClearsLayer(
  toastLayer: number,
  overlayLayer: number,
): boolean {
  return toastLayer > overlayLayer;
}
