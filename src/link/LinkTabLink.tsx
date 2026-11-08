/** One tab of {@link LinkTabs}: a link with its own focus ring. */
import { Link } from "../primitives/link";
import { useCallback } from "react";
import {
  LayoutChangeEvent,
  StyleProp,
  Text,
  TextStyle,
} from "../primitives/reactNative";

import type { ButtonStyles } from "../button/buttonStyles";
import { type FocusIndicator, useFocusRing } from "../focusRing";

import type { LinkTab } from "./LinkTabs";
import type { LinkTabsStyles } from "./linkTabsStyles";
import { NewTabIndicator } from "./NewTabIndicator";

/**
 * One tab. A tab on a fill (current, hovered, or pressed) darkens its label
 * and count; the current tab keeps its label weight.
 */
export function LinkTabLink({
  arrowColor,
  buttonStyles,
  fill,
  focusIndicator,
  iconSize,
  labelStyle,
  newTabLabel,
  onNavigate,
  onReveal,
  onTabLayout,
  styles,
  tab,
}: {
  arrowColor: string;
  buttonStyles: ButtonStyles;
  fill: boolean;
  focusIndicator: FocusIndicator | undefined;
  iconSize: number;
  labelStyle: StyleProp<TextStyle>;
  newTabLabel: string;
  onNavigate: ((tab: LinkTab) => void) | undefined;
  /** Scrolls a scrolling row to the tab with its glow. */
  onReveal: ((key: string) => void) | undefined;
  /** Reports where the tab sits in a scrolling row. */
  onTabLayout: ((key: string, event: LayoutChangeEvent) => void) | undefined;
  styles: LinkTabsStyles;
  tab: LinkTab;
}) {
  const focus = useFocusRing({ indicator: focusIndicator });
  const current = tab.current ?? false;
  const newTab = tab.newTab ?? false;
  const key = tab.key ?? tab.href;
  const focusOnFocus = focus.onFocus;
  const handleFocus = useCallback(
    (event: Parameters<typeof focusOnFocus>[0]) => {
      focusOnFocus(event);
      onReveal?.(key);
    },
    [focusOnFocus, key, onReveal],
  );
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => onTabLayout?.(key, event),
    [key, onTabLayout],
  );
  return (
    <Link
      current={current}
      href={tab.href}
      newTab={newTab}
      onBlur={focus.onBlur}
      onFocus={handleFocus}
      onLayout={handleLayout}
      onNavigate={onNavigate ? () => onNavigate(tab) : undefined}
      style={({ hovered, pressed }) => [
        buttonStyles.button,
        styles.tab,
        fill ? styles.fillTab : null,
        hovered && !current ? styles.tabHover : null,
        current ? styles.current : null,
        pressed ? styles.tabPressed : null,
        tab.style,
        focus.focusRingVariables,
      ]}
      testID={tab.testID}
      {...focus.focusRingProps}
    >
      {({ hovered, pressed }) => {
        // A tab on a fill (current, hovered, or pressed) darkens its text.
        const active = current || hovered || pressed;
        return (
          <>
            <Text
              numberOfLines={1}
              style={[
                buttonStyles.label,
                styles.label,
                active ? styles.labelActive : null,
                labelStyle,
              ]}
            >
              {tab.label}
            </Text>
            {tab.count != null ? (
              <Text
                style={[
                  buttonStyles.label,
                  styles.count,
                  active ? styles.countActive : null,
                  labelStyle,
                ]}
              >
                {tab.count}
              </Text>
            ) : null}
            {newTab ? (
              <NewTabIndicator
                color={arrowColor}
                note={newTabLabel}
                size={iconSize}
              />
            ) : null}
          </>
        );
      }}
    </Link>
  );
}
