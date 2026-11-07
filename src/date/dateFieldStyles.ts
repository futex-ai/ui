/** Shared chrome for the date-field triggers (single and range). */
import { StyleSheet } from "../primitives/reactNative";

import type { ControlSize } from "../controlSize";
import { fieldChromeTokens, inputSizeTokens } from "../input";
import { touchInputSizeTokens } from "../input/inputSizing";
import type { SharedUiTheme } from "../theme";
import { touchControlMetrics } from "../touchMetrics";

import { dateFieldZIndex } from "./dateFieldLayers";

export function createDateFieldStyles(
  theme: SharedUiTheme,
  size: ControlSize = "md",
  borderRadius = theme.radii.md,
) {
  // The native trigger is a bordered field box, so it scales from the same input
  // size scale the web trigger's InputFrame uses — keeping web and native (and
  // the plain text input) the same height for a given `size`.
  const sizing = inputSizeTokens(size);
  return dateFieldStylesFor(theme, sizing, borderRadius, false);
}

/**
 * The date-field styles on a touch surface, whatever the size: the native
 * trigger is the 46px touch field with 16px text, its open button fills the
 * row height, and its Clear action is a 44px box.
 */
export function createTouchDateFieldStyles(
  theme: SharedUiTheme,
  borderRadius = theme.radii.md,
) {
  return dateFieldStylesFor(theme, touchInputSizeTokens(), borderRadius, true);
}

function dateFieldStylesFor(
  theme: SharedUiTheme,
  sizing: ReturnType<typeof inputSizeTokens>,
  borderRadius: number,
  touch: boolean,
) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  // Share the label / required / message / hint tokens with the Input field so
  // the two stay in lockstep. `fieldError` keeps its name (the date trigger uses
  // it) but is the same token as the input's error message.
  const chrome = fieldChromeTokens(theme);
  const target = touchControlMetrics.target;
  return StyleSheet.create({
    anchor: { position: "relative" },
    field: chrome.field,
    fieldError: chrome.message,
    fieldLabel: chrome.fieldLabel,
    // Lifts the open field root (and the range row) above following/later-DOM
    // content so the calendar is not trapped by a sibling. See `dateFieldLayers`.
    fieldOpen: { zIndex: dateFieldZIndex() },
    hint: chrome.hint,
    // The label + optional ⓘ info button share one baseline-centred row.
    labelRow: { alignItems: "center", flexDirection: "row", gap: 4 },
    required: chrome.required,
    trigger: {
      // The native trigger is an interactive control box; its resting edge uses
      // the `controlBorder` token (soft translucent-ink edge), not `border2`.
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.controlBorder,
      borderRadius,
      borderWidth: 1,
      flexDirection: "row",
      height: sizing.boxHeight,
      justifyContent: "space-between",
      paddingHorizontal: sizing.paddingHorizontal,
    },
    triggerActive: { borderColor: theme.colors.primary },
    // The Clear action of the native trigger. On a touch surface it is a 44px
    // box of its own; elsewhere it is as large as its icon.
    triggerClear: touch
      ? {
          alignItems: "center",
          height: target,
          justifyContent: "center",
          width: target,
        }
      : {},
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
    // single-row layout) while staying its own accessibility element. On a
    // touch surface it also fills the row height, so the button is a 44px
    // target.
    triggerOpen: touch
      ? { alignSelf: "stretch", flex: 1, justifyContent: "center" }
      : { flex: 1 },
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
