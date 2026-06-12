import { StyleSheet } from "react-native";

import type { SharedUiTheme } from "../theme";

import type { SelectorVariant } from "./DropdownSelector";

export function createDropdownSelectorStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  return StyleSheet.create({
    error: {
      ...baseText,
      color: theme.colors.rose,
      fontSize: 11,
      fontWeight: "700",
      lineHeight: 16,
    },
    field: { gap: 6 },
    hint: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 11,
      lineHeight: 16.5,
    },
    input: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border2,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      flexDirection: "row",
      gap: 8,
      height: 40,
      justifyContent: "space-between",
      paddingHorizontal: 12,
    },
    inputValue: { ...baseText, color: theme.colors.ink, flex: 1, fontSize: 14 },
    invalid: {
      borderColor: theme.colors.rose,
      boxShadow: `0 0 0 2px ${theme.colors.roseSoft}`,
    },
    label: {
      ...baseText,
      color: theme.colors.ink2,
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 18,
    },
    map: {
      alignItems: "center",
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primaryBorder,
      borderRadius: theme.radii.sm,
      borderWidth: 1,
      flexDirection: "row",
      gap: 6,
      justifyContent: "space-between",
      minWidth: 130,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },
    mapInvalid: {
      backgroundColor: theme.colors.roseSoft,
      borderColor: theme.colors.rose,
    },
    mapValue: {
      ...baseText,
      color: theme.colors.primaryDeep,
      flex: 1,
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 18,
    },
    mapValueInvalid: { color: theme.colors.rose },
    mobilePeriod: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: 9,
      borderWidth: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    mobilePeriodValue: {
      ...baseText,
      color: theme.colors.ink,
      flex: 1,
      fontSize: 13,
      fontWeight: "600",
      lineHeight: 19.5,
    },
    pill: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border2,
      borderRadius: theme.radii.sm,
      borderWidth: 1,
      flexDirection: "row",
      gap: 8,
      height: 38,
      paddingHorizontal: 10,
    },
    pillValue: {
      ...baseText,
      color: theme.colors.ink,
      fontSize: 12,
      fontWeight: "600",
      lineHeight: 18,
    },
    placeholder: { color: theme.colors.faint },
    readOnly: { opacity: 1 },
    required: { color: theme.colors.rose },
    searchField: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border2,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      flexDirection: "row",
      gap: 8,
      height: 36,
      paddingHorizontal: 10,
    },
    searchInput: {
      ...baseText,
      color: theme.colors.ink,
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      padding: 0,
    },
  });
}

export type DropdownSelectorStyles = ReturnType<
  typeof createDropdownSelectorStyles
>;

export function triggerStyle(
  styles: DropdownSelectorStyles,
  variant: SelectorVariant,
) {
  if (variant === "pill") return styles.pill;
  if (variant === "mobilePeriod") return styles.mobilePeriod;
  if (variant === "map") return styles.map;
  return styles.input;
}

export function valueStyle(
  styles: DropdownSelectorStyles,
  variant: SelectorVariant,
) {
  if (variant === "mobilePeriod") return styles.mobilePeriodValue;
  if (variant === "map") return styles.mapValue;
  if (variant === "pill") return styles.pillValue;
  return styles.inputValue;
}

export function invalidValueStyle(
  styles: DropdownSelectorStyles,
  variant: SelectorVariant,
) {
  if (variant === "map") return styles.mapValueInvalid;
  return null;
}

export function dropdownMinWidth(variant: SelectorVariant) {
  if (variant === "map") return 210;
  if (variant === "pill") return 180;
  return undefined;
}
