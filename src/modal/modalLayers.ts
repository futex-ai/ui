/** Shared web stacking layers for modal-backed surfaces. */

export const WEB_MODAL_LAYERS = {
  /** Resting product content. */
  base: 0,
  /** Full-viewport modal portal layer. */
  portal: 9_000,
  /** Modal backdrop within the portal. */
  backdrop: 9_001,
  /** Modal surface within the portal. */
  surface: 9_002,
  /** Nested overlay floor for dropdowns and comboboxes opened inside modals. */
  nestedOverlay: 10_000,
} as const;

/**
 * Cookie-consent stacking layer. The non-blocking marketing consent banner
 * floats above every modal/dropdown surface (which top out at `nestedOverlay`
 * 10_000) so page chrome can never occlude it.
 */
export const COOKIE_CONSENT_LAYERS = {
  /** The fixed first-visit consent banner. */
  banner: 10_100,
} as const;

export function webModalClearsContent(
  modalLayer: number,
  contentLayer: number,
): boolean {
  return modalLayer > contentLayer;
}
export function webModalSurfaceClearsBackdrop(
  surfaceLayer: number,
  backdropLayer: number,
): boolean {
  return surfaceLayer > backdropLayer;
}
