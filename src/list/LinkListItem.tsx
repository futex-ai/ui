/**
 * A navigation row of a {@link List}: a link inside its list item, so the list
 * keeps its list semantics. It mirrors the pressable row — the hover wash, the
 * inset focus ring, and the pressed state — and the row of the current page
 * takes a tinted fill. A link holds no other control, so a row that needs one
 * keeps the control outside the link.
 */
import { Link } from "../primitives/link";
import { ReactNode, useMemo } from "react";
import { View } from "../primitives/reactNative";

import { buttonIconSize } from "../button/buttonStyles";
import type { ControlSize } from "../controlSize";
import { type FocusIndicator, useFocusRing } from "../focusRing";
import {
  linkName,
  NEW_TAB_NOTE,
  NewTabIndicator,
} from "../link/NewTabIndicator";
import { useSharedUiTheme } from "../theme";
import { touchControlMetrics } from "../touchMetrics";
import { useTouchSurface } from "../touchSurface";

import { ListRowLinkContext, type ListItemLink } from "./listRowLink";
import type { ListStyles } from "./listStyles";

export function LinkListItem({
  children,
  focusIndicator,
  label,
  link,
  newTabLabel = NEW_TAB_NOTE,
  onNavigate,
  size,
  styles,
  testID,
}: {
  children: ReactNode;
  focusIndicator: FocusIndicator | undefined;
  label?: string;
  link: ListItemLink;
  newTabLabel: string | undefined;
  onNavigate: (() => void) | undefined;
  size: ControlSize;
  styles: ListStyles;
  testID?: string;
}) {
  const theme = useSharedUiTheme();
  const touch = useTouchSurface();
  const focus = useFocusRing({ offset: -2, indicator: focusIndicator });
  const current = link.current ?? false;
  const newTab = link.newTab ?? false;
  const name = linkName(label, newTab, newTabLabel);
  const rowState = useMemo(() => ({ current }), [current]);
  return (
    <View role="listitem">
      <Link
        accessibilityLabel={name}
        current={current}
        href={link.href}
        newTab={newTab}
        onBlur={focus.onBlur}
        onFocus={focus.onFocus}
        onNavigate={onNavigate}
        style={({ hovered, pressed }) => [
          styles.item,
          newTab ? styles.itemLinkRow : null,
          hovered ? styles.itemHover : null,
          current ? styles.itemCurrent : null,
          pressed ? styles.itemPressed : null,
          focus.focusRingVariables,
        ]}
        testID={testID}
        {...focus.focusRingProps}
      >
        <ListRowLinkContext.Provider value={rowState}>
          {newTab ? (
            <View style={styles.itemLinkContent}>{children}</View>
          ) : (
            children
          )}
        </ListRowLinkContext.Provider>
        {newTab ? (
          <NewTabIndicator
            color={theme.colors.muted}
            note={name == null ? newTabLabel : undefined}
            size={touch ? touchControlMetrics.iconSize : buttonIconSize(size)}
          />
        ) : null}
      </Link>
    </View>
  );
}
