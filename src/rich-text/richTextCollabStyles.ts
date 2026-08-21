/**
 * Styles for the collaboration surfaces that sit beside the editor: the
 * presence bar and the review rail. Cross-platform React Native styles, so the
 * same rail renders on web and on a phone.
 */
import { StyleSheet } from "react-native";

import type { SharedUiTheme } from "../theme";

/** Themed styles for `RichTextPresenceBar` and `RichTextCollabRail`. */
export function createRichTextCollabStyles(theme: SharedUiTheme) {
  return StyleSheet.create({
    actions: {
      alignItems: "center",
      columnGap: 8,
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 10,
      rowGap: 8,
    },
    author: {
      color: theme.colors.ink,
      flexShrink: 1,
      fontFamily: theme.fonts.sans,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 18,
    },
    avatarRing: {
      borderColor: theme.colors.surface,
      borderWidth: 2,
    },
    avatarStack: {
      alignItems: "center",
      flexDirection: "row",
    },
    // Discs after the first slide under their neighbour so a crowd stays
    // compact; the surface-coloured ring keeps each one readable.
    avatarStacked: {
      marginStart: -8,
    },
    body: {
      color: theme.colors.ink2,
      fontFamily: theme.fonts.sans,
      fontSize: 14,
      lineHeight: 20,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border2,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      padding: 12,
    },
    // Selection is carried by a uniform border plus a soft fill, never an edge
    // strip (see the accent-bar ban in AGENTS.md).
    cardActive: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primary,
    },
    cardResolved: {
      backgroundColor: theme.colors.bg2,
      borderColor: theme.colors.border,
    },
    cardTrigger: {
      borderRadius: theme.radii.sm,
      rowGap: 8,
    },
    deletedPreview: {
      color: theme.colors.muted,
      textDecorationLine: "line-through",
    },
    empty: {
      color: theme.colors.placeholder,
      fontFamily: theme.fonts.sans,
      fontSize: 13,
      lineHeight: 18,
      paddingVertical: 8,
    },
    header: {
      alignItems: "center",
      columnGap: 8,
      flexDirection: "row",
    },
    insertedPreview: {
      textDecorationLine: "underline",
    },
    list: {
      rowGap: 10,
    },
    presenceBar: {
      alignItems: "center",
      columnGap: 10,
      flexDirection: "row",
      flexWrap: "wrap",
      rowGap: 6,
    },
    presenceSummary: {
      color: theme.colors.muted,
      fontFamily: theme.fonts.sans,
      fontSize: 13,
      lineHeight: 18,
    },
    // A tracked change's words, shown the way the document shows them.
    preview: {
      color: theme.colors.ink2,
      fontFamily: theme.fonts.sans,
      fontSize: 13,
      lineHeight: 18,
    },
    // The anchored words a thread hangs off, set apart from the discussion by a
    // tint and the highlighter tone the anchor uses in the document.
    quote: {
      backgroundColor: theme.colors.amberSoft,
      borderRadius: theme.radii.sm,
      color: theme.colors.ink2,
      fontFamily: theme.fonts.sans,
      fontSize: 13,
      lineHeight: 18,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    rail: {
      rowGap: 12,
    },
    railHeader: {
      alignItems: "center",
      columnGap: 8,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    railTitle: {
      color: theme.colors.ink,
      fontFamily: theme.fonts.sans,
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.3,
      lineHeight: 18,
      textTransform: "uppercase",
    },
    reply: {
      rowGap: 4,
    },
    replies: {
      marginTop: 10,
      rowGap: 10,
    },
    summary: {
      color: theme.colors.ink2,
      fontFamily: theme.fonts.sans,
      fontSize: 13,
      lineHeight: 18,
    },
    timestamp: {
      color: theme.colors.placeholder,
      fontFamily: theme.fonts.sans,
      fontSize: 12,
      lineHeight: 16,
      marginStart: "auto",
    },
    // `placeholder` is held to WCAG 2.1 — 1.4.3 (AA) on `surface` only. A
    // selected or resolved card swaps that fill for a tint, which drops the
    // quiet timestamp under 4.5:1, so on those cards it steps up to body ink.
    timestampOnTint: {
      color: theme.colors.ink2,
    },
  });
}

/** Style bag shared by the collaboration surfaces. */
export type RichTextCollabStyles = ReturnType<
  typeof createRichTextCollabStyles
>;
