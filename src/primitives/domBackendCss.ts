/**
 * The DOM backend's stylesheet, native resolution.
 *
 * There is no DOM to style on iOS or Android, so the native build publishes an
 * empty string rather than pulling `dom/css.ts` into the bundle. The web
 * sibling exports the real rules; see `domBackendCss.web.ts`.
 */
export const domBackendCss = "";
