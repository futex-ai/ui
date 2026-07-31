/**
 * Pixel geometry for the loader shapes.
 *
 * Every shape is described as a ratio of the resolved box size so a loader keeps
 * the same visual weight whether it is rendered at the 16px `sm` token or at an
 * explicit 64px. The ratios are rounded to whole pixels here rather than in the
 * components, so the maths stays in one place and can be unit-tested directly.
 *
 * Shapes wider than they are tall (`dots`, `bars`) report their own `width`; the
 * box height is always the resolved size.
 */

/** Columns and rows in the `dot-grid` shape. */
export const DOT_GRID_TRACKS = 3;

/** Dots in the `dots` shape. */
export const DOTS_COUNT = 3;

/** Bars in the `bars` shape. */
export const BARS_COUNT = 4;

/** Spokes in the `blades` shape. */
export const BLADES_COUNT = 10;

/** Concentric rings in the `pulse` shape. */
export const PULSE_RINGS = 3;

/**
 * The 3×3 dot grid: dot diameter, the gap between dots, and the grid's extent.
 *
 * The gap is chosen first and the dot then takes whatever whole pixels are left
 * over. Sizing the dot first and deriving the gap would let two roundings both
 * go up and push the grid past its box — at 64px that overflowed by a pixel.
 */
export function dotGridGeometry(size: number): {
  dot: number;
  extent: number;
  gap: number;
} {
  const gap = Math.max(1, Math.round(size * 0.11));
  const dot = Math.max(
    1,
    Math.floor((size - gap * (DOT_GRID_TRACKS - 1)) / DOT_GRID_TRACKS),
  );
  return {
    dot,
    extent: dot * DOT_GRID_TRACKS + gap * (DOT_GRID_TRACKS - 1),
    gap,
  };
}

/** The bouncing row: dot diameter, gap, how far a dot rises, and the row width. */
export function dotsGeometry(size: number): {
  dot: number;
  gap: number;
  lift: number;
  width: number;
} {
  const dot = Math.max(3, Math.round(size * 0.3));
  const gap = Math.max(2, Math.round(size * 0.18));
  // Cap the rise so the lifted dot cannot clip out of the box at small sizes.
  const lift = Math.max(1, Math.min(Math.round(size * 0.2), (size - dot) / 2));
  return {
    dot,
    gap,
    lift,
    width: dot * DOTS_COUNT + gap * (DOTS_COUNT - 1),
  };
}

/** The equalizer: bar width, the gap between bars, and the row width. */
export function barsGeometry(size: number): {
  bar: number;
  gap: number;
  width: number;
} {
  const bar = Math.max(2, Math.round(size * 0.18));
  const gap = Math.max(2, Math.round(size * 0.12));
  return { bar, gap, width: bar * BARS_COUNT + gap * (BARS_COUNT - 1) };
}

/**
 * A single spoke: its size, and `offset`, the distance it is pushed out from the
 * box centre so its outer end lands on the box edge.
 */
export function bladesGeometry(size: number): {
  height: number;
  offset: number;
  width: number;
} {
  const width = Math.max(2, Math.round(size * 0.1));
  const height = Math.max(4, Math.round(size * 0.28));
  return { height, offset: (size - height) / 2, width };
}

/** A ripple ring's stroke width. */
export function pulseGeometry(size: number): { thickness: number } {
  return { thickness: Math.max(1, Math.round(size * 0.08)) };
}
