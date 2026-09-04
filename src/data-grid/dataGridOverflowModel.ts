/**
 * Pure decision helpers for the grid's hover reveal of clipped text.
 *
 * Kept free of React and react-native imports so the rules can be unit-tested
 * under plain `node --test`; the DOM measuring and the surface live in
 * {@link useOverflowTooltip} and {@link DataGridClippedText}.
 */
import type { DataGridOverflowTooltipMode } from "./types";

/** Which surfaces a {@link DataGridOverflowTooltipMode} reveals. */
export type DataGridOverflowTargets = {
  cells: boolean;
  headers: boolean;
};

/** The measured width of a text box and of the text laid out inside it. */
export type ClippedTextMetrics = {
  /** Visible width of the box (`clientWidth`). */
  clientWidth: number;
  /** Width the text actually needs (`scrollWidth`). */
  scrollWidth: number;
};

/**
 * Sub-pixel slack, in px. Browsers round a fractional text width up, so text
 * that exactly fits can report a `scrollWidth` a pixel wider than its box —
 * without this, unclipped labels would pop a popover repeating themselves.
 */
const ROUNDING_TOLERANCE = 1;

/** Resolve a mode (defaulting to `"all"`) to the surfaces it covers. */
export function overflowTooltipTargets(
  mode: DataGridOverflowTooltipMode = "all",
): DataGridOverflowTargets {
  return { cells: mode === "all", headers: mode !== "none" };
}

/**
 * True when the text is actually cut off by its box. A box with no measured
 * width (a `display: none` subtree, or a node measured before layout) reports
 * `clientWidth: 0` and is never treated as clipped.
 */
export function isTextClipped(metrics: ClippedTextMetrics): boolean {
  if (metrics.clientWidth <= 0) {
    return false;
  }
  return metrics.scrollWidth > metrics.clientWidth + ROUNDING_TOLERANCE;
}

/**
 * The full hover rule: reveal clipped text only when the surface is enabled,
 * the text was measured and is clipped, and no pointer button is held.
 *
 * The held-button guard matters because the grid drives range selection, column
 * drags, and column resizes from the pointer: a popover appearing under the
 * cursor mid-drag would cover the very cells being painted.
 */
export function shouldRevealOnHover(options: {
  /** Pointer buttons held during the hover event (`PointerEvent.buttons`). */
  buttons: number;
  enabled: boolean;
  /** The hovered text's measurements, or null when it could not be measured. */
  metrics: ClippedTextMetrics | null;
}): boolean {
  if (!options.enabled || options.buttons > 0 || options.metrics === null) {
    return false;
  }
  return isTextClipped(options.metrics);
}

/**
 * Placement options for the reveal's popover, passed straight to
 * `DropdownPortal`. Kept here so the geometry they produce can be asserted
 * against `dropdownPlacement` without a browser.
 */
export const REVEAL_PLACEMENT = {
  align: "start",
  anchorWidthAsMinimum: false,
  gutter: 4,
  maxHeight: 220,
  maxWidth: 360,
  /**
   * Roughly one line of revealed text plus the surface's padding. This is the
   * height `dropdownPlacement` insists on fitting below the anchor before it
   * flips above, so text in the last visible row opens upward instead of being
   * pinned past the bottom of the window and clamped to an unreadable scrap.
   */
  minHeight: 48,
} as const;
