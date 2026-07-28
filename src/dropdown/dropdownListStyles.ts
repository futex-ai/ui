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
    // Tone-colored solid fills for the active danger/amber rows. The deep
    // accents (`roseDeep`/`amberDeep`) clear AA under white text — matching the
    // badge's solid tones — so a destructive/cautionary row reads as red/amber
    // beneath the inverted white label instead of an unreadable accent on the
    // green `primary` fill.
    itemActiveSolidDanger: { backgroundColor: theme.colors.roseDeep },
    itemActiveSolidWarning: { backgroundColor: theme.colors.amberDeep },
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
    // Trailing text (e.g. an account code). Muted grey at rest like the subtext;
    // on the solid active fill it picks up the highlight's secondary override
    // (white) so it stays legible instead of fading to ~1.2:1. Tabular figures
    // keep numeric codes aligned column-to-column down the list.
    rightText: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 13,
      fontVariant: ["tabular-nums"],
      fontWeight: "600",
      lineHeight: 18,
    },
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

/** Tone accent for a dropdown row, mirroring `DropdownListEntry["tone"]`. */
export type DropdownRowTone = "amber" | "danger" | "default" | "muted";

export type DropdownRowHighlight = {
  /** Color for the trailing selection checkmark. */
  checkColor: string;
  /**
   * Resolved color for caller-rendered row content (the `leading`/`right`
   * slots), tracking the label color for the same row state. The library can
   * only recolor what it renders itself, so a slot node hard-coded to `ink`
   * stays near-black on the `primary` fill while the label beside it inverts to
   * white; handing this color to a slot render function lets the caller tint
   * its own glyph to match.
   */
  contentColor: string;
  /**
   * Whether the row's text is inverted to white over a solid fill. When set,
   * the caller suppresses the tone accent so the inverted label/subtext wins.
   */
  invertText: boolean;
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
  state: {
    active: boolean;
    disabled: boolean;
    selected: boolean;
    tone?: DropdownRowTone;
  },
): DropdownRowHighlight {
  const isActive = state.active && !state.disabled;
  // The solid fill paints the active row in a saturated color, so its text is
  // inverted to white. A danger/amber row swaps the fill for its deep accent
  // (instead of recoloring the text) so the tone reads as red/amber while
  // staying legible; the caller suppresses the tone text on these rows.
  const invertText = isActive && variant === "solid";
  let rowStyle: object | null = null;
  let labelStyle: object | null = null;
  let secondaryStyle: object | null = null;
  // Resolved in lockstep with `labelStyle` so a caller-rendered slot always
  // matches the label beside it. The base is `itemLabel`'s own color.
  let contentColor = theme.colors.ink;
  if (isActive) {
    if (variant === "solid") {
      rowStyle = solidActiveFill(styles, state.tone);
      labelStyle = styles.itemLabelOnSolid;
      secondaryStyle = styles.itemSecondaryOnSolid;
      contentColor = theme.colors.surface;
    } else if (variant === "ring") {
      rowStyle = styles.itemActiveRing;
      labelStyle = styles.itemLabelActive;
      contentColor = theme.colors.primaryDeep;
    } else if (variant === "ringFill") {
      rowStyle = styles.itemActiveRingFill;
      labelStyle = styles.itemLabelActive;
      contentColor = theme.colors.primaryDeep;
    } else {
      rowStyle = styles.itemActiveDot;
      labelStyle = styles.itemLabelActive;
      contentColor = theme.colors.primaryDeep;
    }
  } else if (state.selected && (variant === "solid" || variant === "dot")) {
    // The non-focused selected row keeps a soft fill for `solid`/`dot`; `ring`
    // and `ringFill` stay flat and lean on the checkmark alone.
    rowStyle = styles.itemSelectedFill;
    labelStyle = styles.itemLabelActive;
    contentColor = theme.colors.primaryDeep;
  }
  // The tone accent wins off the inverted row, mirroring how `DropdownList`
  // layers `toneLabel` over `labelStyle`. On the solid fill the accent yields —
  // it would be unreadable there, so the white label/slot wins instead.
  if (!invertText) {
    if (state.tone === "danger") {
      contentColor = theme.colors.rose;
    } else if (state.tone === "amber") {
      contentColor = theme.colors.amber;
    }
  }
  return {
    checkColor: invertText ? theme.colors.surface : theme.colors.primary,
    contentColor,
    invertText,
    labelStyle,
    rowStyle,
    secondaryStyle,
    showCheck: state.selected,
    showDot: variant === "dot" && isActive,
    showDotSlot: variant === "dot",
  };
}

/**
 * Solid active-row fill keyed by tone: danger/amber rows take their deep accent
 * (`roseDeep`/`amberDeep`) so the fill carries the tone under white text, while
 * every other tone uses the `primary` fill.
 */
function solidActiveFill(styles: DropdownListStyles, tone?: DropdownRowTone) {
  if (tone === "danger") {
    return styles.itemActiveSolidDanger;
  }
  if (tone === "amber") {
    return styles.itemActiveSolidWarning;
  }
  return styles.itemActiveSolid;
}
