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
    textareaInputMinHeight: number;
    textareaPaddingVertical: number;
  }
> = {
  sm: {
    boxHeight: 32,
    gap: 6,
    iconSize: 14,
    inputFontSize: 13,
    inputHeight: 30,
    paddingHorizontal: 10,
    textareaInputMinHeight: 72,
    textareaPaddingVertical: 8,
  },
  md: {
    boxHeight: 40,
    gap: 8,
    iconSize: 16,
    inputFontSize: 14,
    inputHeight: 38,
    paddingHorizontal: 12,
    textareaInputMinHeight: 88,
    textareaPaddingVertical: 10,
  },
  lg: {
    boxHeight: 48,
    gap: 10,
    iconSize: 18,
    inputFontSize: 16,
    inputHeight: 46,
    paddingHorizontal: 14,
    textareaInputMinHeight: 104,
    textareaPaddingVertical: 12,
  },
};

/** Diameter of the prefix / suffix / clear icons for a given input size, in px. */
export function inputIconSize(size: ControlSize) {
  return INPUT_SIZES[size].iconSize;
}

/**
 * The framed-field geometry for a given size — box height, gap, icon diameter,
 * text scale, and horizontal padding. Exported so the other controls that share
 * the input's bordered-box look (the {@link DropdownSelector} field and the date
 * triggers) size from the same scale and stay in lockstep with the text input.
 */
export function inputSizeTokens(size: ControlSize) {
  return INPUT_SIZES[size];
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
      // `placeholder` clears 4.5:1 on surface at this small size; `muted` was
      // borderline (~4.06:1) for ≤11px secondary text — WCAG 2.1 1.4.3 (AA).
      color: theme.colors.placeholder,
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
    // The label + optional ⓘ info button share one baseline-centred row.
    labelRow: { alignItems: "center", flexDirection: "row", gap: 4 },
    // Centre the info button's popover anchor in the label row (Popover's own
    // default hugs `flex-start`, which would top-align the small ⓘ glyph).
    labelInfoAnchor: { alignSelf: "center" },
    labelInfoButton: {
      alignItems: "center",
      borderRadius: theme.radii.sm,
      justifyContent: "center",
    },
    // Body text inside the info tooltip; the surface itself owns the chrome.
    labelInfoText: {
      ...baseText,
      color: theme.colors.ink,
      fontSize: 12,
      lineHeight: 18,
      paddingHorizontal: 4,
      paddingVertical: 2,
    },
    // Off-screen copy of the info text that the ⓘ button points its web
    // `aria-describedby` at — present in the a11y tree, clipped from view.
    labelInfoDescription: {
      height: 1,
      margin: -1,
      overflow: "hidden",
      position: "absolute",
      width: 1,
    },
    // The bordered row that frames the input and its adornments.
    box: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      // `controlBorder` (a translucent ink tint) draws the resting edge of an
      // interactive control — a soft, light line (≈1.4:1 on white, intentionally
      // below the 1.4.11 ≥3:1 floor) rather than the decorative `border2`.
      borderColor: theme.colors.controlBorder,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      flexDirection: "row",
      gap: sizing.gap,
      // `minHeight` (over a fixed `height`) lets the box grow rather than clip
      // its contents when text spacing/size is increased — WCAG 2.1 1.4.12 Text
      // Spacing (AA). At the default scale it renders the same boxHeight.
      minHeight: sizing.boxHeight,
      paddingHorizontal: sizing.paddingHorizontal,
    },
    boxActive: { borderColor: theme.colors.primary },
    boxInvalid: { borderColor: theme.colors.rose },
    boxMultiline: {
      alignItems: "flex-start",
      paddingVertical: sizing.textareaPaddingVertical,
    },
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
    textareaInput: {
      ...baseText,
      color: theme.colors.ink,
      flex: 1,
      fontSize: sizing.inputFontSize,
      minHeight: sizing.textareaInputMinHeight,
      minWidth: 0,
      paddingBottom: 0,
      paddingTop: 0,
      textAlignVertical: "top",
    },
    // Decorative icon wrapper (centred so it lines up with the input baseline).
    icon: { alignItems: "center", justifyContent: "center" },
    // Pressable adornment (clear button / interactive suffix icon).
    iconButton: { alignItems: "center", justifyContent: "center" },
  });
}

export type InputStyles = ReturnType<typeof createInputStyles>;
