/** Web intrinsic-width constraints for content-sized dropdown surfaces. */
import type { ViewStyle } from "react-native";

import type { DropdownWidthBounds } from "./dropdownGeometry";

const maxContentWidth = "max-content" as unknown as ViewStyle["width"];

/** Uses CSS max-content sizing, capped by the resolved popup/viewport bounds. */
export function dropdownContentWidthStyle(
  bounds: DropdownWidthBounds,
): ViewStyle {
  return {
    maxWidth: bounds.maxWidth,
    minWidth: bounds.minWidth,
    width: maxContentWidth,
  };
}
