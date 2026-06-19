/** Shared style factory for dropdown list rows. */
import { StyleSheet } from "react-native";

import type { SharedUiTheme } from "../theme";

export function createDropdownListStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  return StyleSheet.create({
    amberText: { color: theme.colors.amber },
    chrome: { flexShrink: 1, minHeight: 0 },
    dangerText: { color: theme.colors.rose },
    divider: {
      backgroundColor: theme.colors.border,
      height: 1,
      marginHorizontal: 6,
      marginVertical: 4,
    },
    footer: {
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
      marginTop: 4,
    },
    footerRegion: {
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
      marginTop: 4,
      paddingBottom: 2,
      paddingHorizontal: 10,
      paddingTop: 8,
    },
    headerRegion: {
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      marginBottom: 4,
      paddingBottom: 8,
      paddingHorizontal: 10,
      paddingTop: 2,
    },
    iconBox: {
      alignItems: "center",
      backgroundColor: theme.colors.primarySoft,
      borderRadius: theme.radii.md,
      height: 28,
      justifyContent: "center",
      width: 28,
    },
    iconBoxDanger: { backgroundColor: theme.colors.roseSoft },
    item: {
      alignItems: "center",
      borderRadius: 7,
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    // The `soft` fill alone is ~1.13:1 against the surface, so the active row
    // also carries a primary left-accent bar (an inset box-shadow, so it adds
    // no layout shift) to keep the highlight perceivable at ≥3:1 for low-vision
    // users (WCAG 1.4.11) — a label-color shift alone is insufficient.
    itemActive: {
      backgroundColor: theme.colors.soft,
      boxShadow: `inset 3px 0 0 0 ${theme.colors.primary}`,
    },
    itemDisabled: { opacity: 0.5 },
    itemLabel: {
      ...baseText,
      color: theme.colors.ink,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 18,
    },
    itemLabelActive: { color: theme.colors.primaryDeep },
    itemSelected: { backgroundColor: theme.colors.primarySoft },
    itemText: { flex: 1, minWidth: 0 },
    leading: { alignItems: "center", justifyContent: "center" },
    right: { alignItems: "center", justifyContent: "center" },
    scroll: { flexGrow: 0, flexShrink: 1, minHeight: 0 },
    // No horizontal padding so the search field's border spans the full
    // content width and lines up with the option rows' (selected) backgrounds.
    searchRegion: {
      paddingBottom: 6,
      paddingTop: 2,
    },
    secondary: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 11,
      lineHeight: 15,
      marginTop: 1,
    },
    section: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1,
      lineHeight: 15,
      paddingBottom: 2,
      paddingHorizontal: 10,
      paddingTop: 6,
      textTransform: "uppercase",
    },
  });
}

export type DropdownListStyles = ReturnType<typeof createDropdownListStyles>;
