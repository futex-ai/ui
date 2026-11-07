import { TOUCH_TARGET_SIZE } from "./touchSurface";

/**
 * The touch metrics that every family reads inside a `TouchSurface`, whatever
 * the size that the caller selects. One table keeps buttons, fields,
 * segments, and rows on the same 44px grid.
 */
export const touchControlMetrics = {
  /** The least width and height of every target. */
  target: TOUCH_TARGET_SIZE,
  /** Control labels: buttons, link buttons, tabs, and segments. */
  labelFontSize: 15,
  labelLineHeight: 20,
  labelFontWeight: "500",
  iconSize: 18,
  /** Field value text. 16px stops phone browsers zooming into a focused field. */
  fieldFontSize: 16,
  /** The input itself is the target, so its bordered frame adds the border. */
  inputHeight: TOUCH_TARGET_SIZE,
  fieldBoxHeight: TOUCH_TARGET_SIZE + 2,
  /** Single-line rows of lists and menus. */
  rowMinHeight: TOUCH_TARGET_SIZE,
  rowTitleFontSize: 15,
  rowTitleLineHeight: 20,
  rowDetailFontSize: 13,
  rowDetailLineHeight: 18,
} as const;
