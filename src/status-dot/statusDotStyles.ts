import { StyleSheet } from "react-native";

import type { BadgeTone } from "../badge/badgeStyles";
import type { ControlSize } from "../controlSize";
import type { SharedUiTheme } from "../theme";

/**
 * The semantic status colors a dot can carry. This is the {@link BadgeTone}
 * vocabulary rather than a parallel one, so a dot and the badge beside it never
 * describe the same status in two different languages — aliasing the type (as
 * opposed to restating the union) is what makes drift impossible.
 */
export type StatusDotTone = BadgeTone;

/**
 * Per-size diameters on the shared `ControlSize` scale. The `md` default is 9px
 * because that was the workflow graph's hard-coded status dot, so promoting the
 * component out of `workflow/` left the graph pixel-identical.
 */
const STATUS_DOT_SIZES: Record<ControlSize, number> = {
  sm: 7,
  md: 9,
  lg: 11,
};

/**
 * Resolve a tone to its solid dot fill.
 *
 * Unlike {@link resolveBadgeColors} this returns a single mid accent rather than
 * a soft-fill/deep-text pair: a dot carries no text of its own, so there is no
 * contrast pair to satisfy — these are the same accents the badge `outline`
 * variant draws its border with. The dot reinforces adjacent text that states
 * the status, so color is never the only channel (WCAG 1.4.1).
 */
export function resolveStatusDotColor(
  colors: SharedUiTheme["colors"],
  tone: StatusDotTone,
): string {
  switch (tone) {
    case "neutral":
      return colors.ink2;
    case "primary":
      return colors.primary;
    case "warning":
      return colors.amber;
    case "danger":
      return colors.rose;
  }
}

/**
 * Build the size-driven dot style. The component layers the resolved tone (or a
 * custom color) on top as a `backgroundColor`, so this stays a pure circle.
 */
export function createStatusDotStyles(theme: SharedUiTheme, size: ControlSize) {
  const diameter = STATUS_DOT_SIZES[size];
  return StyleSheet.create({
    dot: {
      borderRadius: theme.radii.pill,
      height: diameter,
      width: diameter,
    },
  });
}

export type StatusDotStyles = ReturnType<typeof createStatusDotStyles>;
