/** The geometry of a {@link Button} on a touch surface. */
import type { ViewStyle } from "../primitives/reactNative";

import { TOUCH_TARGET_SIZE } from "../touchSurface";

import type { ButtonShape } from "./Button";

/**
 * Whether a button on a touch surface reserves its target around a smaller
 * face: a `square` or `circle` whose `boxSize` is below the 44px target. The
 * face keeps the drawing of its size, and the pressable around it is the
 * 44px target, so the target occupies its own layout space.
 */
export function reservesTouchTarget(
  shape: ButtonShape,
  boxSize: number | undefined,
) {
  return (
    (shape === "square" || shape === "circle") &&
    boxSize != null &&
    boxSize < TOUCH_TARGET_SIZE
  );
}

/**
 * The shape style of a button that draws the touch metrics. A `square` or
 * `circle` is a 1:1 box of at least the 44px target, and a `rounded` button is
 * at least 44px in both dimensions. A larger `minTouchTarget` raises the
 * floor, and a `boxSize` of 44px or more sets the box outright.
 */
export function touchButtonShapeStyle({
  boxSize,
  minTouchTarget,
  pillRadius,
  shape,
}: {
  boxSize: number | undefined;
  minTouchTarget: number | undefined;
  pillRadius: number;
  shape: ButtonShape;
}): ViewStyle {
  const floor = Math.max(TOUCH_TARGET_SIZE, minTouchTarget ?? 0);
  if (shape === "square" || shape === "circle") {
    const dimension = boxSize ?? floor;
    return {
      height: dimension,
      paddingHorizontal: 0,
      width: dimension,
      ...(shape === "circle" ? { borderRadius: pillRadius } : null),
    };
  }
  return { minHeight: floor, minWidth: floor };
}
