/**
 * The default row layout for a {@link List}: an optional leading node (e.g. an
 * avatar), a bold title with an optional muted description stacked beneath it,
 * and an optional trailing accessory (e.g. a tag, amount, or chevron). The three
 * slots sit on one centred flex row; the title / description column flexes to
 * fill the space between the leading and trailing slots. Give it an `onPress` to
 * make only that title / description column a button, so the row can pair a
 * pressable label with an independently-interactive trailing control.
 */
import { ReactNode, useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type { ControlSize } from "../controlSize";
import { devWarn } from "../devWarn";
import { PressableHoverState, useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";

import { createListStyles, type ListStyles } from "./listStyles";

export type ListItemProps = {
  /**
   * Accessible name for the pressable title column (only when `onPress` is set).
   * Defaults to a string/number `title`; required when `title` is a rich node.
   */
  accessibilityLabel?: string;
  /** Secondary line under the title. A string/number is given the muted text treatment; any node renders as-is. */
  description?: ReactNode;
  /** Disable the pressable title (only relevant with `onPress`). */
  disabled?: boolean;
  /**
   * Disable the shared focus glow on the pressable title. It then falls back to
   * the browser's default focus outline so keyboard focus stays visible (WCAG
   * 2.1 — 2.4.7 Focus Visible, AA). Disable every ring at once via the theme's
   * `focusRing: false` flag instead.
   */
  disableFocusRing?: boolean;
  /** Leading slot, e.g. an `Avatar`. */
  leading?: ReactNode;
  /**
   * Make only the title + description column a pressable button, leaving the
   * `leading` and `trailing` slots independently interactive (e.g. a pressable
   * label beside a live toggle in the same row). Use this on a static
   * {@link List} (no `onItemPress`) so the two press targets do not nest —
   * `List.onItemPress` instead makes the whole row the target.
   */
  onPress?: () => void;
  /** Match the type scale to the list's `size`. Defaults to `md`. */
  size?: ControlSize;
  /**
   * Test identifier for the title press target when `onPress` is set, or the
   * static row otherwise (`data-testid` on web).
   */
  testID?: string;
  /** Primary line. A string/number is given the bold title treatment; any node renders as-is. */
  title: ReactNode;
  /** Trailing slot, e.g. a tag, amount, or chevron. */
  trailing?: ReactNode;
};

/**
 * A standard list row. `leading` and `trailing` render any node; `title` and
 * `description` get the default typography when passed a string/number, or
 * render as-is when passed a node — so the common text row needs no styling
 * while a custom row stays possible. The outer padding comes from the
 * {@link List} item wrapper, so this only owns the in-row layout.
 */
export function ListItem({
  accessibilityLabel,
  description,
  disabled = false,
  disableFocusRing = false,
  leading,
  onPress,
  size = "md",
  testID,
  title,
  trailing,
}: ListItemProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createListStyles(theme, size), [theme, size]);
  // The pressable-title column needs an accessible name: an explicit
  // `accessibilityLabel`, or a string/number `title`. A rich-node title with no
  // label leaves the button nameless (WCAG 4.1.2), so warn.
  const resolvedName =
    accessibilityLabel ?? (isText(title) ? String(title) : undefined);
  if (onPress && !resolvedName) {
    devWarn(
      "ListItem: a pressable `onPress` title needs an `accessibilityLabel` when " +
        "`title` is not a string/number, so the button has an accessible name.",
    );
  }
  const mainContent = (
    <>
      {isText(title) ? <Text style={styles.itemTitle}>{title}</Text> : title}
      {isText(description) ? (
        <Text style={styles.itemDescription}>{description}</Text>
      ) : (
        (description ?? null)
      )}
    </>
  );
  return (
    <View style={styles.itemRow} testID={onPress ? undefined : testID}>
      {leading != null ? (
        <View style={styles.itemLeading}>{leading}</View>
      ) : null}
      {onPress ? (
        <PressableTitle
          disabled={disabled}
          disableFocusRing={disableFocusRing}
          label={resolvedName}
          onPress={onPress}
          styles={styles}
          testID={testID}
        >
          {mainContent}
        </PressableTitle>
      ) : (
        <View style={styles.itemMain}>{mainContent}</View>
      )}
      {trailing != null ? (
        <View style={styles.itemTrailing}>{trailing}</View>
      ) : null}
    </View>
  );
}

/**
 * The title + description column as a `button`, used when {@link ListItem} is
 * given an `onPress`. It carries only the title/description slot as the press
 * target — the row's `leading` and `trailing` slots stay outside it, so a live
 * trailing control (a toggle / action) remains independently interactive
 * alongside a pressable label. Mirrors the shared pressable affordances: the
 * sage focus ring (with the hidden web outline), a pressed dim, and a disabled
 * state. Keyboard activation (Enter / Space) comes from RNW's `button` role.
 */
function PressableTitle({
  children,
  disabled,
  disableFocusRing,
  label,
  onPress,
  styles,
  testID,
}: {
  children: ReactNode;
  disabled: boolean;
  disableFocusRing: boolean;
  label?: string;
  onPress: () => void;
  styles: ListStyles;
  testID?: string;
}) {
  const focus = useFocusRing({ disabled: disableFocusRing });
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      onPress={onPress}
      testID={testID}
      style={({ pressed }: PressableHoverState) => [
        styles.itemMain,
        styles.itemMainPressable,
        pressed && !disabled ? styles.itemMainPressed : null,
        focus.focused ? focus.focusRingStyle : null,
        disabled ? styles.itemDisabled : null,
        focus.webOutlineReset,
      ]}
    >
      {children}
    </Pressable>
  );
}

/** A plain string/number is wrapped in the themed Text; richer nodes render as-is. */
function isText(value: ReactNode): value is number | string {
  return typeof value === "string" || typeof value === "number";
}
