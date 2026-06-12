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
  gutter?: number;
  margin?: number;
  maxHeight?: number;
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

export function dropdownPlacement(
  anchor: DropdownAnchorRect,
  viewport: DropdownViewport,
  options: DropdownPlacementOptions = {},
): DropdownPlacement {
  const margin = options.margin ?? DEFAULT_MARGIN;
  const gutter = options.gutter ?? DEFAULT_GUTTER;
  const maxHeight = options.maxHeight ?? DEFAULT_MAX_HEIGHT;
  const minHeight = options.minHeight ?? DEFAULT_MIN_HEIGHT;
  const width = Math.min(
    Math.max(options.minWidth ?? 0, anchor.width),
    Math.max(anchor.width, viewport.width - margin * 2),
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
    spaceBelow >= Math.min(minHeight, maxHeight) || spaceBelow >= spaceAbove
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
