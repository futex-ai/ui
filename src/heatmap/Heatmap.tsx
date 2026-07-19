/** Calendar heatmap — a GitHub-style contribution grid over a date range. */
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { compareIso, formatDisplay, parseIso } from "../date/dateMath";
import { hideWebOutlineView, useFocusRing } from "../focusRing";
import {
  type FocusableRef,
  focusItemAt,
  rovingTabIndex,
} from "../keyboardNavigation";
import { useSharedUiTheme } from "../theme";

import {
  buildHeatmapWeeks,
  type HeatmapWeek,
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
  /**
   * Accessible label per in-range cell. Defaults to
   * `"<D Mon YYYY>: <value> (<tier>)"` (e.g. `"4 Mar 2024: 5 (high)"`), or
   * `"<D Mon YYYY>: No data"` when no value was supplied. The qualitative tier
   * carries the intensity to screen-reader users so it isn't conveyed by color
   * alone (WCAG 2.1 — 1.4.1 Use of Color, A).
   */
  cellAccessibilityLabel?: (cell: HeatmapCell) => string;

  /** Accessible label describing the whole heatmap region. */
  accessibilityLabel?: string;
  /** Style override for the outer container. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

/** Weekday labels for each grid row, by week start. */
const WEEKDAY_LABELS: Record<HeatmapWeekStart, readonly string[]> = {
  0: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  1: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
};

/**
 * Qualitative names for the default 4-step ramp, lowest → highest, plus an empty
 * tier. Folded into the per-cell accessible label so the intensity reaches
 * screen-reader users as words, not just as the color the eye sees (WCAG 2.1 —
 * 4.1.2 Name, Role, Value, A; 1.4.1 Use of Color, A). Levels above the named
 * tiers fall back to "highest".
 */
const LEVEL_NAMES = ["none", "low", "medium", "high", "highest"] as const;

/** Human-readable intensity tier for a cell level (`-1` is empty). */
function levelName(level: number): string {
  return LEVEL_NAMES[Math.min(level + 1, LEVEL_NAMES.length - 1)];
}

/**
 * One focusable in-range cell, with its grid coordinates. The heatmap is
 * column-major (a week is a column, weekday is the row), so `col` indexes the
 * week and `row` the weekday; both drive arrow-key navigation across the grid.
 */
type FocusableCellEntry = {
  cell: HeatmapCell;
  color: string;
  label: string;
  /** Week column index. */
  col: number;
  /** Weekday row index `0..6`. */
  row: number;
};

/**
 * Resolve the next focusable-cell index for a grid navigation key, or `null`
 * when the key is not handled. Movement skips out-of-range padding cells: Arrow
 * keys step one column/row at a time and keep moving in that direction until an
 * in-range cell (or the edge) is reached; Home/End jump to the column ends;
 * PageUp/PageDown jump to the first/last week in the current row; Ctrl+Home /
 * Ctrl+End jump to the first/last cell overall.
 */
function nextHeatmapCellIndex(
  key: string,
  ctrlKey: boolean,
  current: FocusableCellEntry,
  byCoord: ReadonlyMap<string, number>,
  cols: number,
): number | null {
  const at = (col: number, row: number): number | undefined =>
    byCoord.get(`${col}:${row}`);
  // Walk in a direction until an in-range cell is found or we run off the grid.
  const scan = (dCol: number, dRow: number): number | null => {
    let col = current.col + dCol;
    let row = current.row + dRow;
    while (col >= 0 && col < cols && row >= 0 && row < 7) {
      const found = at(col, row);
      if (found !== undefined) {
        return found;
      }
      col += dCol;
      row += dRow;
    }
    return null;
  };

  switch (key) {
    case "ArrowRight":
      return scan(1, 0);
    case "ArrowLeft":
      return scan(-1, 0);
    case "ArrowDown":
      return scan(0, 1);
    case "ArrowUp":
      return scan(0, -1);
    case "Home":
      if (ctrlKey) {
        return 0;
      }
      // First in-range cell of the current column.
      for (let row = 0; row < 7; row += 1) {
        const found = at(current.col, row);
        if (found !== undefined) {
          return found;
        }
      }
      return null;
    case "End":
      if (ctrlKey) {
        return byCoord.size - 1;
      }
      for (let row = 6; row >= 0; row -= 1) {
        const found = at(current.col, row);
        if (found !== undefined) {
          return found;
        }
      }
      return null;
    case "PageUp":
      // Same row, first week that has a cell there.
      for (let col = 0; col < cols; col += 1) {
        const found = at(col, current.row);
        if (found !== undefined) {
          return found;
        }
      }
      return null;
    case "PageDown":
      for (let col = cols - 1; col >= 0; col -= 1) {
        const found = at(col, current.row);
        if (found !== undefined) {
          return found;
        }
      }
      return null;
    default:
      return null;
  }
}

/** Web `keydown` event shape — enough of it to read the key and stop default. */
type GridKeyEvent = {
  key?: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

/**
 * Spreadable `role="gridcell"` for web. `gridcell` is a web ARIA concept and is
 * missing from React Native's `Role` union (only `cell`, for tables, is typed),
 * though RNW forwards the literal to the DOM, so it's cast through the spread and
 * emitted only on web. On native this is `{}`, leaving the per-cell labels — the
 * native a11y model — untouched (WCAG 2.1 — 1.3.1 Info and Relationships, A).
 */
function gridcellRoleProps(webGrid: boolean) {
  return webGrid
    ? ({ role: "gridcell" } as unknown as { role?: undefined })
    : {};
}

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
  testID,
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

  // Resolve every day to its render descriptor once, so the JSX render, the
  // focusable-cell list, and the coord map all agree. The default label folds in
  // the qualitative intensity tier ("(low)", "(high)") so screen-reader users
  // get the same signal the color carries for sighted users (WCAG 2.1 — 1.4.1
  // Use of Color, A; 4.1.2 Name, Role, Value, A).
  const resolvedWeeks = useMemo(() => {
    const describeCell = (cell: HeatmapCell): string => {
      if (cellAccessibilityLabel) {
        return cellAccessibilityLabel(cell);
      }
      const date = formatDisplay(cell.date);
      return cell.value == null
        ? `${date}: No data`
        : `${date}: ${cell.value} (${levelName(cell.level)})`;
    };
    return weeks.map((week: HeatmapWeek) =>
      week.map((day) => {
        if (!day.inRange) {
          return null;
        }
        const value = valueByDate.get(day.iso);
        const level = levelForValue(value, resolvedThresholds);
        const cell: HeatmapCell = { date: day.iso, level, value };
        const color = colorForValue(value, ramp, resolvedThresholds, empty);
        return { cell, color, label: describeCell(cell) };
      }),
    );
  }, [
    weeks,
    valueByDate,
    resolvedThresholds,
    ramp,
    empty,
    cellAccessibilityLabel,
  ]);

  // Flat list of in-range cells (column-major) and a coord lookup, used to
  // power roving-tabindex arrow navigation when the grid is interactive. Only
  // built when `onCellPress` is set — without it cells are non-focusable.
  const focusable = useMemo<FocusableCellEntry[]>(() => {
    if (!onCellPress) {
      return [];
    }
    const out: FocusableCellEntry[] = [];
    resolvedWeeks.forEach((week, col) =>
      week.forEach((resolved, row) => {
        if (resolved) {
          out.push({ ...resolved, col, row });
        }
      }),
    );
    return out;
  }, [resolvedWeeks, onCellPress]);

  const byCoord = useMemo(() => {
    const map = new Map<string, number>();
    focusable.forEach((entry, index) =>
      map.set(`${entry.col}:${entry.row}`, index),
    );
    return map;
  }, [focusable]);

  // The single tab stop of the grid: only this cell is reachable by Tab; arrow
  // keys move it (WCAG 2.1 — 2.1.1 Keyboard, A; 2.4.3 Focus Order, A).
  const [activeIndex, setActiveIndex] = useState(0);
  const cellRefs = useRef<Array<{ current: FocusableRef }>>([]);
  // Keep the ref array length in sync with the focusable cells.
  cellRefs.current = focusable.map(
    (_, index) => cellRefs.current[index] ?? { current: null },
  );
  // Clamp the active index when the data shrinks so it never dangles past the
  // end of the list.
  const safeActiveIndex =
    focusable.length === 0 ? 0 : Math.min(activeIndex, focusable.length - 1);

  const handleGridKeyDown = useCallback(
    (event: GridKeyEvent) => {
      const key = event.nativeEvent?.key ?? event.key;
      if (!key || focusable.length === 0) {
        return;
      }
      const current =
        focusable[Math.min(safeActiveIndex, focusable.length - 1)];
      const next = nextHeatmapCellIndex(
        key,
        Boolean(event.ctrlKey || event.metaKey),
        current,
        byCoord,
        resolvedWeeks.length,
      );
      if (next === null) {
        return;
      }
      event.preventDefault?.();
      event.stopPropagation?.();
      setActiveIndex(next);
      focusItemAt(cellRefs.current, next);
    },
    [focusable, safeActiveIndex, byCoord, resolvedWeeks.length],
  );

  const gridKeyProps =
    onCellPress && Platform.OS === "web"
      ? { onKeyDown: handleGridKeyDown }
      : {};
  // `role=grid`/`row`/`gridcell` are web-only ARIA concepts; gate them so native
  // semantics (the per-cell labels) are not regressed (WCAG 2.1 — 1.3.1, A).
  const webGrid = Platform.OS === "web";
  let focusIndexCounter = -1;

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
      <View
        role={webGrid ? "grid" : undefined}
        style={[styles.grid, { gap: cellGap }]}
        {...gridKeyProps}
      >
        {resolvedWeeks.map((week, weekIndex) => (
          <View
            key={weekIndex}
            role={webGrid ? "row" : undefined}
            style={[styles.weekColumn, { gap: cellGap }]}
          >
            {week.map((resolved, row) => {
              if (!resolved) {
                return (
                  <View
                    aria-hidden
                    key={row}
                    role={webGrid ? "presentation" : undefined}
                    style={{ height: cellSize, width: cellSize }}
                  />
                );
              }
              const { cell, color, label } = resolved;
              if (!onCellPress) {
                return (
                  <View
                    accessibilityLabel={label}
                    accessible
                    key={row}
                    style={[
                      {
                        backgroundColor: color,
                        borderRadius: cellRadius,
                        height: cellSize,
                        width: cellSize,
                      },
                      styles.cell,
                    ]}
                    {...gridcellRoleProps(webGrid)}
                  />
                );
              }
              focusIndexCounter += 1;
              const focusIndex = focusIndexCounter;
              return (
                <HeatmapPressableCell
                  cell={cell}
                  cellRef={cellRefs.current[focusIndex]}
                  color={color}
                  key={row}
                  label={label}
                  onFocusCell={() => setActiveIndex(focusIndex)}
                  onPress={onCellPress}
                  radius={cellRadius}
                  size={cellSize}
                  styles={styles}
                  tabIndex={rovingTabIndex(focusIndex, safeActiveIndex)}
                  webGrid={webGrid}
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
      testID={testID}
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
        // A labelled group ties the Less→More scale together as one named unit
        // for assistive tech; the color swatches stay aria-hidden since they
        // carry no information beyond what the two text labels already give
        // (WCAG 2.1 — 4.1.2 Name, Role, Value, A).
        <View
          accessibilityLabel="Intensity scale"
          role="group"
          style={styles.legend}
        >
          <Text style={styles.legendLabel}>{legendLessLabel}</Text>
          <View aria-hidden style={styles.legendSwatches}>
            {[empty, ...ramp].map((swatch, index) => (
              <View
                key={index}
                style={[
                  {
                    backgroundColor: swatch,
                    borderRadius: cellRadius,
                    height: cellSize,
                    width: cellSize,
                  },
                  styles.cell,
                ]}
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
  cellRef,
  color,
  label,
  onFocusCell,
  onPress,
  radius,
  size,
  styles,
  tabIndex,
  webGrid,
}: {
  cell: HeatmapCell;
  /** Slot in the grid's ref array, so arrow nav can move DOM focus here. */
  cellRef: { current: FocusableRef };
  color: string;
  label: string;
  /** Sync the grid's active index when this cell takes focus (e.g. by click). */
  onFocusCell: () => void;
  onPress: (cell: HeatmapCell) => void;
  radius: number;
  size: number;
  styles: HeatmapStyles;
  /** Roving tab index: `0` for the single active cell, `-1` otherwise. */
  tabIndex: 0 | -1;
  webGrid: boolean;
}) {
  const focus = useFocusRing();
  // A `gridcell` wrapper holds the single interactive button so the structure is
  // valid ARIA (`grid` > `row` > `gridcell` > `button`) instead of overloading
  // one node with both roles. The button keeps the roving tab index and the DOM
  // focus; the wrapper is purely structural (web-only). RNW synthesises
  // Enter/Space activation for `role=button`, so no explicit key handler is
  // needed for activation; arrow keys bubble to the grid's `onKeyDown`.
  const button = (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onBlur={focus.onBlur}
      onFocus={() => {
        focus.onFocus();
        onFocusCell();
      }}
      onPress={() => onPress(cell)}
      ref={(node) => {
        cellRef.current = node as unknown as FocusableRef;
      }}
      style={[
        {
          backgroundColor: color,
          borderRadius: radius,
          height: size,
          width: size,
        },
        styles.cell,
        // Suppress the UA default outline first, then layer the custom ring so
        // it wins — the ring carries its own `outlineStyle: "solid"`, which the
        // base `outlineStyle: "none"` would otherwise clobber if applied after.
        hideWebOutlineView,
        focus.focused ? styles.cellPressableFocused : null,
      ]}
      tabIndex={tabIndex}
    />
  );
  if (!webGrid) {
    return button;
  }
  return <View {...gridcellRoleProps(webGrid)}>{button}</View>;
}
