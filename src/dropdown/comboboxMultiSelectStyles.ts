/** Style factory for the `ComboboxMultiSelect` field and its chips. */
import { StyleSheet } from "../primitives/reactNative";

import type { ControlSize } from "../controlSize";
import { inputSizeTokens } from "../input";
import type { SharedUiTheme } from "../theme";

/**
 * Layout for the field, its chips, and the sheet trigger. Chip colors come
 * from the chip palette in `ComboboxMultiSelect.tsx`, keyed by `chipTone`.
 */
export function createComboboxMultiSelectStyles(
  theme: SharedUiTheme,
  borderRadius = theme.radii.md,
  size: ControlSize = "md",
  singleLine = false,
) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  const inputSize = inputSizeTokens(size);
  const sizing = MULTI_SELECT_SIZES[size];
  return StyleSheet.create({
    // The footer action's leading glyph box, as wide as an option's mark so
    // the action label lines up with the option labels above it.
    actionMark: {
      alignItems: "center",
      height: 24,
      justifyContent: "center",
      width: 24,
    },
    chip: {
      alignItems: "center",
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      flexDirection: "row",
      flexShrink: singleLine ? 1 : 0,
      gap: sizing.gap,
      maxWidth: "100%",
      paddingHorizontal: sizing.chipPaddingHorizontal,
      paddingVertical: sizing.chipPaddingVertical,
    },
    chipRemove: {
      alignItems: "center",
      height: sizing.removeSize,
      justifyContent: "center",
      width: sizing.removeSize,
    },
    chipRemoveText: {
      ...baseText,
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
    // `presentation="sheet"`: the button that opens the sheet takes the input's
    // place in the field and reads as its placeholder.
    sheetTrigger: {
      flexGrow: 1,
      flexShrink: 1,
      justifyContent: "center",
      minWidth: singleLine ? 28 : 130,
    },
    sheetTriggerText: {
      ...baseText,
      color: theme.colors.placeholder,
      fontSize: inputSize.inputFontSize,
    },
    wrap: { position: "relative" },
  });
}

/** Chip and control geometry per size. */
export const MULTI_SELECT_SIZES = {
  sm: {
    chipFontSize: 11,
    chipIconSize: 11,
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
    chipIconSize: 12,
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
    chipIconSize: 13,
    chipLineHeight: 20,
    chipPaddingHorizontal: 10,
    chipPaddingVertical: 4,
    controlPaddingHorizontal: 10,
    controlPaddingVertical: 8,
    gap: 8,
    removeSize: 20,
  },
} as const satisfies Record<ControlSize, object>;

export type ComboboxMultiSelectStyles = ReturnType<
  typeof createComboboxMultiSelectStyles
>;
