/** Shared chrome for the date-field triggers (single and range). */
import { StyleSheet } from "react-native";

import { fieldChromeTokens } from "../input";
import type { SharedUiTheme } from "../theme";

import { DATE_FIELD_LAYERS } from "./dateFieldLayers";

export function createDateFieldStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  // Share the label / required / message / hint tokens with the Input field so
  // the two stay in lockstep. `fieldError` keeps its name (the date trigger uses
  // it) but is the same token as the input's error message.
  const chrome = fieldChromeTokens(theme);
  return StyleSheet.create({
    anchor: { position: "relative" },
    field: chrome.field,
    fieldError: chrome.message,
    fieldLabel: chrome.fieldLabel,
    // Lifts the open field root (and the range row) above following/later-DOM
    // content so the calendar is not trapped by a sibling. See `dateFieldLayers`.
    fieldOpen: { zIndex: DATE_FIELD_LAYERS.open },
    hint: chrome.hint,
    required: chrome.required,
    trigger: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border2,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      flexDirection: "row",
      height: 40,
      justifyContent: "space-between",
      paddingHorizontal: 12,
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
    triggerIcons: { alignItems: "center", flexDirection: "row", gap: 8 },
    // The native open button fills the row left of the icons (preserving the old
    // single-row layout) while staying its own accessibility element.
    triggerOpen: { flex: 1 },
    triggerInvalid: { borderColor: theme.colors.rose },
    triggerPlaceholder: {
      ...baseText,
      color: theme.colors.faint,
      flexShrink: 1,
      fontSize: 14,
    },
    triggerValue: {
      ...baseText,
      color: theme.colors.ink,
      flexShrink: 1,
      fontSize: 14,
    },
  });
}

export type DateFieldStyles = ReturnType<typeof createDateFieldStyles>;
