import { StyleSheet } from "react-native";

import type { ControlSize } from "../controlSize";
import type { SharedUiTheme } from "../theme";

/**
 * Per-size geometry for the board. `md` matches the product mockup (286px
 * columns, 10px column padding, 11px card padding, a 13px card title, a 22px
 * footer avatar); `sm` is the compact density for dense boards and `lg` the
 * roomier, touch-first density, in lockstep with the other controls'
 * {@link ControlSize} scale. The board frame itself (the 16px outer padding and
 * the 14px gap between columns) stays constant across sizes — it is the outer
 * chrome, not the content density.
 */
const KANBAN_SIZES: Record<
  ControlSize,
  {
    addFontSize: number;
    avatarDiameter: number;
    cardGap: number;
    cardPadding: number;
    columnGap: number;
    columnPadding: number;
    countFontSize: number;
    footerFontSize: number;
    footerLineHeight: number;
    headerGap: number;
    titleFontSize: number;
    titleLineHeight: number;
  }
> = {
  sm: {
    addFontSize: 15,
    avatarDiameter: 20,
    cardGap: 7,
    cardPadding: 9,
    columnGap: 8,
    columnPadding: 8,
    countFontSize: 10,
    footerFontSize: 10,
    footerLineHeight: 14,
    headerGap: 6,
    titleFontSize: 12,
    titleLineHeight: 17,
  },
  md: {
    addFontSize: 17,
    avatarDiameter: 22,
    cardGap: 8,
    cardPadding: 11,
    columnGap: 9,
    columnPadding: 10,
    countFontSize: 11,
    footerFontSize: 11,
    footerLineHeight: 15,
    headerGap: 8,
    titleFontSize: 13,
    titleLineHeight: 18,
  },
  lg: {
    addFontSize: 19,
    avatarDiameter: 26,
    cardGap: 10,
    cardPadding: 13,
    columnGap: 11,
    columnPadding: 12,
    countFontSize: 12,
    footerFontSize: 12,
    footerLineHeight: 16,
    headerGap: 9,
    titleFontSize: 14,
    titleLineHeight: 20,
  },
};

/** The chip label's single line box, and the padding stacked above and below it. */
const CHIP_LABEL_LINE_HEIGHT = 16;
const CHIP_PADDING_VERTICAL = 2;

/**
 * The cap on the header accessory slot: the status chip's box. The chip's type
 * scale is fixed (it does not track {@link ControlSize}) and the count text is
 * shorter, so this is 20px at `sm`, `md`, and `lg` alike, and it is the floor of
 * the header row's height in every configuration — an add button, the one other
 * header child that can be taller, only ever adds to it (19/21/23px at
 * sm/md/lg). Capping the slot at the floor is what makes an accessory unable to
 * change a header's height, so columns with and without one stay aligned.
 */
const HEADER_CONTENT_HEIGHT =
  CHIP_LABEL_LINE_HEIGHT + CHIP_PADDING_VERTICAL * 2;

/** The footer avatar diameter for a given board size — exported so a card can size its `Avatar`. */
export function kanbanAvatarDiameter(size: ControlSize = "md"): number {
  return KANBAN_SIZES[size].avatarDiameter;
}

/**
 * Build the board's themed styles for a given size. The board is a horizontal
 * flex row (one fixed-width column per status); each column is a soft-tinted
 * rounded card holding a header and a vertical stack of cards. The pressable-card
 * treatments (`cardHover`, `cardPressed`, `cardFocused`, `cardDisabled`) layer
 * over the base `card` and are only applied when the board is given an
 * `onCardPress` handler — mirroring the Table row / List item pattern. The
 * inset focus ring keeps the indicator visible inside the clipped, scrolling
 * board (an outset outline would be cropped), matching the data table's rows.
 */
export function createKanbanStyles(
  theme: SharedUiTheme,
  size: ControlSize = "md",
) {
  const sizing = KANBAN_SIZES[size];
  return StyleSheet.create({
    addButton: {
      alignItems: "center",
      borderRadius: theme.radii.sm,
      justifyContent: "center",
      marginLeft: "auto",
      padding: 2,
    },
    // With an accessory in the header the trailing group is already end-aligned
    // by the accessory's auto margin; a second auto margin would split the free
    // space between the two, so the add button falls back to the header gap.
    addButtonAfterAccessory: { marginLeft: 0 },
    addButtonHover: { backgroundColor: theme.colors.bg2 },
    addButtonPressable: { cursor: "pointer" },
    addGlyph: {
      color: theme.colors.muted,
      fontFamily: theme.fonts.sans,
      fontSize: sizing.addFontSize,
      lineHeight: sizing.addFontSize,
    },
    board: { width: "100%" },
    boardRow: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: 14,
      padding: 16,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      // A soft two-layer shadow-sm (matching the mockup's compound `--shadow-sm`)
      // lifts the card off the soft column without a hard edge; the ink-tinted
      // rgba stays in step with the library's other elevations (toast, modal).
      boxShadow:
        "0 1px 2px rgba(20, 28, 22, 0.05), 0 1px 3px rgba(20, 28, 22, 0.04)",
      padding: sizing.cardPadding,
    },
    cardDisabled: { opacity: 0.55 },
    // The keyboard-grabbed card, dimmed in place (it stays focusable to receive
    // the arrow keys) while its preview marks the target slot.
    cardGrabbed: { opacity: 0.4 },
    // The translucent clone that rides the cursor during a pointer drag (a
    // stronger shadow lifts it off the board; the tilt is applied by the hook).
    cardGhost: {
      boxShadow: "0 12px 28px rgba(20, 28, 22, 0.28)",
      left: 0,
      opacity: 0.92,
      top: 0,
      zIndex: 1000,
    },
    // The preview shown at the drop slot: a faded, dashed copy of the card that
    // marks — Trello-style — exactly where the card would land.
    cardPreview: {
      borderColor: theme.colors.primary,
      borderStyle: "dashed",
      opacity: 0.4,
    },
    // An inset ring keeps focus visible on a card inside the horizontally
    // clipped, scrolling board (an outset outline would be cropped), mirroring
    // the data table's bottom-bordered rows. Pairs with `hideWebOutlineView`.
    cardFocused: { boxShadow: `inset 0 0 0 2px ${theme.colors.primary}` },
    cardHover: { borderColor: theme.colors.border2 },
    cardInner: { flexDirection: "column", gap: sizing.cardGap },
    cardPressable: { cursor: "pointer" },
    cardPressed: { backgroundColor: theme.colors.bg2 },
    cardTitle: {
      color: theme.colors.ink,
      fontFamily: theme.fonts.sans,
      fontSize: sizing.titleFontSize,
      fontWeight: "600",
      lineHeight: sizing.titleLineHeight,
    },
    chipsRow: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 5,
    },
    column: {
      backgroundColor: theme.colors.soft,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      flexDirection: "column",
      gap: sizing.columnGap,
      padding: sizing.columnPadding,
    },
    count: {
      color: theme.colors.muted,
      fontFamily: theme.fonts.mono,
      fontSize: sizing.countFontSize,
      lineHeight: sizing.countFontSize + 3,
    },
    footer: {
      alignItems: "center",
      flexDirection: "row",
      gap: sizing.headerGap,
    },
    footerSpacer: { flex: 1 },
    footerText: {
      color: theme.colors.muted,
      fontFamily: theme.fonts.mono,
      fontSize: sizing.footerFontSize,
      lineHeight: sizing.footerLineHeight,
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      gap: sizing.headerGap,
      paddingBottom: 2,
      paddingHorizontal: 2,
    },
    // The consumer-rendered accessory slot. An auto margin end-aligns it (the
    // chip + count keep the left cluster), it never shrinks — the title chip
    // truncates first — and it is capped at the chip's box so a taller accessory
    // is centre-clipped rather than stretching the header.
    headerAccessory: {
      alignItems: "center",
      flexDirection: "row",
      flexShrink: 0,
      justifyContent: "center",
      marginLeft: "auto",
      maxHeight: HEADER_CONTENT_HEIGHT,
      overflow: "hidden",
    },
  });
}

export type KanbanStyles = ReturnType<typeof createKanbanStyles>;

/**
 * Build the chip's themed styles. A chip is a content-hugging rounded tag
 * (`radii.sm` — a small rounded rectangle, 6px in the default theme,
 * deliberately not the fully-rounded
 * {@link Badge} pill) used for the column-header status label and the card's
 * channel / score / file tags. Its fill and text color are resolved by the
 * component (a tone, a custom color, or the muted neutral) and layered on top;
 * the `plain` variant drops the fill entirely for inline icon + count metadata.
 */
export function createKanbanChipStyles(theme: SharedUiTheme) {
  return StyleSheet.create({
    chip: {
      alignItems: "center",
      alignSelf: "flex-start",
      borderRadius: theme.radii.sm,
      flexDirection: "row",
      gap: 5,
      maxWidth: "100%",
      overflow: "hidden",
      paddingHorizontal: 9,
      paddingVertical: CHIP_PADDING_VERTICAL,
    },
    chipPlain: { backgroundColor: "transparent", paddingHorizontal: 0 },
    label: {
      fontFamily: theme.fonts.sans,
      fontSize: 12,
      fontWeight: "600",
      lineHeight: CHIP_LABEL_LINE_HEIGHT,
    },
    leading: { alignItems: "center", flexDirection: "row" },
  });
}

export type KanbanChipStyles = ReturnType<typeof createKanbanChipStyles>;
