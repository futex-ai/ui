/**
 * Vertical list that draws a hairline separator BETWEEN consecutive items and —
 * deliberately — never after the last one.
 *
 * The separator is its own presentational node interleaved between items rather
 * than a bottom border on each row, so the rule "a divider between items, but
 * none trailing the final item" is expressed directly by a `!last` guard and the
 * item content stays free of border styling. The list exposes proper `list` /
 * `listitem` semantics, and — when given `onItemPress` — turns every item into a
 * pressable button with the shared hover wash, sage focus ring, pressed and
 * disabled states, and keyboard activation. Item content is supplied by a
 * `renderItem` callback (use {@link ListItem} for the default avatar / title /
 * description / trailing row), so a list can hold anything.
 */
import { Fragment, ReactNode, useMemo } from "react";
import { Pressable, StyleProp, View, ViewStyle } from "react-native";

import type { ControlSize } from "../controlSize";
import { PressableHoverState, useFocusRing } from "../focusRing";
import {
  SkeletonBar,
  SkeletonCircle,
  SkeletonPulseProvider,
} from "../skeleton";
import { useSharedUiTheme } from "../theme";

import { createListStyles, type ListStyles } from "./listStyles";

/** Leading-circle diameter for a skeleton item, matching a typical list avatar. */
const SKELETON_AVATAR_DIAMETER = 40;
/** Title / description placeholder widths cycled by item index for natural variety. */
const SKELETON_TITLE_WIDTHS = ["48%", "62%", "40%"] as const;
const SKELETON_DESCRIPTION_WIDTHS = ["82%", "70%", "90%"] as const;

export type ListProps<Item> = {
  /** Accessible label for the whole list. */
  accessibilityLabel?: string;
  /**
   * Disable the shared focus glow on pressable items. They then fall back to the
   * browser's default focus outline so keyboard focus stays visible (WCAG 2.1 —
   * 2.4.7 Focus Visible, AA). Disable every ring at once via the theme's
   * `focusRing: false` flag instead.
   */
  disableFocusRing?: boolean;
  /** Mark a specific item as non-pressable (only relevant with `onItemPress`). */
  itemDisabled?: (item: Item, index: number) => boolean;
  /** Stable React key for an item. */
  itemKey: (item: Item, index: number) => string;
  /** Accessible label for a pressable item, e.g. `Open Calum Moore`. */
  itemLabel?: (item: Item, index: number) => string;
  /** The data items. */
  items: Item[];
  /**
   * Show placeholder skeleton items instead of `items` while the data loads. The
   * list announces `aria-busy` and the placeholder items are non-interactive and
   * hidden from assistive technology.
   */
  loading?: boolean;
  /** Number of skeleton items to render while `loading`. Defaults to 6. */
  loadingItemCount?: number;
  /** Press handler per item. Providing it makes every item a pressable button. */
  onItemPress?: (item: Item, index: number) => void;
  /** Renders the content for a given item. */
  renderItem: (item: Item, index: number) => ReactNode;
  /**
   * Draw a hairline separator between items (never after the last). Defaults to
   * `true`; set `false` for a flush, separator-less stack.
   */
  separators?: boolean;
  /**
   * Inset the separator from the left edge by this many px — e.g. to align it
   * with the text past a leading avatar. Defaults to full-bleed (`0`).
   */
  separatorInset?: number;
  /** Control density: `sm`, `md` (default), or `lg`. */
  size?: ControlSize;
  /** Extra style for the list container (e.g. a card border + radius). */
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

/**
 * The shared list. Renders `items` through `renderItem`, drawing a `separators`
 * hairline between each pair (never after the last). Pass `onItemPress` to make
 * items pressable buttons — with hover, the sage focus ring, and a disabled
 * state — or omit it for plain static rows. Frame it with a card border + radius
 * + `overflow: "hidden"` via `style`.
 */
export function List<Item>({
  accessibilityLabel,
  disableFocusRing = false,
  itemDisabled,
  itemKey,
  itemLabel,
  items,
  loading = false,
  loadingItemCount = 6,
  onItemPress,
  renderItem,
  separators = true,
  separatorInset,
  size = "md",
  style,
  testID,
}: ListProps<Item>) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createListStyles(theme, size), [theme, size]);

  if (loading) {
    return (
      <View
        accessibilityLabel={accessibilityLabel}
        // The busy list announces the loading state; the placeholder items below
        // are decorative and kept off the accessibility tree.
        accessibilityState={{ busy: true }}
        aria-busy
        role="list"
        style={[styles.list, style]}
        testID={testID}
      >
        <SkeletonPulseProvider>
          {Array.from({ length: loadingItemCount }).map((_, index) => {
            const last = index === loadingItemCount - 1;
            return (
              <Fragment key={`skeleton-${index}`}>
                <View aria-hidden style={styles.item}>
                  <View style={styles.itemRow}>
                    <View style={styles.itemLeading}>
                      <SkeletonCircle diameter={SKELETON_AVATAR_DIAMETER} />
                    </View>
                    <View style={styles.itemMain}>
                      <SkeletonBar
                        height={14}
                        width={
                          SKELETON_TITLE_WIDTHS[
                            index % SKELETON_TITLE_WIDTHS.length
                          ]
                        }
                      />
                      <SkeletonBar
                        height={11}
                        width={
                          SKELETON_DESCRIPTION_WIDTHS[
                            index % SKELETON_DESCRIPTION_WIDTHS.length
                          ]
                        }
                      />
                    </View>
                    <View style={styles.itemTrailing}>
                      <SkeletonBar height={12} radius="pill" width={56} />
                    </View>
                  </View>
                </View>
                {separators && !last ? (
                  <Separator inset={separatorInset} styles={styles} />
                ) : null}
              </Fragment>
            );
          })}
        </SkeletonPulseProvider>
      </View>
    );
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      role="list"
      style={[styles.list, style]}
      testID={testID}
    >
      {items.map((item, index) => {
        const last = index === items.length - 1;
        const content = renderItem(item, index);
        return (
          <Fragment key={itemKey(item, index)}>
            {onItemPress ? (
              <PressableListItem
                disabled={itemDisabled?.(item, index) ?? false}
                disableFocusRing={disableFocusRing}
                label={itemLabel?.(item, index)}
                onPress={() => onItemPress(item, index)}
                styles={styles}
              >
                {content}
              </PressableListItem>
            ) : (
              <View role="listitem" style={styles.item}>
                {content}
              </View>
            )}
            {separators && !last ? (
              <Separator inset={separatorInset} styles={styles} />
            ) : null}
          </Fragment>
        );
      })}
    </View>
  );
}

/**
 * A pressable item, rendered when the list has an `onItemPress`. The `listitem`
 * grouping lives on the wrapper while the inner pressable carries `button`
 * semantics, so assistive tech still reads "list, N items" around clickable
 * rows. Mirrors the shared button / table row: a hover wash, the sage focus ring
 * (an inset box-shadow so it shows even inside a clipped card), a pressed and
 * disabled state, and the hidden web outline. Keyboard activation (Enter /
 * Space) comes from react-native-web's Pressable for the `button` role.
 */
function PressableListItem({
  children,
  disabled,
  disableFocusRing,
  label,
  onPress,
  styles,
}: {
  children: ReactNode;
  disabled: boolean;
  disableFocusRing: boolean;
  label?: string;
  onPress: () => void;
  styles: ListStyles;
}) {
  const focus = useFocusRing({ disabled: disableFocusRing });
  return (
    <View role="listitem">
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onBlur={focus.onBlur}
        onFocus={focus.onFocus}
        onPress={onPress}
        style={({ hovered, pressed }: PressableHoverState) => [
          styles.item,
          styles.itemPressable,
          hovered && !disabled ? styles.itemHover : null,
          pressed && !disabled ? styles.itemPressed : null,
          focus.focused && focus.ringEnabled ? styles.itemFocused : null,
          disabled ? styles.itemDisabled : null,
          focus.webOutlineReset,
        ]}
      >
        {children}
      </Pressable>
    </View>
  );
}

/**
 * The hairline drawn between items. It is purely decorative — removed from the
 * accessibility tree (`role="none"` + `aria-hidden`) so the `list` only owns its
 * `listitem` children — and can be inset from the left to align with the text.
 */
function Separator({ inset, styles }: { inset?: number; styles: ListStyles }) {
  return (
    <View
      accessibilityRole="none"
      aria-hidden
      role="none"
      style={[
        styles.separator,
        inset !== undefined ? { marginLeft: inset } : null,
      ]}
    />
  );
}
