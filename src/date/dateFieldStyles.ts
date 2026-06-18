/** Shared chrome for the date-field triggers (single and range). */
import { StyleSheet } from "react-native";

import type { ControlSize } from "../controlSize";
import { fieldChromeTokens, inputSizeTokens } from "../input";
import type { SharedUiTheme } from "../theme";

import { dateFieldZIndex } from "./dateFieldLayers";

export function createDateFieldStyles(
  theme: SharedUiTheme,
  size: ControlSize = "md",
) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  // Share the label / required / message / hint tokens with the Input field so
  // the two stay in lockstep. `fieldError` keeps its name (the date trigger uses
  // it) but is the same token as the input's error message.
  const chrome = fieldChromeTokens(theme);
  // The native trigger is a bordered field box, so it scales from the same input
  // size scale the web trigger's InputFrame uses — keeping web and native (and
  // the plain text input) the same height for a given `size`.
  const sizing = inputSizeTokens(size);
  return StyleSheet.create({
    anchor: { position: "relative" },
    field: chrome.field,
    fieldError: chrome.message,
    fieldLabel: chrome.fieldLabel,
    // Lifts the open field root (and the range row) above following/later-DOM
    // content so the calendar is not trapped by a sibling. See `dateFieldLayers`.
    fieldOpen: { zIndex: dateFieldZIndex() },
    hint: chrome.hint,
    required: chrome.required,
    trigger: {
      // The native trigger is an interactive control box; its resting edge needs
      // the ≥3:1 control-boundary token, not decorative `border2` (WCAG 2.1 1.4.11).
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.controlBorder,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      flexDirection: "row",
      height: sizing.boxHeight,
      justifyContent: "space-between",
      paddingHorizontal: sizing.paddingHorizontal,
    },
    triggerActive: { borderColor: theme.colors.primary },
    triggerFlex: { flex: 1 },
    // The lucide calendar glyph is optically bottom-heavy (thin hanger tabs pad
    // its box upward), so it reads ~1px low beside the symmetric clear circle and
    // the value text. Nudge it up to optically center it. `transform` keeps it a
    // pure visual shift with no layout effect on the row.
    calendarNudge: { transform: [{ translateY: -1 }] },
    // Groups the trailing clear + calendar icons on the native trigger so the
    // row's `space-between` keeps them together on the right, not spread apart.
    triggerIcons: {
      alignItems: "center",
      flexDirection: "row",
      gap: sizing.gap,
    },
    // The native open button fills the row left of the icons (preserving the old
    // single-row layout) while staying its own accessibility element.
    triggerOpen: { flex: 1 },
    triggerInvalid: { borderColor: theme.colors.rose },
    triggerPlaceholder: {
      // Placeholder text conveys the field's purpose, so use the ≥4.5:1
      // `placeholder` token rather than the faint decorative one (WCAG 2.1 1.4.3).
      ...baseText,
      color: theme.colors.placeholder,
      flexShrink: 1,
      fontSize: sizing.inputFontSize,
    },
    triggerValue: {
      ...baseText,
      color: theme.colors.ink,
      flexShrink: 1,
      fontSize: sizing.inputFontSize,
    },
  });
}

export type DateFieldStyles = ReturnType<typeof createDateFieldStyles>;
