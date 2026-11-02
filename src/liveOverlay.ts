/** Shared marker for body-level overlays that stay live above web dialogs. */

/** The web modal stack never makes a body-level node with this attribute inert. */
export const LIVE_OVERLAY_ATTRIBUTE = "data-firna-live-overlay";

/** View dataSet marker for a body-level node the web modal stack never inerts. */
export const LIVE_OVERLAY_DATA_SET = { firnaLiveOverlay: "" } as const;

/**
 * The marker as props to spread on a primitive `View`. Spread them instead of
 * passing `dataSet` as an attribute: React Native's `ViewProps` has no
 * `dataSet`, so the attribute fails the native typecheck. The web backend
 * renders {@link LIVE_OVERLAY_ATTRIBUTE}, and native ignores the marker.
 */
export const LIVE_OVERLAY_VIEW_PROPS = {
  dataSet: LIVE_OVERLAY_DATA_SET,
} as const;
