import { StyleSheet } from "../primitives/reactNative";

import { DEFAULT_FOCUS_RING_WIDTH } from "../focusRingCss";
import type { SharedUiTheme } from "../theme";
import { touchControlMetrics } from "../touchMetrics";

/**
 * The room a scrolling tab row keeps inside its edges, so that the focus glow
 * of its first and last tab is not clipped. The row gives the room back
 * outside, so the tabs still line up with the content around them.
 */
export const TAB_GLOW_ROOM = DEFAULT_FOCUS_RING_WIDTH;

/**
 * The tab-specific layers of {@link LinkTabs}. The box and the label of a tab
 * are the button's at the same size, so a tab has the height of a button; these
 * styles take away the button's resting chrome and add the tab states. The
 * current tab gets a control edge, a soft fill, and ink text, with the same
 * label weight, so the tabs do not shift.
 */
export function createLinkTabsStyles(theme: SharedUiTheme, touch: boolean) {
  return StyleSheet.create({
    count: { color: theme.colors.muted, fontVariant: ["tabular-nums"] },
    // On the soft fill of an active tab, muted text falls below 4.5:1 in the
    // default theme, so the count takes the secondary ink there.
    countActive: { color: theme.colors.ink2 },
    current: {
      backgroundColor: theme.colors.soft,
      borderColor: theme.colors.controlBorder,
    },
    // A filled bar shares its free width between its tabs, as on a phone: the
    // row is at least as wide as the bar, and each tab grows from its content
    // by an equal share of the free width. A tab never shrinks below its
    // content or its target floor; when the tabs do not fit, the row scrolls.
    fillContent: { flexGrow: 1, gap: 4 },
    fillTab: { flexBasis: "auto", flexGrow: 1, paddingHorizontal: 8 },
    label: { color: theme.colors.muted, flexShrink: 1 },
    labelActive: { color: theme.colors.ink },
    row: {
      alignItems: "center",
      flexDirection: "row",
      gap: 2,
      padding: TAB_GLOW_ROOM,
    },
    scroller: { flexGrow: 0, margin: -TAB_GLOW_ROOM },
    tab: {
      backgroundColor: "transparent",
      borderColor: "transparent",
      ...(touch ? { minWidth: touchControlMetrics.target } : null),
    },
    tabHover: { backgroundColor: theme.colors.soft },
    tabPressed: { backgroundColor: theme.colors.bg2 },
  });
}

export type LinkTabsStyles = ReturnType<typeof createLinkTabsStyles>;
