/** Per-size chip and control metrics for `ComboboxMultiSelect`. */
import type { ControlSize } from "../controlSize";

export const MULTI_SELECT_SIZES = {
  sm: {
    chipFontSize: 11,
    chipIconSize: 12,
    chipLineHeight: 16,
    chipPaddingHorizontal: 7,
    chipPaddingVertical: 1,
    controlPaddingHorizontal: 8,
    controlPaddingVertical: 5,
    gap: 4,
    removeSize: 16,
  },
  md: {
    chipFontSize: 12,
    chipIconSize: 13,
    chipLineHeight: 18,
    chipPaddingHorizontal: 9,
    chipPaddingVertical: 3,
    controlPaddingHorizontal: 8,
    controlPaddingVertical: 6,
    gap: 6,
    removeSize: 18,
  },
  lg: {
    chipFontSize: 13,
    chipIconSize: 14,
    chipLineHeight: 20,
    chipPaddingHorizontal: 10,
    chipPaddingVertical: 4,
    controlPaddingHorizontal: 10,
    controlPaddingVertical: 8,
    gap: 8,
    removeSize: 20,
  },
} as const satisfies Record<ControlSize, object>;
