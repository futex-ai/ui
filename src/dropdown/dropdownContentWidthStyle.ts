/** Native intrinsic-width constraints for content-sized dropdown surfaces. */
import type { ViewStyle } from "react-native";

import type { DropdownWidthBounds } from "./dropdownGeometry";

/** Lets Yoga size the surface to its content between the resolved bounds. */
export function dropdownContentWidthStyle(
  bounds: DropdownWidthBounds,
): ViewStyle {
  return {
    alignSelf: "flex-start",
    maxWidth: bounds.maxWidth,
    minWidth: bounds.minWidth,
  };
}
