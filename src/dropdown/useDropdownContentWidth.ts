/** Measured-width state for aligning an intrinsically sized dropdown surface. */
import { useCallback, useState } from "react";
import type { LayoutChangeEvent } from "react-native";

const WIDTH_TOLERANCE = 0.5;

/**
 * Tracks the rendered intrinsic width so placement can clamp or end-align the
 * surface after layout without creating sub-pixel update loops.
 */
export function useDropdownContentWidth(enabled: boolean) {
  const [width, setWidth] = useState<number | null>(null);
  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (!enabled) {
        return;
      }
      const nextWidth = event.nativeEvent.layout.width;
      if (!Number.isFinite(nextWidth) || nextWidth <= 0) {
        return;
      }
      setWidth((currentWidth) =>
        currentWidth !== null &&
        Math.abs(currentWidth - nextWidth) < WIDTH_TOLERANCE
          ? currentWidth
          : nextWidth,
      );
    },
    [enabled],
  );
  return {
    onLayout: enabled ? onLayout : undefined,
    width: enabled ? width : null,
  };
}
