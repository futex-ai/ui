/** Themed styles and per-size chip metrics of {@link ComboboxMultiSelect}. */
import { StyleSheet } from "../primitives/reactNative";

import type { ControlSize } from "../controlSize";
import {
  standardControlSize,
  type StandardControlSize,
} from "../controlSizeTables";
import { inputSizeTokens, touchInputSizeTokens } from "../input";
import type { SharedUiTheme } from "../theme";
import { touchControlMetrics } from "../touchMetrics";

export function createComboboxMultiSelectStyles(
  theme: SharedUiTheme,
  borderRadius = theme.radii.md,
  size: ControlSize = "md",
  singleLine = false,
  touch = false,
) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  // The chip field has no dense design, so `xs` draws its `sm` chips and box.
  // A touch surface uses the touch metrics whatever the size.
  const inputSize = touch
    ? touchInputSizeTokens()
    : inputSizeTokens(standardControlSize(size));
  const sizing = touch
    ? MULTI_SELECT_TOUCH
    : MULTI_SELECT_SIZES[standardControlSize(size)];
  return StyleSheet.create({
    chip: {
      alignItems: "center",
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primaryBorder,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      flexDirection: "row",
      flexShrink: singleLine ? 1 : 0,
      gap: sizing.gap,
      maxWidth: "100%",
      paddingHorizontal: sizing.chipPaddingHorizontal,
      paddingVertical: sizing.chipPaddingVertical,
      // A touch chip ends with its 44px removal box, which supplies the space.
      ...(touch && !singleLine ? { paddingEnd: 0 } : null),
    },
    chipRemove: {
      alignItems: "center",
      height: sizing.removeSize,
      justifyContent: "center",
      // The touch box absorbs the chip border, so the chip stays 44px high.
      marginVertical: touch ? -1 : 0,
      width: sizing.removeSize,
    },
    chipRemoveText: {
      ...baseText,
      color: theme.colors.primaryDeep,
      fontSize: sizing.chipFontSize,
      fontWeight: "800",
      lineHeight: sizing.chipLineHeight,
    },
    chipSummary: {
      flexShrink: 0,
      paddingHorizontal: singleLine ? 5 : sizing.chipPaddingHorizontal,
    },
    chipText: {
      ...baseText,
      color: theme.colors.primaryDeep,
      flexShrink: singleLine ? 1 : 0,
      fontSize: sizing.chipFontSize,
      fontWeight: "700",
      lineHeight: sizing.chipLineHeight,
      minWidth: 0,
    },
    control: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.controlBorder,
      borderRadius,
      borderWidth: 1,
      flexDirection: "row",
      flexWrap: singleLine ? "nowrap" : "wrap",
      gap: singleLine ? 3 : sizing.gap,
      height: singleLine ? inputSize.boxHeight : undefined,
      minHeight: inputSize.boxHeight,
      overflow: singleLine ? "hidden" : "visible",
      paddingHorizontal: singleLine ? 6 : sizing.controlPaddingHorizontal,
      paddingVertical: sizing.controlPaddingVertical,
    },
    controlActive: { borderColor: theme.colors.primary },
    // Rose border + soft ring for the invalid state (matches DropdownSelector).
    controlInvalid: {
      borderColor: theme.colors.rose,
      boxShadow: `0 0 0 2px ${theme.colors.roseSoft}`,
    },
    error: {
      ...baseText,
      color: theme.colors.rose,
      fontSize: 11,
      fontWeight: "700",
      lineHeight: 16,
    },
    // The label + control + messages stack.
    field: { gap: 6 },
    hint: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 11,
      lineHeight: 16.5,
    },
    input: {
      ...baseText,
      color: theme.colors.ink,
      flex: singleLine ? 1 : undefined,
      flexGrow: singleLine ? undefined : 1,
      flexShrink: 1,
      fontSize: inputSize.inputFontSize,
      // On a touch surface the input itself is a 44px target.
      minHeight: touch ? inputSize.inputHeight : undefined,
      minWidth: singleLine ? 28 : 130,
      padding: 0,
    },
    label: {
      ...baseText,
      color: theme.colors.ink2,
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 18,
    },
    // The label + optional ⓘ info button share one baseline-centred row.
    labelRow: { alignItems: "center", flexDirection: "row", gap: 4 },
    mark: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      height: 24,
      justifyContent: "center",
      width: 24,
    },
    markText: {
      ...baseText,
      color: theme.colors.onSolid,
      fontSize: 11,
      fontWeight: "800",
    },
    required: { color: theme.colors.rose },
    wrap: { position: "relative" },
  });
}

const MULTI_SELECT_SIZES = {
  sm: {
    chipFontSize: 11,
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
    chipLineHeight: 20,
    chipPaddingHorizontal: 10,
    chipPaddingVertical: 4,
    controlPaddingHorizontal: 10,
    controlPaddingVertical: 8,
    gap: 8,
    removeSize: 20,
  },
} as const satisfies Record<StandardControlSize, object>;

/**
 * The chip field on a touch surface: 15px chips around 44px removal boxes, and
 * no vertical padding, so a line of chips or the 44px input fills the 46px
 * frame without clipping a removal action.
 */
const MULTI_SELECT_TOUCH = {
  chipFontSize: touchControlMetrics.labelFontSize,
  chipLineHeight: touchControlMetrics.labelLineHeight,
  chipPaddingHorizontal: 12,
  chipPaddingVertical: 0,
  controlPaddingHorizontal: 8,
  controlPaddingVertical: 0,
  gap: 6,
  removeSize: touchControlMetrics.target,
} as const;

export type ComboboxMultiSelectStyles = ReturnType<
  typeof createComboboxMultiSelectStyles
>;
