/** Shared chrome for the {@link Input} field and bare {@link InputFrame} box. */
import { StyleSheet } from "react-native";

import type { ControlSize } from "../controlSize";
import type { SharedUiTheme } from "../theme";

/**
 * Per-size geometry for the framed input: the bordered box height, the gap
 * between the input and its adornments, the horizontal padding, the inner
 * `TextInput` height and type scale, and the matching icon diameter. `md`
 * matches the original 40px box; `sm` is the compact density and `lg` the
 * roomier, touch-first density.
 */
const INPUT_SIZES: Record<
  ControlSize,
  {
    boxHeight: number;
    gap: number;
    iconSize: number;
    inputFontSize: number;
    inputHeight: number;
    paddingHorizontal: number;
  }
> = {
  sm: {
    boxHeight: 32,
    gap: 6,
    iconSize: 14,
    inputFontSize: 13,
    inputHeight: 30,
    paddingHorizontal: 10,
  },
  md: {
    boxHeight: 40,
    gap: 8,
    iconSize: 16,
    inputFontSize: 14,
    inputHeight: 38,
    paddingHorizontal: 12,
  },
  lg: {
    boxHeight: 48,
    gap: 10,
    iconSize: 18,
    inputFontSize: 16,
    inputHeight: 46,
    paddingHorizontal: 14,
  },
};

/** Diameter of the prefix / suffix / clear icons for a given input size, in px. */
export function inputIconSize(size: ControlSize) {
  return INPUT_SIZES[size].iconSize;
}

/**
 * The label / message tokens shared by every labelled field — the `Input` field
 * and the date field both consume these so their label, required marker, error,
 * and hint styling stay in lockstep (single source of truth, no drift).
 */
export function fieldChromeTokens(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  return {
    // The label / box / messages stack.
    field: { gap: 6 },
    fieldLabel: {
      ...baseText,
      color: theme.colors.ink2,
      fontSize: 12,
      fontWeight: "700" as const,
      lineHeight: 18,
    },
    required: { color: theme.colors.rose },
    // Validation message (rose, bold) shown below the field.
    message: {
      ...baseText,
      color: theme.colors.rose,
      fontSize: 11,
      fontWeight: "700" as const,
      lineHeight: 16,
    },
    hint: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 11,
      lineHeight: 16.5,
    },
  };
}

export function createInputStyles(
  theme: SharedUiTheme,
  size: ControlSize = "md",
) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  const chrome = fieldChromeTokens(theme);
  const sizing = INPUT_SIZES[size];
  return StyleSheet.create({
    field: chrome.field,
    fieldLabel: chrome.fieldLabel,
    required: chrome.required,
    error: chrome.message,
    hint: chrome.hint,
    // The bordered row that frames the input and its adornments.
    box: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border2,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      flexDirection: "row",
      gap: sizing.gap,
      height: sizing.boxHeight,
      paddingHorizontal: sizing.paddingHorizontal,
    },
    boxActive: { borderColor: theme.colors.primary },
    boxInvalid: { borderColor: theme.colors.rose },
    // `minWidth: 0` lets the web <input> shrink below its intrinsic size so the
    // trailing icons stay inside the box in narrow layouts.
    input: {
      ...baseText,
      color: theme.colors.ink,
      flex: 1,
      fontSize: sizing.inputFontSize,
      height: sizing.inputHeight,
      minWidth: 0,
    },
    // Decorative icon wrapper (centred so it lines up with the input baseline).
    icon: { alignItems: "center", justifyContent: "center" },
    // Pressable adornment (clear button / interactive suffix icon).
    iconButton: { alignItems: "center", justifyContent: "center" },
  });
}

export type InputStyles = ReturnType<typeof createInputStyles>;
