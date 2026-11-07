/** Shared chrome for the {@link Input} field and bare {@link InputFrame} box. */
import { StyleSheet } from "../primitives/reactNative";

import type { ControlSize } from "../controlSize";
import type { SharedUiTheme } from "../theme";

import { inputSizeTokens, touchInputSizeTokens } from "./inputSizing";

/** The geometry of the framed input at one size, or on a touch surface. */
type InputSizing = ReturnType<typeof inputSizeTokens>;

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
  return inputStylesFor(theme, inputSizeTokens(size));
}

/**
 * The input styles of a touch surface: the touch counterpart of
 * {@link createInputStyles}, with the same keys at the touch metrics.
 */
export function createTouchInputStyles(theme: SharedUiTheme) {
  return inputStylesFor(theme, touchInputSizeTokens());
}

function inputStylesFor(theme: SharedUiTheme, sizing: InputSizing) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  const chrome = fieldChromeTokens(theme);
  const action = sizing.actionSize;
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
    // The `plain` (borderless) box: no border, fill, or horizontal padding, for
    // a chrome-less inline editor embedded in a row. The focus ring, the clear
    // button, and the a11y wiring stay owned by the frame.
    boxPlain: {
      backgroundColor: "transparent",
      borderWidth: 0,
      paddingHorizontal: 0,
    },
    // The `seamless` box: like `plain` but it also drops the reserved control
    // height (`minHeight: 0`) and ALL padding, so the field collapses onto its
    // text and reads as ordinary copy rather than a control sitting in a row. It
    // layers AFTER `boxMultiline` so its zeroed vertical padding wins, and before
    // the active/invalid border so those colours stay inert against the zeroed
    // width. The focus ring, clear button, and a11y wiring stay owned by the frame.
    boxSeamless: {
      backgroundColor: "transparent",
      borderWidth: 0,
      minHeight: 0,
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
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
    // Single-line `seamless` input: no fixed control height — it sizes to one
    // line of the font's natural line box — and no padding, so the box collapses
    // onto the text. It deliberately sets NO `lineHeight`: a fixed line box would
    // clip a larger `fontSize` set through `inputStyle` (e.g. a heading) in this
    // zero-padding, height-less field, whereas the font's own leading tracks
    // whatever size the caller uses. Callers restyle the text (size / weight /
    // colour) through `inputStyle` to match the surrounding copy.
    inputSeamless: {
      ...baseText,
      color: theme.colors.ink,
      flex: 1,
      fontSize: sizing.inputFontSize,
      minWidth: 0,
      paddingVertical: 0,
    },
    // Multiline `seamless` input: like the single-line variant but top-aligned
    // and floored at one line, so an auto-growing seamless field grows to fit its
    // content from a single line rather than reserving the textarea min-height.
    // Like `textareaInput` it sets no fixed `lineHeight` — the auto-grow hook
    // applies the per-size line height for its row math, and a caller `inputStyle`
    // supplies a matching line height when it raises the font size.
    textareaSeamless: {
      ...baseText,
      color: theme.colors.ink,
      flex: 1,
      fontSize: sizing.inputFontSize,
      minHeight: sizing.textareaLineHeight,
      minWidth: 0,
      paddingBottom: 0,
      paddingTop: 0,
      textAlignVertical: "top",
    },
    // A floor for the seamless input, which otherwise sizes to its text line.
    // Only a touch surface sets one, so the input itself stays a 44px target.
    seamlessFloor:
      sizing.seamlessMinHeight === undefined
        ? {}
        : { minHeight: sizing.seamlessMinHeight },
    // Decorative icon wrapper (centred so it lines up with the input baseline).
    icon: { alignItems: "center", justifyContent: "center" },
    // Pressable adornment (clear button / interactive suffix icon). The dense
    // size and a touch surface give it its own square target box: 24px and
    // 44px. The other sizes keep it as large as its icon.
    iconButton:
      action === undefined
        ? { alignItems: "center", justifyContent: "center" }
        : {
            alignItems: "center",
            height: action,
            justifyContent: "center",
            width: action,
          },
  });
}

export type InputStyles = ReturnType<typeof createInputStyles>;
