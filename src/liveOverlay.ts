/** Shared marker for body-level overlays that stay live above web dialogs. */

/** The web modal stack never makes a body-level node with this attribute inert. */
export const LIVE_OVERLAY_ATTRIBUTE = "data-firna-live-overlay";

/** View dataSet marker for a body-level node the web modal stack never inerts. */
export const LIVE_OVERLAY_DATA_SET = { firnaLiveOverlay: "" } as const;
