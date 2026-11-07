/**
 * The metrics that the mockups propose for the new dense `xs` size and for
 * touch surfaces, in px. Every drawn part reads them from here, so the size
 * tables of the implementation can take them from one place.
 */

/** The metrics of the controls of one kind of surface. */
export type ControlMetrics = {
  /** The height of buttons, fields, selectors, and tabs. */
  height: number;
  /** The label of a button or a tab. */
  labelSize: number;
  labelLine: number;
  /** Lighter than the bold label of the existing sizes. */
  labelWeight: "500";
  /** The value text of a field or a selector. */
  fieldText: number;
  paddingX: number;
  fieldPaddingX: number;
  gap: number;
  iconSize: number;
};

/** The metrics of the rows of one kind of surface: lists and menus. */
export type RowMetrics = {
  /** A single-line row. A longer row grows with its content. */
  minHeight: number;
  paddingX: number;
  paddingY: number;
  gap: number;
  titleSize: number;
  titleLine: number;
  detailSize: number;
  detailLine: number;
  iconSize: number;
};

/** The dense `xs` controls of a desktop surface. */
export const denseControl: ControlMetrics = {
  height: 26,
  labelSize: 12,
  labelLine: 16,
  labelWeight: "500",
  fieldText: 13,
  paddingX: 10,
  fieldPaddingX: 8,
  gap: 6,
  iconSize: 14,
};

/**
 * The controls of a touch surface, such as a phone: 44 px targets. A text
 * field's input is itself 44 px, so its bordered box is 46 px, and an action
 * inside a field, such as Clear, is a 44 px box too.
 */
export const touchControl: ControlMetrics = {
  height: 44,
  labelSize: 15,
  labelLine: 20,
  labelWeight: "500",
  fieldText: 16,
  paddingX: 16,
  fieldPaddingX: 12,
  gap: 8,
  iconSize: 18,
};

/** The dense `xs` rows of a desktop surface: 26 px for one line. */
export const denseRow: RowMetrics = {
  minHeight: 26,
  paddingX: 8,
  paddingY: 4,
  gap: 8,
  titleSize: 13,
  titleLine: 18,
  detailSize: 12,
  detailLine: 16,
  iconSize: 14,
};

/** The rows of a touch surface: 44 px for one line. */
export const touchRow: RowMetrics = {
  minHeight: 44,
  paddingX: 16,
  paddingY: 12,
  gap: 12,
  titleSize: 15,
  titleLine: 20,
  detailSize: 13,
  detailLine: 18,
  iconSize: 18,
};

/** The width of a resizable panel, and the range of a resize, in px. */
export type PanelWidth = { value: number; min: number; max: number };

/** The project list beside the main column. */
export const sidebarWidth: PanelWidth = { value: 232, min: 200, max: 360 };

/** The changes panel on the other side of the main column. */
export const detailWidth: PanelWidth = { value: 340, min: 280, max: 520 };

/** The width change of one arrow key press on a focused resize handle. */
export const resizeStep = 16;
