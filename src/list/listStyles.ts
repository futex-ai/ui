import { StyleSheet } from "react-native";

import type { ControlSize } from "../controlSize";
import type { SharedUiTheme } from "../theme";

/**
 * Per-size geometry for the list: the item padding, the gap between a row's
 * leading / main / trailing slots, the gap between the title and its
 * description, and the title / description type scale. `md` is the default
 * density and matches the surrounding controls' {@link ControlSize} scale; `sm`
 * is the compact density for dense lists and `lg` the roomier, touch-first one.
 */
const LIST_SIZES: Record<
  ControlSize,
  {
    descriptionFontSize: number;
    descriptionLineHeight: number;
    gap: number;
    paddingHorizontal: number;
    paddingVertical: number;
    textGap: number;
    titleFontSize: number;
    titleLineHeight: number;
  }
> = {
  sm: {
    descriptionFontSize: 12,
    descriptionLineHeight: 16,
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textGap: 1,
    titleFontSize: 13,
    titleLineHeight: 18,
  },
  md: {
    descriptionFontSize: 13,
    descriptionLineHeight: 18,
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    textGap: 2,
    titleFontSize: 15,
    titleLineHeight: 20,
  },
  lg: {
    descriptionFontSize: 14,
    descriptionLineHeight: 20,
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
    textGap: 2,
    titleFontSize: 16,
    titleLineHeight: 22,
  },
};

/**
 * Build the list's themed styles for a given size. The `item` padding is shared
 * by static and pressable rows; the pressable treatments (`itemHover`,
 * `itemPressed`, `itemFocused`, `itemDisabled`) layer over it and are only
 * applied when the list is given an `onItemPress` handler. The `separator` is a
 * hairline drawn BETWEEN items (never after the last) using the decorative
 * `border` divider token; the `itemRow` / `itemMain` / `itemTitle` /
 * `itemDescription` styles are the default {@link ListItem} layout.
 */
export function createListStyles(
  theme: SharedUiTheme,
  size: ControlSize = "md",
) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  const sizing = LIST_SIZES[size];
  return StyleSheet.create({
    item: {
      paddingHorizontal: sizing.paddingHorizontal,
      paddingVertical: sizing.paddingVertical,
    },
    itemDescription: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: sizing.descriptionFontSize,
      lineHeight: sizing.descriptionLineHeight,
    },
    itemDisabled: { opacity: 0.55 },
    // An inset ring keeps focus visible even when the row sits flush inside a
    // clipped card, mirroring the table row's box-shadow ring. Pairs with
    // `hideWebOutlineView` to drop the browser's default outline.
    itemFocused: { boxShadow: `inset 0 0 0 2px ${theme.colors.primary}` },
    itemHover: { backgroundColor: theme.colors.soft },
    itemLeading: { flexShrink: 0 },
    itemMain: { flex: 1, gap: sizing.textGap, minWidth: 0 },
    itemPressable: { cursor: "pointer" },
    itemPressed: { backgroundColor: theme.colors.bg2 },
    itemRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: sizing.gap,
    },
    itemTitle: {
      ...baseText,
      color: theme.colors.ink,
      fontSize: sizing.titleFontSize,
      fontWeight: "700",
      lineHeight: sizing.titleLineHeight,
    },
    itemTrailing: { flexShrink: 0 },
    list: { width: "100%" },
    separator: { backgroundColor: theme.colors.border, height: 1 },
  });
}

export type ListStyles = ReturnType<typeof createListStyles>;
