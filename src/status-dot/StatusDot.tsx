/** A small round status dot — tinted, optionally pulsing, optionally spoken. */
import { useMemo } from "react";
import { View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import type { ControlSize } from "../controlSize";
import { useSharedUiTheme } from "../theme";

import { PulseHalo } from "./PulseHalo";
import {
  createStatusDotStyles,
  resolveStatusDotColor,
} from "./statusDotStyles";
import type { StatusDotTone } from "./statusDotStyles";

export type StatusDotProps = {
  /**
   * Custom dot color, overriding the {@link tone}. Use it for a caller-owned
   * per-option palette the four semantic tones do not cover — the workflow
   * graph's fainter `skipped` dot comes through here.
   */
  color?: string;
  /**
   * The announced name (e.g. "Running"). Omit — the default — to leave the dot
   * decorative: a status dot almost always sits beside text that already states
   * the status, and announcing it twice is noise. Pass a label only when the dot
   * stands alone, so the status is never carried by color alone (WCAG 1.4.1).
   */
  label?: string;
  /**
   * Signal a live or in-progress state with a halo that swells out of the dot
   * and fades, like a radar ping. The dot itself stays solid. The halo overflows
   * the dot's box (and any pill around it) without affecting layout, and is not
   * drawn at all when the user prefers reduced motion.
   */
  pulse?: boolean;
  /** Density on the shared `sm` / `md` (default) / `lg` scale — 7 / 9 / 11px. */
  size?: ControlSize;
  /** Extra style for the dot (e.g. a margin against its label). */
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  /**
   * The semantic status color: `neutral` (default), `primary` (the brand /
   * positive accent — green in the default theme), `warning` (amber), or
   * `danger` (rose).
   */
  tone?: StatusDotTone;
};

/**
 * The status dot: a circle sized on the shared {@link ControlSize} scale and
 * filled from the four-tone {@link StatusDotTone} vocabulary it shares with the
 * {@link Badge}. Pass {@link StatusDotProps.pulse} for a live/in-progress ping,
 * and {@link StatusDotProps.label} when the dot stands alone and must name
 * itself; otherwise it stays decorative and lets the adjacent text speak.
 */
export function StatusDot({
  color,
  label,
  pulse = false,
  size = "md",
  style,
  testID,
  tone = "neutral",
}: StatusDotProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(
    () => createStatusDotStyles(theme, size),
    [theme, size],
  );
  // No label means nothing to announce, so the dot is hidden from assistive tech
  // rather than reported as an unnamed image.
  const decorative = label === undefined;
  const fill = color ?? resolveStatusDotColor(theme.colors, tone);

  return (
    <View
      accessibilityElementsHidden={decorative}
      accessibilityLabel={label}
      accessibilityRole={decorative ? undefined : "image"}
      aria-hidden={decorative || undefined}
      importantForAccessibility={decorative ? "no-hide-descendants" : undefined}
      style={[styles.dot, style]}
      testID={testID}
    >
      {/* Behind the fill, so the translucent ping never tints the dot itself. */}
      {pulse ? <PulseHalo color={fill} /> : null}
      <View style={[styles.fill, { backgroundColor: fill }]} />
    </View>
  );
}
