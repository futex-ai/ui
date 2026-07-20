/** Shared style helpers for the RichTextEditor frame and web DOM renderer. */
import { StyleSheet } from "react-native";
import type { TextStyle } from "react-native";

import { fieldChromeTokens } from "../input/inputStyles";
import type { SharedUiTheme } from "../theme";
import { createTypographyStyles } from "../typography/typographyStyles";

/** Build themed React Native styles for the editor frame. */
export function createRichTextStyles(theme: SharedUiTheme) {
  const chrome = fieldChromeTokens(theme);
  return StyleSheet.create({
    editor: {
      color: theme.colors.ink,
      flex: 1,
      minHeight: 120,
      // Longhand padding only: this style is spread onto a raw contentEditable
      // <div>, and RN shorthands (paddingHorizontal/Vertical) are not CSS
      // properties — React drops them, leaving the content flush against the
      // frame while the placeholder floats at the padded offset.
      paddingBottom: 10,
      paddingLeft: 12,
      paddingRight: 12,
      paddingTop: 10,
    },
    field: chrome.field,
    frame: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.controlBorder,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      overflow: "hidden",
    },
    label: chrome.fieldLabel,
    placeholder: {
      color: theme.colors.placeholder,
      fontFamily: theme.fonts.sans,
      fontSize: 15,
      left: 12,
      lineHeight: 22,
      pointerEvents: "none",
      position: "absolute",
      right: 12,
      top: 10,
    },
    scrollFrame: {
      overflow: "scroll",
      position: "relative",
    },
  });
}

/** Raw text metrics used by the imperative DOM renderer. */
export function createRichTextDomTheme(theme: SharedUiTheme) {
  const typography = createTypographyStyles(theme);
  return {
    body: domTextStyle(typography.body),
    code: {
      color: theme.colors.ink2,
      fontFamily: theme.fonts.mono,
      fontSize: 13,
      lineHeight: 20,
    },
    h1: domTextStyle(typography.h1),
    h2: domTextStyle(typography.h2),
    h3: domTextStyle(typography.h3),
    theme,
  };
}

function domTextStyle(style: TextStyle) {
  return {
    color: typeof style.color === "string" ? style.color : undefined,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
  };
}
