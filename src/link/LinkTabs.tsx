/**
 * Tabs that are links: a named navigation landmark whose tabs each load their
 * own page. Not an ARIA tab list, which switches panels inside one page.
 */
import { useMemo } from "react";
import {
  ScrollView,
  StyleProp,
  TextStyle,
  View,
  ViewStyle,
} from "../primitives/reactNative";

import {
  buttonIconSize,
  createButtonStyles,
  createTouchButtonStyles,
} from "../button/buttonStyles";
import type { ControlSize } from "../controlSize";
import type { FocusIndicator } from "../focusRing";
import { useSharedUiTheme } from "../theme";
import { touchControlMetrics } from "../touchMetrics";
import { useTouchSurface } from "../touchSurface";

import { LinkTabLink } from "./LinkTabLink";
import { createLinkTabsStyles, TAB_GLOW_ROOM } from "./linkTabsStyles";
import { NEW_TAB_NOTE } from "./NewTabIndicator";
import { useRevealFocusedTab } from "./useRevealFocusedTab";

/** One tab: a link to its own page. */
export type LinkTab = {
  /** A count after the label, such as the number of files. Part of the name. */
  count?: number | string;
  /** The tab of the page that shows now. The caller decides it. */
  current?: boolean;
  /** The destination of the tab. */
  href: string;
  /** Stable React key. Defaults to `href`. */
  key?: string;
  /** Visible label, which names the tab with its count. */
  label: string;
  /**
   * Open the destination in a new tab on web. The tab then shows an arrow,
   * and its name ends with the new-tab note.
   */
  newTab?: boolean;
  /** Extra style for this tab, layered after the tab states. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the tab link (`data-testid` on web). */
  testID?: string;
};

export type LinkTabsProps = {
  /** Names the navigation landmark, such as "Project". */
  accessibilityLabel: string;
  /**
   * Share the free width of the bar between the tabs, as on a phone. Each tab
   * grows from its content by an equal share of the free width, so the tabs
   * fill the bar and every label shows. A tab never shrinks below its content
   * or its target floor, 44 px on a touch surface; when the tabs do not fit,
   * the bar scrolls sideways like a row without `fill`.
   */
  fill?: boolean;
  /**
   * How the tabs show keyboard focus: the shared `ring` glow, the browser's
   * `outline`, or `none`. Defaults to the theme's `focusIndicator`.
   */
  focusIndicator?: FocusIndicator;
  /**
   * Extra style for the label and the count of every tab, such as a monospace
   * font in capitals. The tab keeps the height of its size.
   */
  labelStyle?: StyleProp<TextStyle>;
  /** The note at the end of the name of a new-tab tab. Defaults to "(opens in a new tab)". */
  newTabLabel?: string;
  /**
   * The app's own navigation, given the activated tab. On web, a primary
   * click or Enter without a modifier on a same-tab tab runs it instead of
   * loading its `href`; on native every activation runs it.
   */
  onNavigate?: (tab: LinkTab) => void;
  /** Control density. A tab has the height of a button of the same size. Defaults to `md`. */
  size?: ControlSize;
  /** Extra style for the navigation landmark. */
  style?: StyleProp<ViewStyle>;
  /** The tabs, in order. */
  tabs: readonly LinkTab[];
  /** Test identifier forwarded to the landmark (`data-testid` on web). */
  testID?: string;
};

/**
 * A row of link tabs inside a named navigation landmark. Each tab is one stop
 * in the tab order, and arrow keys do not move between tabs. The current tab
 * changes its fill, outline, and text colour, but not its label weight. A row
 * wider than its container scrolls sideways and keeps room for the focus glow
 * of each tab; `fill` also shares the free width of the bar between the tabs.
 */
export function LinkTabs({
  accessibilityLabel,
  fill = false,
  focusIndicator,
  labelStyle,
  newTabLabel = NEW_TAB_NOTE,
  onNavigate,
  size = "md",
  style,
  tabs,
  testID,
}: LinkTabsProps) {
  const theme = useSharedUiTheme();
  // On a touch surface the tabs take the touch metrics, whatever their size.
  const touch = useTouchSurface();
  const buttonStyles = useMemo(
    () =>
      touch ? createTouchButtonStyles(theme) : createButtonStyles(theme, size),
    [theme, size, touch],
  );
  const styles = useMemo(
    () => createLinkTabsStyles(theme, touch),
    [theme, touch],
  );
  const iconSize = touch ? touchControlMetrics.iconSize : buttonIconSize(size);
  // A scrolling row keeps the focused tab and its glow inside the row.
  const row = useRevealFocusedTab(TAB_GLOW_ROOM);
  const items = tabs.map((tab) => (
    <LinkTabLink
      arrowColor={theme.colors.muted}
      buttonStyles={buttonStyles}
      fill={fill}
      focusIndicator={focusIndicator}
      iconSize={iconSize}
      key={tab.key ?? tab.href}
      labelStyle={labelStyle}
      newTabLabel={newTabLabel}
      onNavigate={onNavigate}
      onReveal={row.reveal}
      onTabLayout={row.onTabLayout}
      styles={styles}
      tab={tab}
    />
  ));
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      role="navigation"
      style={style}
      testID={testID}
    >
      <ScrollView
        contentContainerStyle={[styles.row, fill ? styles.fillContent : null]}
        horizontal
        onLayout={row.onLayout}
        onScroll={row.onScroll}
        ref={row.scrollRef}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        style={styles.scroller}
      >
        {items}
      </ScrollView>
    </View>
  );
}
