/** Theme-derived layout and typography for the native rich-text editor. */
import { StyleSheet } from "react-native";

import { fieldChromeTokens } from "../input/inputStyles";
import type { SharedUiTheme } from "../theme";
import { createTypographyStyles } from "../typography/typographyStyles";

/** Build the native editor's frame, block, and keyboard-toolbar styles. */
export function createNativeRichTextStyles(theme: SharedUiTheme) {
  const chrome = fieldChromeTokens(theme);
  const typography = createTypographyStyles(theme);
  return StyleSheet.create({
    block: {
      alignItems: "flex-start",
      flexDirection: "row",
      minHeight: 30,
      paddingVertical: 3,
    },
    blockContent: {
      flex: 1,
      minWidth: 0,
    },
    checkBox: {
      alignItems: "center",
      borderColor: theme.colors.controlBorder,
      borderRadius: 4,
      borderWidth: 1.5,
      height: 18,
      justifyContent: "center",
      width: 18,
    },
    checkBoxChecked: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    checkTarget: {
      alignItems: "center",
      justifyContent: "center",
      marginLeft: -10,
      minHeight: 44,
      width: 44,
    },
    checkedText: {
      color: theme.colors.muted,
      textDecorationLine: "line-through",
    },
    codeBlock: {
      backgroundColor: theme.colors.soft,
      borderRadius: theme.radii.sm,
      marginVertical: 4,
      padding: 10,
    },
    codeText: {
      color: theme.colors.ink2,
      fontFamily: theme.fonts.mono,
      fontSize: 13,
      lineHeight: 20,
    },
    divider: {
      backgroundColor: theme.colors.border2,
      height: StyleSheet.hairlineWidth,
      width: "100%",
    },
    dividerTarget: {
      justifyContent: "center",
      minHeight: 36,
      paddingVertical: 17,
    },
    editorBody: {
      flexGrow: 1,
      paddingBottom: 10,
      paddingHorizontal: 12,
      paddingTop: 7,
    },
    field: chrome.field,
    frame: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.controlBorder,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      overflow: "hidden",
    },
    frameFocused: {
      borderColor: theme.colors.primary,
    },
    heading1: typography.h1,
    heading2: typography.h2,
    heading3: typography.h3,
    inlineBold: {
      fontWeight: "700",
    },
    inlineCode: {
      backgroundColor: theme.colors.soft,
      color: theme.colors.ink2,
      fontFamily: theme.fonts.mono,
    },
    inlineItalic: {
      fontStyle: "italic",
    },
    inlineStrike: {
      textDecorationLine: "line-through",
    },
    // A comment anchor is one fixed highlighter tone rather than the
    // commenter's colour: several people can comment on the same words, and a
    // run of text can only carry one tint.
    inlineComment: {
      backgroundColor: theme.colors.amberSoft,
    },
    inlineCommentActive: {
      backgroundColor: theme.colors.amberSoft,
      textDecorationLine: "underline",
    },
    inlineDeleted: {
      color: theme.colors.muted,
      textDecorationLine: "line-through",
    },
    inlineInserted: {
      textDecorationLine: "underline",
    },
    input: {
      ...typography.body,
      flex: 1,
      margin: 0,
      minHeight: 24,
      padding: 0,
      textAlignVertical: "top",
    },
    label: chrome.fieldLabel,
    listMarker: {
      ...typography.body,
      color: theme.colors.muted,
      paddingTop: 1,
      textAlign: "center",
      width: 25,
    },
    paragraph: typography.body,
    // A native text input cannot host a caret marker inside its own text, so a
    // remote caret is reported as a disc on the block the collaborator is in.
    presenceChip: {
      alignItems: "center",
      flexDirection: "row",
      marginStart: 6,
      paddingTop: 4,
    },
    presenceDisc: {
      alignItems: "center",
      borderRadius: theme.radii.pill,
      height: 18,
      justifyContent: "center",
      minWidth: 18,
      paddingHorizontal: 4,
    },
    presenceInitials: {
      fontFamily: theme.fonts.sans,
      fontSize: 10,
      fontWeight: "800",
      lineHeight: 14,
    },
    quoteBlock: {
      borderLeftColor: theme.colors.border2,
      borderLeftWidth: 3,
      marginVertical: 3,
      paddingLeft: 10,
    },
    quoteText: {
      ...typography.body,
      color: theme.colors.ink2,
    },
    readOnlyText: {
      flex: 1,
      minHeight: 24,
      paddingVertical: 1,
    },
    toolbar: {
      backgroundColor: theme.colors.surface,
      borderTopColor: theme.colors.border2,
      borderTopWidth: StyleSheet.hairlineWidth,
      minHeight: 52,
    },
    toolbarButton: {
      alignItems: "center",
      borderRadius: theme.radii.sm,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    toolbarButtonActive: {
      backgroundColor: theme.colors.primarySoft,
    },
    toolbarButtonDisabled: {
      opacity: 0.35,
    },
    toolbarContent: {
      alignItems: "center",
      flexDirection: "row",
      gap: 2,
      paddingHorizontal: 6,
      paddingVertical: 4,
    },
    toolbarDivider: {
      backgroundColor: theme.colors.border2,
      height: 24,
      marginHorizontal: 4,
      width: StyleSheet.hairlineWidth,
    },
    toolbarText: {
      color: theme.colors.ink2,
      fontFamily: theme.fonts.sans,
      fontSize: 15,
      fontWeight: "700",
    },
    toolbarTextActive: {
      color: theme.colors.primaryDeep,
    },
  });
}

/** Native rich-text StyleSheet type passed to block and toolbar children. */
export type NativeRichTextStyles = ReturnType<
  typeof createNativeRichTextStyles
>;
