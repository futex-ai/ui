/**
 * The attribute that marks a live region that the library owns, such as the
 * regions that `announce` writes to and the toast live region. An open web
 * modal hides the rest of the page from assistive tech, but never a marked
 * node, so status messages stay audible while the modal is open (WCAG 4.1.3).
 */
export const LIVE_REGION_ATTRIBUTE = "data-firna-live-region";

/**
 * The same marker in the `dataSet` spelling, for a library `View`: the web
 * backend writes each `dataSet` key out as a `data-*` attribute, so this
 * becomes {@link LIVE_REGION_ATTRIBUTE}.
 */
export const LIVE_REGION_DATA_SET = { firnaLiveRegion: "true" } as const;
