/**
 * The month view: a weeks×7 grid of day cells with horizontal spanning event
 * bars. The grid dates come from {@link monthGridDates}; each week row's bars are
 * placed by {@link layoutMonthWeek} (all-day + multi-day take the top lanes) and
 * overflow beyond `maxLanes` collapses into a per-column `+N more`. Day cells are
 * non-accessible press targets (empty-space press creates an all-day draft) so
 * the inner event chips stay independently focusable — the RNW nested-Pressable
 * gotcha from `DateTrigger.tsx`. Self-contained: it expands its own occurrences.
 */
import { useMemo } from "react";
import { Pressable, StyleProp, Text, View, ViewStyle } from "react-native";

import { hideWebOutlineView, PressableHoverState } from "../focusRing";
import { parseIso } from "../date/dateMath";
import { useSharedUiTheme } from "../theme";

import { CalendarEventChip } from "./CalendarEventChip";
import { createCalendarStyles, type CalendarStyles } from "./calendarStyles";
import { monthGridDates, weekdayLabels } from "./calendarMath";
import { layoutMonthWeek, type MonthBar } from "./eventLayout";
import { getOccurrences } from "./recurrence";
import type {
  CalendarDraftRange,
  CalendarEvent,
  CalendarOccurrence,
} from "./types";

/** Vertical room reserved above the bar lanes for the day-number header. */
const HEADER_HEIGHT = 22;
/** Height of one spanning bar lane (bar + gap). */
const LANE_HEIGHT = 18;

/** Props for {@link MonthView}. */
export type MonthViewProps = {
  /** The anchor ISO date; the rendered month is the one containing it. */
  date: string;
  /** Source events, expanded over the visible weeks. */
  events: CalendarEvent[];
  /** Today's ISO date, for the today marker. */
  today: string;
  /** First day of the week, 0=Sun..6=Sat (default 0). */
  weekStartsOn?: number;
  /** Max spanning-bar lanes per cell before collapsing into `+N more` (default 3). */
  maxLanes?: number;
  /** Called with the occurrence when an event chip is pressed. */
  onSelectEvent?: (occurrence: CalendarOccurrence) => void;
  /** Called with an all-day draft when empty cell space is pressed. */
  onCreateEvent?: (range: CalendarDraftRange) => void;
  /** Extra style for the grid container. */
  style?: StyleProp<ViewStyle>;
};

/** The month grid view. */
export function MonthView({
  date,
  events,
  today,
  weekStartsOn = 0,
  maxLanes = 3,
  onSelectEvent,
  onCreateEvent,
  style,
}: MonthViewProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createCalendarStyles(theme), [theme]);

  const parts = parseIso(date);
  const weeks = useMemo(() => {
    if (!parts) {
      return [];
    }
    return monthGridDates(parts.year, parts.month, weekStartsOn);
  }, [parts?.year, parts?.month, weekStartsOn]);
  const labels = useMemo(() => weekdayLabels(weekStartsOn), [weekStartsOn]);
  const month = parts?.month ?? 0;

  const occurrences = useMemo(() => {
    if (weeks.length === 0) {
      return [];
    }
    const firstRow = weeks[0];
    const lastRow = weeks[weeks.length - 1];
    return getOccurrences(events, firstRow[0], lastRow[lastRow.length - 1]);
  }, [events, weeks]);

  return (
    <View style={[styles.monthGrid, style]}>
      <View style={styles.monthWeekdayRow}>
        {labels.map((label) => (
          <View key={label} style={styles.monthWeekdayCell}>
            <Text style={styles.monthWeekdayText}>{label}</Text>
          </View>
        ))}
      </View>
      {weeks.map((week) => (
        <MonthWeekRow
          key={week[0]}
          maxLanes={maxLanes}
          month={month}
          occurrences={occurrences}
          onCreateEvent={onCreateEvent}
          onSelectEvent={onSelectEvent}
          styles={styles}
          today={today}
          week={week}
        />
      ))}
    </View>
  );
}

/** One week row: seven day cells under an absolute spanning-bar overlay. */
function MonthWeekRow({
  week,
  occurrences,
  month,
  today,
  maxLanes,
  onSelectEvent,
  onCreateEvent,
  styles,
}: {
  week: string[];
  occurrences: CalendarOccurrence[];
  month: number;
  today: string;
  maxLanes: number;
  onSelectEvent?: (occurrence: CalendarOccurrence) => void;
  onCreateEvent?: (range: CalendarDraftRange) => void;
  styles: CalendarStyles;
}) {
  const layout = useMemo(
    () => layoutMonthWeek(week, occurrences, maxLanes),
    [week, occurrences, maxLanes],
  );
  const colWidth = 100 / week.length;

  return (
    <View style={styles.monthWeekRow}>
      {week.map((cellDate, index) => {
        const cellParts = parseIso(cellDate);
        const inMonth = cellParts?.month === month;
        const overflow = layout.overflowByCol[index] ?? 0;
        return (
          <MonthDayCell
            date={cellDate}
            dayNumber={cellParts?.day ?? 0}
            inMonth={inMonth}
            isLast={index === week.length - 1}
            isToday={cellDate === today}
            key={cellDate}
            onCreateEvent={onCreateEvent}
            overflow={overflow}
            styles={styles}
          />
        );
      })}
      {/* Bars float above the cells so a single bar spans multiple columns. */}
      <View pointerEvents="box-none" style={monthBarOverlayStyle}>
        {layout.bars.map((bar) => (
          <MonthSpanBar
            bar={bar}
            colWidth={colWidth}
            key={bar.occurrence.key}
            onSelectEvent={onSelectEvent}
          />
        ))}
      </View>
    </View>
  );
}

/** A single day cell: an empty-space press target plus its day number / overflow. */
function MonthDayCell({
  date,
  dayNumber,
  inMonth,
  isLast,
  isToday,
  overflow,
  onCreateEvent,
  styles,
}: {
  date: string;
  dayNumber: number;
  inMonth: boolean;
  isLast: boolean;
  isToday: boolean;
  overflow: number;
  onCreateEvent?: (range: CalendarDraftRange) => void;
  styles: CalendarStyles;
}) {
  // The cell is a non-accessible Pressable so the inner chips/overflow button
  // stay independently focusable (RNW would otherwise merge them into one node).
  return (
    <Pressable
      accessible={false}
      onPress={() => onCreateEvent?.({ start: date, end: date, allDay: true })}
      style={({ hovered }: PressableHoverState) => [
        styles.monthDayCell,
        !inMonth ? styles.monthDayCellOutside : null,
        isLast ? styles.monthDayCellLast : null,
        hovered ? styles.monthDayCellHover : null,
        hideWebOutlineView,
      ]}
      testID={`calendar-month-cell-${date}`}
    >
      <View style={styles.monthDayHeader}>
        <View style={isToday ? styles.monthTodayMarker : null}>
          <Text
            style={[
              styles.monthDayNumber,
              !inMonth ? styles.monthDayNumberOutside : null,
              isToday ? styles.monthTodayNumber : null,
            ]}
          >
            {dayNumber}
          </Text>
        </View>
      </View>
      {/* Spanning bars float in the row overlay above; the cell only owns its
          day number and the bottom-pinned overflow indicator. */}
      {overflow > 0 ? (
        <Text style={[styles.moreText, monthMoreStyle]}>+{overflow} more</Text>
      ) : null}
    </Pressable>
  );
}

/** A spanning bar floating over the week row from `startCol` to `endCol`. */
function MonthSpanBar({
  bar,
  colWidth,
  onSelectEvent,
}: {
  bar: MonthBar;
  colWidth: number;
  onSelectEvent?: (occurrence: CalendarOccurrence) => void;
}) {
  const span = bar.endCol - bar.startCol + 1;
  return (
    <View
      style={{
        left: `${bar.startCol * colWidth}%`,
        position: "absolute",
        top: HEADER_HEIGHT + bar.lane * LANE_HEIGHT,
        width: `${span * colWidth}%`,
      }}
    >
      <CalendarEventChip
        occurrence={bar.occurrence}
        onSelect={onSelectEvent}
        style={monthBarChipStyle}
        variant={
          bar.occurrence.allDay || bar.endCol > bar.startCol ? "bar" : "dot"
        }
      />
    </View>
  );
}

/** The week-row bar overlay fills the row but lets cell presses through. */
const monthBarOverlayStyle = {
  bottom: 0,
  left: 0,
  position: "absolute",
  right: 0,
  top: 0,
} as const;

/** Horizontal inset so spanning bars don't butt against the cell borders. */
const monthBarChipStyle = { marginHorizontal: 2 } as const;

/** Pin the `+N more` indicator to the bottom-left of its cell. */
const monthMoreStyle = { bottom: 2, left: 4, position: "absolute" } as const;
