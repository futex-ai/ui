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
    // Active-row highlight atoms — one per `DropdownHighlightVariant`, assembled
    // by `dropdownRowHighlight`. Each keeps the focused row perceivable at ≥3:1
    // non-text contrast (WCAG 1.4.11): a soft tint alone is only ~1.13:1, so a
    // variant uses a solid `primary` fill, a `primary` outline ring, or (for
    // `dot`) a soft fill paired with a ≥3:1 `primary` dot — a label-color shift
    // alone is insufficient.
    itemActiveDot: { backgroundColor: theme.colors.soft },
    itemActiveRing: { boxShadow: `inset 0 0 0 1.5px ${theme.colors.primary}` },
    itemActiveRingFill: {
      backgroundColor: theme.colors.primarySoft,
      boxShadow: `inset 0 0 0 1.5px ${theme.colors.primary}`,
    },
    itemActiveSolid: { backgroundColor: theme.colors.primary },
    itemDisabled: { opacity: 0.5 },
    itemDot: {
      backgroundColor: theme.colors.primary,
      borderRadius: 4,
      height: 7,
      width: 7,
    },
    // Fixed-width leading gutter that reserves room for the `dot` variant's
    // marker so every row's label stays aligned whether or not it is focused.
    itemDotSlot: { alignItems: "center", width: 7 },
    itemLabel: {
      ...baseText,
      color: theme.colors.ink,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 18,
    },
    itemLabelActive: { color: theme.colors.primaryDeep },
    // White label for the solid-fill active row (`solid` variant); `surface`
    // (white) clears AA text contrast on the `primary` fill.
    itemLabelOnSolid: { color: theme.colors.surface },
    // Subtext color for the solid-fill active row. The muted grey all but
    // vanishes on the `primary` fill (~1.2:1), so the secondary line flips to
    // `surface` (white) like the label. No dimmer tint clears AA on `primary`
    // (even `primarySoft` is only ~4.2:1), so hierarchy here leans on the
    // subtext's smaller size/weight rather than a lighter color.
    itemSecondaryOnSolid: { color: theme.colors.surface },
    itemSelectedFill: { backgroundColor: theme.colors.primarySoft },
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

/**
 * How the focused (active) and selected option rows are highlighted:
 * - `solid` — focused row filled with `primary` under a white label (default).
 * - `ring` — focused row outlined with a `primary` ring, no fill.
 * - `ringFill` — focused row outlined with a `primary` ring over a light fill.
 * - `dot` — focused row gets a soft fill plus a leading `primary` dot.
 *
 * In every variant a selected `option` row is marked with a trailing checkmark
 * (so selection survives independently of which row is focused). The legacy
 * left-accent bar is replaced by these variants.
 */
export type DropdownHighlightVariant = "dot" | "ring" | "ringFill" | "solid";

export const DEFAULT_DROPDOWN_HIGHLIGHT: DropdownHighlightVariant = "solid";

export type DropdownRowHighlight = {
  /** Color for the trailing selection checkmark. */
  checkColor: string;
  /** Label color override for the row, or `null` to keep the base label. */
  labelStyle: object | null;
  /** Background/ring style for the row, or `null` when it stays flat. */
  rowStyle: object | null;
  /** Subtext color override for the row, or `null` to keep the muted subtext. */
  secondaryStyle: object | null;
  /** Whether a trailing selection checkmark should be shown. */
  showCheck: boolean;
  /** Whether the `dot` marker itself is shown (focused rows only). */
  showDot: boolean;
  /** Whether the `dot` leading gutter should be reserved on this row. */
  showDotSlot: boolean;
};

/**
 * Resolves the per-row highlight styling for a `DropdownHighlightVariant` given
 * the row's focused/selected/disabled state. Keeping it pure (no JSX) lets
 * `DropdownList` stay thin and makes the variant mapping unit-testable.
 */
export function dropdownRowHighlight(
  styles: DropdownListStyles,
  theme: SharedUiTheme,
  variant: DropdownHighlightVariant,
  state: { active: boolean; disabled: boolean; selected: boolean },
): DropdownRowHighlight {
  const isActive = state.active && !state.disabled;
  let rowStyle: object | null = null;
  let labelStyle: object | null = null;
  let secondaryStyle: object | null = null;
  if (isActive) {
    if (variant === "solid") {
      rowStyle = styles.itemActiveSolid;
      labelStyle = styles.itemLabelOnSolid;
      secondaryStyle = styles.itemSecondaryOnSolid;
    } else if (variant === "ring") {
      rowStyle = styles.itemActiveRing;
      labelStyle = styles.itemLabelActive;
    } else if (variant === "ringFill") {
      rowStyle = styles.itemActiveRingFill;
      labelStyle = styles.itemLabelActive;
    } else {
      rowStyle = styles.itemActiveDot;
      labelStyle = styles.itemLabelActive;
    }
  } else if (state.selected && (variant === "solid" || variant === "dot")) {
    // The non-focused selected row keeps a soft fill for `solid`/`dot`; `ring`
    // and `ringFill` stay flat and lean on the checkmark alone.
    rowStyle = styles.itemSelectedFill;
    labelStyle = styles.itemLabelActive;
  }
  return {
    checkColor:
      variant === "solid" && isActive
        ? theme.colors.surface
        : theme.colors.primary,
    labelStyle,
    rowStyle,
    secondaryStyle,
    showCheck: state.selected,
    showDot: variant === "dot" && isActive,
    showDotSlot: variant === "dot",
  };
}
