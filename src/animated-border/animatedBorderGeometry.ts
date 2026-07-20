/**
 * Pure geometry the {@link AnimatedBorder} traces — the rounded-rectangle path
 * maths plus the comet-trail layer stack. It imports nothing from
 * `react-native`, so it is unit-testable on its own; the animated component and
 * the `StyleSheet` styles live alongside it in this folder.
 */

/**
 * How much the {@link AnimatedBorder} rounds the box it traces: it follows the
 * given `borderRadius` (`"rounded-rect"`, the default) or fully rounds the box
 * (`"circle"`). Because React Native `borderRadius` only ever produces circles
 * and stadiums (never ellipses), "fully rounded" is a true circle for a square
 * box and an elongated stadium ("pill") for a non-square one — matching the
 * framed element in both cases.
 */
export type AnimatedBorderShape = "circle" | "rounded-rect";

/**
 * The stroked-rect geometry the {@link AnimatedBorder} traces. The visible
 * border is a rounded rectangle inset by half the stroke width so the whole
 * stroke stays inside the box, and `perimeter` is the exact length of that
 * inset path — the unit that the dashed trail segments and their offsets are
 * measured in.
 */
export type AnimatedBorderGeometry = {
  /** Inset of the stroked rect on x and y, half the stroke width. */
  origin: number;
  /** Total length of the inset rounded-rect path. */
  perimeter: number;
  /** Corner radius of the inset rect, floored at 0. */
  radius: number;
  /** Height of the inset rect. */
  rectHeight: number;
  /** Width of the inset rect. */
  rectWidth: number;
};

/**
 * Resolve the box `width` / `height`, `borderRadius`, `borderWidth`, and `shape`
 * into the stroked-rect geometry. The stroke is centered on the rect edge, so
 * the rect is inset by half the stroke width on every side and its radius pulled
 * in to match. The radius is clamped to half the shorter side — exactly what SVG
 * does to `rx` — so the perimeter matches the path the renderer actually draws
 * and the dashes stay aligned to the corners even when `borderRadius` is large
 * (a pill). `shape: "circle"` ignores `borderRadius` and uses that maximum
 * directly, so a square box traces a true circle and a non-square box an
 * elongated stadium. The perimeter is the four straight edges (each shortened by
 * a corner radius at both ends) plus the four quarter-circle corners, which
 * together make one full circle of circumference `2πr` — so the same formula
 * holds for a square badge, a wide pill, or a full circle.
 */
export function resolveAnimatedBorderGeometry({
  borderRadius,
  borderWidth,
  height,
  shape = "rounded-rect",
  width,
}: {
  borderRadius: number;
  borderWidth: number;
  height: number;
  shape?: AnimatedBorderShape;
  width: number;
}): AnimatedBorderGeometry {
  const origin = borderWidth / 2;
  const rectWidth = Math.max(width - borderWidth, 0);
  const rectHeight = Math.max(height - borderWidth, 0);
  const maxRadius = Math.min(rectWidth, rectHeight) / 2;
  // "circle" fully rounds the box (a true circle when square, a stadium when
  // not), so its radius is simply the maximum the box allows.
  const targetRadius =
    shape === "circle" ? maxRadius : borderRadius - borderWidth / 2;
  const radius = Math.min(Math.max(targetRadius, 0), maxRadius);
  const perimeter =
    2 * (rectWidth + rectHeight) - 8 * radius + 2 * Math.PI * radius;
  return { origin, perimeter, radius, rectHeight, rectWidth };
}

/**
 * One segment of the comet trail: a dash drawn along the path, its starting
 * offset, and the opacity it is drawn at.
 */
export type AnimatedBorderTrailLayer = {
  /** Drawn dash length in path units; the bright head is the shortest. */
  dash: number;
  /** Stable React key for the segment. */
  key: string;
  /** Starting dash offset so each segment trails the one ahead of it. */
  lag: number;
  /** Stroke opacity; the short head is brightest, the long tail faintest. */
  opacity: number;
};

/**
 * Build the stack of trailing dash segments that make up the comet trail. The
 * last layer is the bright, short head (`opacity` 1, `dash` one `spacing`); each
 * earlier layer is one `spacing` longer and proportionally fainter (`1 / order`)
 * so the segments fan out into a fading tail behind the head. Every layer is
 * offset by `lag` so they sit one behind the next as they chase the path.
 */
export function createAnimatedBorderTrail(
  count: number,
  spacing: number,
): AnimatedBorderTrailLayer[] {
  return Array.from({ length: count }, (_, index) => {
    const order = count - index;
    const dash = order * spacing;
    return {
      dash,
      key: `trail-${order}`,
      lag: dash - spacing,
      opacity: 1 / order,
    };
  });
}
