/** Compact status label ("badge" / status pill) — a tinted or solid chip. */
import { useMemo } from "react";
import type { ReactNode } from "react";
import { Platform, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import type { ControlSize } from "../controlSize";
import { PulseHalo } from "../status-dot/PulseHalo";
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
  /**
   * Custom container fill, overriding the tone/variant fill. Use with
   * {@link textColor} (and optionally {@link borderColor}) to render a status
   * pill from a caller-owned per-option color palette that the semantic tones
   * do not cover. Ensure the pair clears 4.5:1 (WCAG 1.4.3) — the library only
   * guarantees that for its built-in tones.
   */
  color?: string;
  /**
   * Custom border color, overriding the variant border. Setting it draws a 1px
   * border on any variant (not just `outline`).
   */
  borderColor?: string;
  /**
   * Show a small leading status dot, tinted to the resolved text color by
   * default (override with {@link dotColor}). The dot reinforces the label; the
   * text still states the status (WCAG 1.4.1).
   */
  dot?: boolean;
  /** Custom dot color, overriding the default (the resolved text color). */
  dotColor?: string;
  /**
   * Signal a live or in-progress state (the "● Running" pill) by swelling a
   * fading halo out of the leading {@link dot} — the same ping as
   * {@link StatusDot}, honouring the user's "reduce motion" preference. The halo
   * overflows the pill without resizing it. A no-op without {@link dot}, since
   * there is nothing to pulse.
   */
  pulse?: boolean;
  /** Density on the shared `sm` / `md` (default) / `lg` scale. */
  size?: ControlSize;
  /** Override the container pill style without forking the component. */
  style?: StyleProp<ViewStyle>;
  /** Custom label (and default dot) color, overriding the tone/variant text color. */
  textColor?: string;
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
   * `solid` is a filled accent chip with white text for higher emphasis;
   * `outline` is a white chip with a 1px accent border and deep accent text.
   */
  variant?: BadgeVariant;
};

/**
 * A small, non-interactive status pill. It renders a content-hugging rounded
 * chip whose fill, text, and (for `outline`) border color come from the
 * {@link BadgeTone} and {@link BadgeVariant} resolved against the theme — every
 * tone/variant pair stays ≥4.5:1 (WCAG 1.4.3 AA) on its own fill in both shipped
 * themes — and sizes on the shared {@link ControlSize} scale. An optional
 * leading {@link BadgeProps.dot} adds a tinted status dot (with
 * {@link BadgeProps.pulse} for a live state), and the
 * {@link BadgeProps.color} / {@link BadgeProps.textColor} /
 * {@link BadgeProps.borderColor} escape hatches render a status pill from a
 * caller-owned per-option palette. The label text states the status, so the
 * color reinforces rather than carries the meaning (1.4.1).
 */
export function Badge({
  accessibilityLabel,
  borderColor,
  children,
  color,
  dot = false,
  dotColor,
  pulse = false,
  size = "md",
  style,
  testID,
  textColor,
  tone = "neutral",
  variant = "soft",
}: BadgeProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createBadgeStyles(theme, size), [theme, size]);
  const base = resolveBadgeColors(theme.colors, tone, variant);
  // Custom colors (the per-option palette escape hatch) win over the resolved
  // tone/variant colors; the dot falls back to the label color.
  const backgroundColor = color ?? base.backgroundColor;
  const labelColor = textColor ?? base.color;
  const resolvedBorderColor = borderColor ?? base.borderColor;
  const resolvedDotColor = dotColor ?? labelColor;
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor },
        resolvedBorderColor
          ? { borderColor: resolvedBorderColor, borderWidth: 1 }
          : null,
        style,
      ]}
      testID={testID}
    >
      {dot ? (
        <View
          aria-hidden={Platform.OS === "web" ? true : undefined}
          style={styles.dot}
        >
          {/* Behind the fill, and free to overflow the pill as it swells. */}
          {pulse ? <PulseHalo color={resolvedDotColor} /> : null}
          <View
            style={[styles.dotFill, { backgroundColor: resolvedDotColor }]}
          />
        </View>
      ) : null}
      <Text
        // An explicit `accessibilityLabel` overrides the visible text as the
        // announced name (RNW maps it to `aria-label`); the single line keeps
        // the chip compact while the full string stays the accessible name.
        accessibilityLabel={accessibilityLabel}
        numberOfLines={1}
        style={[styles.label, { color: labelColor }]}
      >
        {children}
      </Text>
    </View>
  );
}
