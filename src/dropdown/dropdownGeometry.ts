/** Geometry helpers for web dropdown placement. */

export type DropdownAnchorRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type DropdownViewport = {
  height: number;
  width: number;
};

export type DropdownPlacementSide = "bottom" | "top";

export type DropdownPlacementOptions = {
  align?: "end" | "start";
  /** Keep the popup at least as wide as its anchor. Defaults to `true`. */
  anchorWidthAsMinimum?: boolean;
  gutter?: number;
  margin?: number;
  /** Tallest the popup grows before it clamps. Defaults to `320`. */
  maxHeight?: number;
  maxWidth?: number;
  /**
   * Least room the popup needs below its anchor to open there; with less, it
   * flips above whenever that side is roomier. A measured popup (every web
   * portal surface) needs its own height as well, whichever is larger, so
   * this only raises the bar — for example to keep room for a list that
   * grows while open. Where the popup is not measured (native), this alone
   * decides, and defaults to `140`, which suits a scrolling list.
   */
  minHeight?: number;
  minWidth?: number;
};

export type DropdownPlacement = {
  bottom?: number;
  left: number;
  maxHeight: number;
  side: DropdownPlacementSide;
  top?: number;
  width: number;
};

export type DropdownPoint = {
  x: number;
  y: number;
};

export type DropdownClientRect = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

/** True when a viewport point lies inside any of the given client rects. */
export function dropdownPointWithinRects(
  point: DropdownPoint,
  rects: Array<DropdownClientRect | null>,
): boolean {
  return rects.some(
    (rect) =>
      rect !== null &&
      point.x >= rect.left &&
      point.x <= rect.right &&
      point.y >= rect.top &&
      point.y <= rect.bottom,
  );
}

const DEFAULT_GUTTER = 6;
const DEFAULT_MARGIN = 8;
const DEFAULT_MAX_HEIGHT = 320;
const DEFAULT_MIN_HEIGHT = 140;

/** Default content-width cap for selector popups before viewport clamping. */
export const DEFAULT_DROPDOWN_MAX_WIDTH = 360;

/** Resolved horizontal bounds for a dropdown surface. */
export type DropdownWidthBounds = {
  maxWidth: number;
  minWidth: number;
};

/**
 * Uses the trigger as the popup's minimum width by default, honors an explicit
 * opt-out for compact surfaces, and clamps caller bounds to the viewport.
 */
export function dropdownWidthBounds(
  anchor: DropdownAnchorRect,
  viewport: DropdownViewport,
  options: DropdownPlacementOptions = {},
): DropdownWidthBounds {
  const margin = options.margin ?? DEFAULT_MARGIN;
  const availableWidth = Math.max(1, viewport.width - margin * 2);
  const anchorMinimum =
    options.anchorWidthAsMinimum === false ? 0 : anchor.width;
  const minWidth = Math.min(
    Math.max(anchorMinimum, options.minWidth ?? 0),
    availableWidth,
  );
  const maxWidth = Math.min(
    Math.max(minWidth, options.maxWidth ?? availableWidth),
    availableWidth,
  );
  return { maxWidth, minWidth };
}

/**
 * Places a popup beside its anchor: below when the room it needs fits there,
 * otherwise on whichever side is roomier, clamped to that side's room.
 *
 * Pass the popup's rendered `surfaceHeight` (border box) once it is known, so
 * the room it needs is its real size rather than the `minHeight` guess.
 */
export function dropdownPlacement(
  anchor: DropdownAnchorRect,
  viewport: DropdownViewport,
  options: DropdownPlacementOptions = {},
  preferredWidth = anchor.width,
  surfaceHeight?: number,
): DropdownPlacement {
  const margin = options.margin ?? DEFAULT_MARGIN;
  const gutter = options.gutter ?? DEFAULT_GUTTER;
  const maxHeight = options.maxHeight ?? DEFAULT_MAX_HEIGHT;
  const widthBounds = dropdownWidthBounds(anchor, viewport, options);
  const width = clamp(
    preferredWidth,
    widthBounds.minWidth,
    widthBounds.maxWidth,
  );
  const alignedLeft =
    options.align === "end" ? anchor.x + anchor.width - width : anchor.x;
  const left = clamp(
    alignedLeft,
    margin,
    Math.max(margin, viewport.width - width - margin),
  );
  const spaceBelow =
    viewport.height - (anchor.y + anchor.height + gutter) - margin;
  const spaceAbove = anchor.y - gutter - margin;
  const side =
    spaceBelow >= requiredRoom(options, maxHeight, surfaceHeight) ||
    spaceBelow >= spaceAbove
      ? "bottom"
      : "top";
  const available = Math.max(64, side === "bottom" ? spaceBelow : spaceAbove);
  const height = Math.min(maxHeight, available);
  if (side === "top") {
    return {
      bottom: Math.max(margin, viewport.height - anchor.y + gutter),
      left,
      maxHeight: height,
      side,
      width,
    };
  }

  return {
    left,
    maxHeight: height,
    side,
    top: anchor.y + anchor.height + gutter,
    width,
  };
}

/**
 * The placement a surface is first laid out at so its height can be measured:
 * where {@link dropdownPlacement} would put it unmeasured, but clamped only by
 * `maxHeight`, never by the room on that side, so what renders is the height
 * the surface wants.
 */
export function dropdownMeasuringPlacement(
  anchor: DropdownAnchorRect,
  viewport: DropdownViewport,
  options: DropdownPlacementOptions = {},
  preferredWidth = anchor.width,
): DropdownPlacement {
  return {
    ...dropdownPlacement(anchor, viewport, options, preferredWidth),
    maxHeight: options.maxHeight ?? DEFAULT_MAX_HEIGHT,
  };
}

/**
 * Room the popup needs below its anchor to open there, never more than it can
 * grow to: its measured height (raised to any `minHeight`), or `minHeight`
 * alone while unmeasured.
 */
function requiredRoom(
  options: DropdownPlacementOptions,
  maxHeight: number,
  surfaceHeight: number | undefined,
): number {
  const needed =
    surfaceHeight === undefined
      ? (options.minHeight ?? DEFAULT_MIN_HEIGHT)
      : Math.max(surfaceHeight, options.minHeight ?? 0);
  return Math.min(needed, maxHeight);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
