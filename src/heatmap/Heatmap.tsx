/** Calendar heatmap — a GitHub-style contribution grid over a date range. */
import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { compareIso, formatDisplay, parseIso } from "../date/dateMath";
import { hideWebOutlineView, useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";

import {
  buildHeatmapWeeks,
  type HeatmapWeekStart,
  monthLabelColumns,
} from "./heatmapGrid";
import {
  colorForValue,
  levelForValue,
  resolveThresholds,
} from "./heatmapScale";
import {
  createHeatmapStyles,
  type HeatmapStyles,
  MONTH_LABEL_HEIGHT,
} from "./heatmapStyles";

/** A single date's value, keyed by ISO `YYYY-MM-DD`. */
export type HeatmapDatum = { date: string; value: number };

/** The resolved data for one in-range cell, passed to consumer callbacks. */
export type HeatmapCell = {
  /** ISO `YYYY-MM-DD` date of the cell. */
  date: string;
  /** Value supplied for the date, or `undefined` when none was provided. */
  value: number | undefined;
  /** Intensity ramp index, or `-1` when the cell is empty / non-positive. */
  level: number;
};

export type HeatmapProps = {
  /** Inclusive ISO `YYYY-MM-DD` start of the range. */
  startDate: string;
  /** Inclusive ISO `YYYY-MM-DD` end of the range. */
  endDate: string;
  /** Per-date values; the last entry wins when a date is repeated. */
  values?: readonly HeatmapDatum[];

  /** Top row of every column: `0` Sunday (default) or `1` Monday. */
  weekStart?: HeatmapWeekStart;

  /** Square edge length in px. Default `12`. */
  cellSize?: number;
  /** Gap between cells in px (used for both rows and columns). Default `3`. */
  cellGap?: number;
  /** Cell corner radius in px. Default `2`. */
  cellRadius?: number;

  /** Intensity ramp, lowest → highest. Defaults to a theme-primary 4-step ramp. */
  colors?: readonly string[];
  /** Fill for in-range days with no value / a non-positive value. Defaults to theme `soft`. */
  emptyColor?: string;
  /**
   * Ascending lower-bound cutoffs: a value `>= thresholds[i]` reaches
   * `colors[i]`. Omit to derive even bands from the data's max value.
   */
  thresholds?: readonly number[];

  /** Render month labels above the grid. Default `true`. */
  showMonthLabels?: boolean;
  /** Render weekday labels left of the grid. Default `true`. */
  showWeekdayLabels?: boolean;
  /** Render the Less→More intensity legend below the grid. Default `true`. */
  showLegend?: boolean;
  /** Leading legend label. Default `"Less"`. */
  legendLessLabel?: string;
  /** Trailing legend label. Default `"More"`. */
  legendMoreLabel?: string;

  /** Scroll the grid horizontally while keeping the weekday gutter fixed. Default `false`. */
  scrollable?: boolean;

  /** Called when an in-range cell is pressed; supplying it makes cells pressable. */
  onCellPress?: (cell: HeatmapCell) => void;
  /** Accessible label per in-range cell. Defaults to `"<D Mon YYYY>: <value|No data>"`. */
  cellAccessibilityLabel?: (cell: HeatmapCell) => string;

  /** Accessible label describing the whole heatmap region. */
  accessibilityLabel?: string;
  /** Style override for the outer container. */
  style?: StyleProp<ViewStyle>;
};

/** Weekday labels for each grid row, by week start. */
const WEEKDAY_LABELS: Record<HeatmapWeekStart, readonly string[]> = {
  0: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  1: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
};

export function Heatmap({
  startDate,
  endDate,
  values = [],
  weekStart = 0,
  cellSize = 12,
  cellGap = 3,
  cellRadius = 2,
  colors,
  emptyColor,
  thresholds,
  showMonthLabels = true,
  showWeekdayLabels = true,
  showLegend = true,
  legendLessLabel = "Less",
  legendMoreLabel = "More",
  scrollable = false,
  onCellPress,
  cellAccessibilityLabel,
  accessibilityLabel,
  style,
}: HeatmapProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createHeatmapStyles(theme), [theme]);

  const ramp = useMemo<readonly string[]>(
    () =>
      colors && colors.length > 0
        ? colors
        : [
            theme.colors.primarySoft,
            theme.colors.primaryBorder,
            theme.colors.primary,
            theme.colors.primaryDeep,
          ],
    [colors, theme],
  );
  const empty = emptyColor ?? theme.colors.soft;

  const weeks = useMemo(
    () => buildHeatmapWeeks(startDate, endDate, weekStart),
    [startDate, endDate, weekStart],
  );

  const valueByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const datum of values) {
      if (parseIso(datum.date)) {
        map.set(datum.date, datum.value);
      }
    }
    return map;
  }, [values]);

  const resolvedThresholds = useMemo(() => {
    if (thresholds) {
      return thresholds;
    }
    let max = 0;
    for (const [iso, value] of valueByDate) {
      if (
        compareIso(iso, startDate) >= 0 &&
        compareIso(iso, endDate) <= 0 &&
        value > max
      ) {
        max = value;
      }
    }
    return resolveThresholds(ramp.length, max);
  }, [thresholds, valueByDate, startDate, endDate, ramp.length]);

  const months = useMemo(
    () => (showMonthLabels ? monthLabelColumns(weeks) : []),
    [showMonthLabels, weeks],
  );

  const step = cellSize + cellGap;
  const gridWidth = weeks.length * step - (weeks.length > 0 ? cellGap : 0);

  const describe = (cell: HeatmapCell) =>
    cellAccessibilityLabel
      ? cellAccessibilityLabel(cell)
      : `${formatDisplay(cell.date)}: ${cell.value ?? "No data"}`;

  const grid = (
    <View>
      {showMonthLabels ? (
        <View style={[styles.monthHeader, { width: Math.max(gridWidth, 0) }]}>
          {months.map((month) => (
            <Text
              key={`${month.label}-${month.weekIndex}`}
              numberOfLines={1}
              style={[styles.monthLabel, { left: month.weekIndex * step }]}
            >
              {month.label}
            </Text>
          ))}
        </View>
      ) : null}
      <View style={[styles.grid, { gap: cellGap }]}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={[styles.weekColumn, { gap: cellGap }]}>
            {week.map((day, row) => {
              if (!day.inRange) {
                return (
                  <View
                    aria-hidden
                    key={row}
                    style={{ height: cellSize, width: cellSize }}
                  />
                );
              }
              const value = valueByDate.get(day.iso);
              const level = levelForValue(value, resolvedThresholds);
              const cell: HeatmapCell = { date: day.iso, level, value };
              const color = colorForValue(
                value,
                ramp,
                resolvedThresholds,
                empty,
              );
              const label = describe(cell);
              return onCellPress ? (
                <HeatmapPressableCell
                  cell={cell}
                  color={color}
                  key={row}
                  label={label}
                  onPress={onCellPress}
                  radius={cellRadius}
                  size={cellSize}
                  styles={styles}
                />
              ) : (
                <View
                  accessibilityLabel={label}
                  accessible
                  key={row}
                  style={{
                    backgroundColor: color,
                    borderRadius: cellRadius,
                    height: cellSize,
                    width: cellSize,
                  }}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View
      aria-label={accessibilityLabel}
      // A labelled `group` names the region for assistive tech while keeping each
      // cell individually readable. Avoid `accessible` here: on native it would
      // merge every cell into one node and lose the per-day labels.
      role={accessibilityLabel ? "group" : undefined}
      style={[styles.container, style]}
    >
      <View style={styles.body}>
        {showWeekdayLabels ? (
          <View style={styles.gutter}>
            {showMonthLabels ? (
              <View style={{ height: MONTH_LABEL_HEIGHT }} />
            ) : null}
            <View style={{ gap: cellGap }}>
              {WEEKDAY_LABELS[weekStart].map((labelText, row) => (
                <View
                  key={row}
                  style={[styles.weekdayCell, { height: cellSize }]}
                >
                  {row % 2 === 1 ? (
                    <Text style={styles.weekdayLabel}>{labelText}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        ) : null}
        {scrollable ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {grid}
          </ScrollView>
        ) : (
          grid
        )}
      </View>
      {showLegend ? (
        <View style={styles.legend}>
          <Text style={styles.legendLabel}>{legendLessLabel}</Text>
          <View aria-hidden style={styles.legendSwatches}>
            {[empty, ...ramp].map((swatch, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: swatch,
                  borderRadius: cellRadius,
                  height: cellSize,
                  width: cellSize,
                }}
              />
            ))}
          </View>
          <Text style={styles.legendLabel}>{legendMoreLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

function HeatmapPressableCell({
  cell,
  color,
  label,
  onPress,
  radius,
  size,
  styles,
}: {
  cell: HeatmapCell;
  color: string;
  label: string;
  onPress: (cell: HeatmapCell) => void;
  radius: number;
  size: number;
  styles: HeatmapStyles;
}) {
  const focus = useFocusRing();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      onPress={() => onPress(cell)}
      style={[
        {
          backgroundColor: color,
          borderRadius: radius,
          height: size,
          width: size,
        },
        focus.focused ? styles.cellPressableFocused : null,
        hideWebOutlineView,
      ]}
    />
  );
}
