/**
 * The hover/scrub readout.
 *
 * Deliberately **not** built on `Popover`. On native, `Popover` renders through
 * a full-screen `Modal` whose scrim swallows outside touches, which would kill
 * the scrub gesture the instant a tooltip opened; on web it anchors to a
 * measured trigger, which a crosshair following a pointer would re-measure on
 * every move. Charts are not inside `overflow: hidden` containers, so no portal
 * is needed at all — this is a plain absolutely-positioned view.
 *
 * It is also `aria-hidden` and non-interactive. A portaled, never-focused
 * tooltip is not announced by screen readers, so it is never the only carrier
 * of a value: the mark's own accessible label and the table view both hold it.
 */
import { useMemo } from "react";
import { Text, View } from "react-native";

import { useSharedUiTheme } from "../theme";

import type { Rect } from "./chartLayout";
import { CHART_MARKS } from "./chartMarks";

export type TooltipRow = {
  seriesId: string;
  label: string;
  color: string;
  value: string;
};

export type ChartTooltipProps = {
  /** Heading — usually the category or the snapped x value. */
  title: string;
  rows: readonly TooltipRow[];
  /** Anchor in plot coordinates; the tooltip is clamped to stay inside. */
  x: number;
  y: number;
  plot: Rect;
  testID?: string;
};

const TOOLTIP_WIDTH = 168;
const ROW_HEIGHT = 18;
const OFFSET = 12;

export function ChartTooltip({
  title,
  rows,
  x,
  y,
  plot,
  testID,
}: ChartTooltipProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(
    () => ({
      card: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.md,
        borderWidth: 1,
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 8,
        width: TOOLTIP_WIDTH,
      },
      title: {
        color: theme.colors.muted,
        fontFamily: theme.fonts.sans,
        fontSize: 11,
      },
      row: {
        alignItems: "center" as const,
        flexDirection: "row" as const,
        gap: 6,
      },
      // The value is the strong element and the series name is secondary —
      // the legend's hierarchy inverted, because here the reader already has
      // the series and wants the number.
      value: {
        color: theme.colors.ink,
        fontFamily: theme.fonts.sans,
        fontSize: 12,
        fontWeight: "600" as const,
        marginLeft: "auto" as const,
      },
      label: {
        color: theme.colors.muted,
        fontFamily: theme.fonts.sans,
        fontSize: 12,
        flexShrink: 1,
      },
    }),
    [theme],
  );

  const height = 26 + rows.length * ROW_HEIGHT;
  // Flip to the other side of the pointer rather than spilling out of the plot.
  const left =
    x + OFFSET + TOOLTIP_WIDTH <= plot.width
      ? x + OFFSET
      : Math.max(0, x - OFFSET - TOOLTIP_WIDTH);
  const top = Math.max(0, Math.min(y - height / 2, plot.height - height));

  return (
    <View
      aria-hidden
      pointerEvents="none"
      style={[
        styles.card,
        {
          left: plot.x + left,
          position: "absolute",
          top: plot.y + top,
        },
      ]}
      testID={testID}
    >
      <Text style={styles.title}>{title}</Text>
      {rows.map((row) => (
        <View key={row.seriesId} style={styles.row}>
          {/* A short stroke, not a filled box: at tooltip density a box is
              data-weight ink doing a label's job. */}
          <View
            style={{
              backgroundColor: row.color,
              borderRadius: CHART_MARKS.lineWidth,
              height: CHART_MARKS.lineWidth,
              width: 10,
            }}
          />
          <Text numberOfLines={1} style={styles.label}>
            {row.label}
          </Text>
          <Text style={styles.value}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}
