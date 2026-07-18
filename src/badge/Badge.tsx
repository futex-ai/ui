/** Compact status label ("badge" / status pill) — a tinted or solid chip. */
import { useMemo } from "react";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import type { ControlSize } from "../controlSize";
import { useSharedUiTheme } from "../theme";

import { createBadgeStyles, resolveBadgeColors } from "./badgeStyles";
import type { BadgeTone, BadgeVariant } from "./badgeStyles";

export type BadgeProps = {
  /**
   * Override the announced text. Use when the visible label is an abbreviation
   * or a bare number (e.g. show `3`, announce "3 unread"). Omit to let the
   * visible label be the accessible name.
   */
  accessibilityLabel?: string;
  /** The label shown in the badge, typically one or two short words. */
  children: ReactNode;
  /** Density on the shared `sm` / `md` (default) / `lg` scale. */
  size?: ControlSize;
  /** Override the container pill style without forking the component. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  /**
   * The semantic status color: `neutral` (default), `primary` (the brand /
   * positive accent — the green "Active" status in the default theme),
   * `warning`, or `danger`.
   */
  tone?: BadgeTone;
  /**
   * The fill style: `soft` (default) is a tinted fill with deep accent text;
   * `solid` is a filled accent chip with white text for higher emphasis.
   */
  variant?: BadgeVariant;
};

/**
 * A small, non-interactive status pill. It renders a content-hugging rounded
 * chip whose fill and text color come from the {@link BadgeTone} and
 * {@link BadgeVariant} resolved against the theme — every tone/variant pair
 * stays ≥4.5:1 (WCAG 1.4.3 AA) on its own fill in both shipped themes — and
 * sizes on the shared {@link ControlSize} scale. The label text states the
 * status, so the color reinforces rather than carries the meaning (1.4.1).
 */
export function Badge({
  accessibilityLabel,
  children,
  size = "md",
  style,
  testID,
  tone = "neutral",
  variant = "soft",
}: BadgeProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createBadgeStyles(theme, size), [theme, size]);
  const colors = resolveBadgeColors(theme.colors, tone, variant);
  return (
    <View
      style={[styles.badge, { backgroundColor: colors.backgroundColor }, style]}
      testID={testID}
    >
      <Text
        // An explicit `accessibilityLabel` overrides the visible text as the
        // announced name (RNW maps it to `aria-label`); the single line keeps
        // the chip compact while the full string stays the accessible name.
        accessibilityLabel={accessibilityLabel}
        numberOfLines={1}
        style={[styles.label, { color: colors.color }]}
      >
        {children}
      </Text>
    </View>
  );
}
