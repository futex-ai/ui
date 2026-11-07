import { StyleSheet } from "../primitives/reactNative";

import type { ControlSize } from "../controlSize";
import type { SharedUiTheme } from "../theme";
import { touchControlMetrics } from "../touchMetrics";

/** The geometry and type of a list row at one size. */
type ListSizing = {
  descriptionFontSize: number;
  descriptionLineHeight: number;
  gap: number;
  /**
   * The least height of a row, where the size sets one. A row with more
   * content grows past it.
   */
  minHeight?: number;
  paddingHorizontal: number;
  paddingVertical: number;
  textGap: number;
  titleFontSize: number;
  titleFontWeight: "400" | "700";
  titleLineHeight: number;
};

/**
 * Per-size geometry for the list: the item padding, the gap between a row's
 * leading / main / trailing slots, the gap between the title and its
 * description, and the title / description type scale. `md` is the default
 * density and matches the surrounding controls' {@link ControlSize} scale; `sm`
 * is the compact density for dense lists and `lg` the roomier, touch-first one.
 * `xs` is the dense size: a single-line row is 26px high, with a 13px title on
 * an 18px line at weight 400.
 */
const LIST_SIZES: Record<ControlSize, ListSizing> = {
  xs: {
    descriptionFontSize: 12,
    descriptionLineHeight: 16,
    gap: 8,
    minHeight: 26,
    paddingHorizontal: 8,
    paddingVertical: 4,
    textGap: 0,
    titleFontSize: 13,
    titleFontWeight: "400",
    titleLineHeight: 18,
  },
  sm: {
    descriptionFontSize: 12,
    descriptionLineHeight: 16,
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textGap: 1,
    titleFontSize: 13,
    titleFontWeight: "700",
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
    titleFontWeight: "700",
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
    titleFontWeight: "700",
    titleLineHeight: 22,
  },
};

/**
 * A list row on a touch surface, whatever its size: a single-line row is 44px
 * high, with a 15px title on a 20px line and a 13px description on an 18px
 * line. The title keeps the weight of the size.
 */
const LIST_TOUCH_SIZE: Omit<ListSizing, "titleFontWeight"> = {
  descriptionFontSize: touchControlMetrics.rowDetailFontSize,
  descriptionLineHeight: touchControlMetrics.rowDetailLineHeight,
  gap: 12,
  minHeight: touchControlMetrics.rowMinHeight,
  paddingHorizontal: 16,
  paddingVertical: 12,
  textGap: 2,
  titleFontSize: touchControlMetrics.rowTitleFontSize,
  titleLineHeight: touchControlMetrics.rowTitleLineHeight,
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
  return listStylesFor(theme, LIST_SIZES[size]);
}

/**
 * Build the list's themed styles for a touch surface: the touch counterpart of
 * {@link createListStyles}. The rows take the touch metrics whatever the size,
 * and the title keeps the weight of the size.
 */
export function createTouchListStyles(
  theme: SharedUiTheme,
  size: ControlSize = "md",
) {
  return listStylesFor(theme, {
    ...LIST_TOUCH_SIZE,
    titleFontWeight: LIST_SIZES[size].titleFontWeight,
  });
}

function listStylesFor(theme: SharedUiTheme, sizing: ListSizing) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  const floor = sizing.minHeight;
  return StyleSheet.create({
    item: {
      justifyContent: floor === undefined ? undefined : "center",
      minHeight: floor,
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
    itemHover: { backgroundColor: theme.colors.soft },
    itemLeading: { flexShrink: 0 },
    itemMain: { flex: 1, gap: sizing.textGap, minWidth: 0 },
    // The title column as a pressable button (ListItem `onPress`): a pointer
    // cursor to signal the affordance, and a pressed dim, layered over the base
    // `itemMain` column so the leading/trailing slots stay outside the target.
    itemMainPressable: { cursor: "pointer" },
    itemMainPressed: { opacity: 0.6 },
    // Where the size sets a row floor, the pressable title spans the full row
    // height, padding included, so its target is at least the floor: 26px at
    // `xs` and 44px on a touch surface. The other sizes keep the title column.
    itemMainTarget:
      floor === undefined
        ? {}
        : {
            alignSelf: "stretch",
            justifyContent: "center",
            marginVertical: -sizing.paddingVertical,
            minHeight: floor,
            paddingVertical: sizing.paddingVertical,
          },
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
      fontWeight: sizing.titleFontWeight,
      lineHeight: sizing.titleLineHeight,
    },
    itemTrailing: { flexShrink: 0 },
    list: { width: "100%" },
    separator: { backgroundColor: theme.colors.border, height: 1 },
  });
}

export type ListStyles = ReturnType<typeof createListStyles>;
