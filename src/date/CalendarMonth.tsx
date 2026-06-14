/**
 * The branded month grid shared by both date-picker overlays: a header with
 * prev/next month navigation, a Monday-first weekday row, and focusable, labelled
 * day buttons. Adjacent-month and out-of-bounds days are non-selectable. Clicking
 * the month/year title swaps the grid for a year picker so a far-off year is one
 * jump away. Holds no platform code — the web popover and the native sheet both
 * render it.
 */
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import { useSharedUiTheme } from "../theme";

import {
  buildMonthGrid,
  DayCell,
  formatDisplay,
  monthLabel,
  parseIso,
  shiftMonth,
  toIso,
  WEEKDAYS,
  yearBlockStart,
  yearRange,
  yearRangeLabel,
  YEARS_PER_PAGE,
} from "./dateMath";
import { DateBounds, PressableHoverState } from "./types";
import {
  createWebCalendarStyles,
  WebCalendarStyles,
} from "./webCalendarStyles";

/** Props for {@link CalendarMonth}. */
export type CalendarMonthProps = DateBounds & {
  /** Currently selected ISO date, or `""` when unset. */
  value: string;
  /** Today's ISO date, used for the "today" marker. */
  today: string;
  /** Called with the picked ISO date. */
  onSelect: (iso: string) => void;
};

export function CalendarMonth({
  value,
  today,
  min,
  max,
  onSelect,
}: CalendarMonthProps) {
  const theme = useSharedUiTheme();
  const s = useMemo(() => createWebCalendarStyles(theme), [theme]);
  const base = parseIso(value) ??
    parseIso(today) ?? { year: 2026, month: 1, day: 1 };
  const [view, setView] = useState({ year: base.year, month: base.month });
  // Whether the header is showing the year picker, and the start of the visible
  // year block (its own state so paging through blocks survives re-renders).
  const [pickingYear, setPickingYear] = useState(false);
  const [yearStart, setYearStart] = useState(() => yearBlockStart(base.year));
  // The persistent title button; focus returns here when a year is chosen so
  // unmounting the focused year cell never strands keyboard/AT users on <body>.
  const titleRef = useRef<View>(null);
  // Follow the value's month when it changes (e.g. the user types a valid date),
  // while leaving manual month navigation alone. A committed date also leaves the
  // year picker and realigns its block, so the header never shows a stale block.
  useEffect(() => {
    const parts = parseIso(value);
    if (parts) {
      setView({ year: parts.year, month: parts.month });
      setYearStart(yearBlockStart(parts.year));
      setPickingYear(false);
    }
  }, [value]);
  const weeks = buildMonthGrid(view.year, view.month);

  function step(delta: number) {
    setView((current) => shiftMonth(current.year, current.month, delta));
  }

  function openYearPicker() {
    setYearStart(yearBlockStart(view.year));
    setPickingYear(true);
  }

  function pageYears(delta: number) {
    setYearStart((start) => start + delta * YEARS_PER_PAGE);
  }

  function chooseYear(year: number) {
    setView((current) => ({ ...current, year }));
    setPickingYear(false);
    // The chosen year cell unmounts with the picker; move focus to the always-
    // mounted title button first so web keyboard focus is not lost to <body>.
    if (Platform.OS === "web") {
      (titleRef.current as unknown as { focus?: () => void } | null)?.focus?.();
    }
  }

  function outOfBounds(iso: string): boolean {
    return Boolean((min && iso < min) || (max && iso > max));
  }

  return (
    <>
      <View style={s.head}>
        <Pressable
          accessibilityLabel={pickingYear ? "Previous years" : "Previous month"}
          accessibilityRole="button"
          onPress={() => (pickingYear ? pageYears(-1) : step(-1))}
          style={s.nav}
        >
          <ChevronLeft color={theme.colors.primaryDeep} size={16} />
        </Pressable>
        <Pressable
          accessibilityLabel={
            pickingYear
              ? `${yearRangeLabel(yearStart)}, back to month`
              : `${monthLabel(view.year, view.month)}, change year`
          }
          accessibilityRole="button"
          onPress={() =>
            pickingYear ? setPickingYear(false) : openYearPicker()
          }
          ref={titleRef}
          style={({ hovered }: PressableHoverState) => [
            s.titleButton,
            hovered ? s.titleButtonHover : null,
          ]}
        >
          <Text style={s.title}>
            {pickingYear
              ? yearRangeLabel(yearStart)
              : monthLabel(view.year, view.month)}
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel={pickingYear ? "Next years" : "Next month"}
          accessibilityRole="button"
          onPress={() => (pickingYear ? pageYears(1) : step(1))}
          style={s.nav}
        >
          <ChevronRight color={theme.colors.primaryDeep} size={16} />
        </Pressable>
      </View>

      {pickingYear ? (
        <YearGrid
          max={max}
          min={min}
          onSelect={chooseYear}
          selectedYear={view.year}
          start={yearStart}
          styles={s}
        />
      ) : (
        <>
          <View style={s.dowRow}>
            {WEEKDAYS.map((day) => (
              <Text key={day} style={s.dow}>
                {day}
              </Text>
            ))}
          </View>

          {weeks.map((week) => (
            <View key={week[0].iso} style={s.week}>
              {week.map((cell) => (
                <DayButton
                  cell={cell}
                  disabled={!cell.inMonth || outOfBounds(cell.iso)}
                  isToday={cell.iso === today}
                  key={cell.iso}
                  onSelect={onSelect}
                  selected={cell.iso === value}
                  styles={s}
                />
              ))}
            </View>
          ))}
        </>
      )}
    </>
  );
}

/**
 * True when every day of `year` falls outside the [min, max] window, so the year
 * is non-selectable. Uses the same raw ISO string compare as the day grid's
 * `outOfBounds`, so the year picker and the day grid agree on the bounds.
 */
function yearOutOfBounds(
  year: number,
  min?: string | null,
  max?: string | null,
): boolean {
  return Boolean(
    (min && toIso({ year, month: 12, day: 31 }) < min) ||
    (max && toIso({ year, month: 1, day: 1 }) > max),
  );
}

/** The year picker shown in place of the day grid; rows of three year buttons. */
function YearGrid({
  start,
  selectedYear,
  min,
  max,
  onSelect,
  styles,
}: DateBounds & {
  start: number;
  selectedYear: number;
  onSelect: (year: number) => void;
  styles: WebCalendarStyles;
}) {
  const years = yearRange(start);
  const rows = [0, 3, 6, 9].map((offset) => years.slice(offset, offset + 3));
  return (
    <View style={styles.yearGrid}>
      {rows.map((row) => (
        <View key={row[0]} style={styles.yearRow}>
          {row.map((year) => (
            <YearButton
              disabled={yearOutOfBounds(year, min, max)}
              key={year}
              onSelect={onSelect}
              selected={year === selectedYear}
              styles={styles}
              year={year}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function YearButton({
  year,
  disabled,
  onSelect,
  selected,
  styles,
}: {
  year: number;
  disabled: boolean;
  onSelect: (year: number) => void;
  selected: boolean;
  styles: WebCalendarStyles;
}) {
  return (
    <Pressable
      accessibilityLabel={String(year)}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={() => onSelect(year)}
      style={({ hovered }: PressableHoverState) => [
        styles.yearCell,
        hovered && !disabled && !selected ? styles.yearCellHover : null,
        selected ? styles.yearCellSelected : null,
      ]}
    >
      <Text
        style={[
          styles.yearText,
          disabled ? styles.cellMuted : null,
          selected ? styles.yearTextSelected : null,
        ]}
      >
        {year}
      </Text>
    </Pressable>
  );
}

function DayButton({
  cell,
  disabled,
  isToday,
  onSelect,
  selected,
  styles,
}: {
  cell: DayCell;
  disabled: boolean;
  isToday: boolean;
  onSelect: (iso: string) => void;
  selected: boolean;
  styles: WebCalendarStyles;
}) {
  return (
    <Pressable
      accessibilityLabel={formatDisplay(cell.iso)}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={() => onSelect(cell.iso)}
      style={({ hovered }: PressableHoverState) => [
        styles.cell,
        hovered && !disabled && !selected ? styles.cellHover : null,
        selected ? styles.cellSelected : null,
        isToday && !selected && !disabled ? styles.cellToday : null,
      ]}
    >
      {/* Mute every disabled cell (adjacent-month *and* out-of-bounds days) so a
          dead click never looks selectable. */}
      <Text
        style={[
          styles.cellText,
          disabled ? styles.cellMuted : null,
          selected ? styles.cellTextSelected : null,
        ]}
      >
        {cell.day}
      </Text>
    </Pressable>
  );
}
