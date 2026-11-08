/**
 * The panel widths of the desktop layout, in px. The caller owns each width
 * and its bounds. The bounds leave room for the main column.
 */

/** The width of a resizable panel, and the range of a resize, in px. */
export type PanelWidth = { value: number; min: number; max: number };

/** The project list beside the main column. */
export const sidebarWidth: PanelWidth = { value: 232, min: 200, max: 360 };

/** The changes panel on the other side of the main column. */
export const detailWidth: PanelWidth = { value: 340, min: 280, max: 520 };
