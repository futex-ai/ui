/** Small rounded tag for a Kanban column-header status or a card chip. */
import { useMemo } from "react";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { resolveBadgeColors } from "../badge/badgeStyles";
import type { BadgeTone } from "../badge/badgeStyles";
import { useSharedUiTheme } from "../theme";

import { createKanbanChipStyles } from "./kanbanStyles";

/**
 * A literal fill + text color for a chip, taking precedence over `tone`. The
 * shape mirrors {@link resolveBadgeColors}'s output so a resolved tone and a
 * caller-supplied color flow through the same code path. The caller owns the
 * contrast: keep the text ≥4.5:1 on the fill (WCAG 2.1 — 1.4.3 AA).
 */
export type KanbanChipColor = { backgroundColor: string; color: string };

export type KanbanChipProps = {
  /** The chip label, typically a short word or code. Truncates to one line. */
  children: ReactNode;
  /**
   * A literal `{ backgroundColor, color }` fill, for a palette-specific status
   * or channel color beyond the semantic tones. Takes precedence over `tone`.
   */
  color?: KanbanChipColor;
  /** A decorative leading node (e.g. a channel or file icon), hidden from assistive tech. */
  leading?: ReactNode;
  /**
   * Drop the fill and render the label as inline muted text — the right fit for
   * an icon + count metadatum such as a file attachment badge. Takes precedence
   * over `tone` and `color`. Pair it with self-describing text (e.g. "2 files")
   * since the `leading` icon is hidden from assistive tech.
   */
  plain?: boolean;
  /** Extra style for the chip container. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  /**
   * The semantic status color: `neutral` (the default — a quiet neutral fill,
   * matching a "score 0.81" metadatum), `primary`, `warning`, or `danger`,
   * resolved against the theme as a soft tint with deep accent text.
   */
  tone?: BadgeTone;
};

/**
 * A compact, non-interactive tag. It renders a content-hugging, gently rounded
 * chip (the small `radii.sm` corner — 6px in the default theme — deliberately
 * not the fully-rounded {@link Badge} pill) whose fill and text
 * color come from a `tone` (resolved by {@link resolveBadgeColors}, every pair
 * ≥4.5:1), a literal `color` override for arbitrary status / channel palettes,
 * or — under `plain` — no fill at all for inline icon + count metadata. A
 * `leading` icon is treated as decorative and hidden from assistive tech, so the
 * label text carries the meaning (1.4.1).
 */
export function KanbanChip({
  children,
  color,
  leading,
  plain = false,
  style,
  testID,
  tone = "neutral",
}: KanbanChipProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createKanbanChipStyles(theme), [theme]);
  const resolved: KanbanChipColor = plain
    ? { backgroundColor: "transparent", color: theme.colors.muted }
    : (color ?? resolveBadgeColors(theme.colors, tone, "soft"));
  return (
    <View
      style={[
        styles.chip,
        plain ? styles.chipPlain : null,
        { backgroundColor: resolved.backgroundColor },
        style,
      ]}
      testID={testID}
    >
      {leading != null ? (
        // The icon restates what the label already says (the channel, a file),
        // so it is removed from the accessibility tree on web, iOS, and Android
        // to avoid a duplicate / meaningless announcement (WCAG 2.1 — 1.1.1).
        <View
          accessibilityElementsHidden
          aria-hidden
          importantForAccessibility="no-hide-descendants"
          style={styles.leading}
        >
          {leading}
        </View>
      ) : null}
      <Text numberOfLines={1} style={[styles.label, { color: resolved.color }]}>
        {children}
      </Text>
    </View>
  );
}
