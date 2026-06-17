/**
 * The shared scrollable time grid that backs the week and day views. Renders an
 * hour-label gutter, one column per date, an all-day row at the top, hour and
 * half-hour rules, the now-line when `today` is one of the columns, and the
 * timed event blocks positioned via {@link layoutDayColumns}. Drag-to-create is
 * wired through {@link useCalendarDragCreate} (a real gesture on web, a no-op on
 * native), and the in-progress draft is drawn as a translucent ghost block.
 */
import { useMemo } from "react";
import { ScrollView, StyleProp, Text, View, ViewStyle } from "react-native";

import { useSharedUiTheme } from "../theme";

import { CalendarEventBlock } from "./CalendarEventBlock";
import { CalendarEventChip } from "./CalendarEventChip";
import { createCalendarStyles, type CalendarStyles } from "./calendarStyles";
import {
  dateOf,
  formatHourLabel,
  hours,
  minutesOfDay,
  minutesToY,
} from "./calendarMath";
import { layoutDayColumns } from "./eventLayout";
import { getOccurrences } from "./recurrence";
import type {
  CalendarDraftRange,
  CalendarEvent,
  CalendarOccurrence,
  CalendarTimeGridConfig,
} from "./types";
import { useCalendarDragCreate } from "./useCalendarDragCreate";

/** Props for {@link TimeGrid}. Pass either `events` (expanded here) or `occurrences`. */
export type TimeGridProps = CalendarTimeGridConfig & {
  /** The day columns to render (1 for day view, 7 for week view), ISO dates. */
  dates: string[];
  /** Source events, expanded over the `dates` window when `occurrences` is absent. */
  events?: CalendarEvent[];
  /** Pre-expanded occurrences (overrides `events`). */
  occurrences?: CalendarOccurrence[];
  /** Today's ISO date, for the column highlight + now-line. */
  today: string;
  /** Current datetime (`YYYY-MM-DDTHH:mm`) for the now-line position. */
  now?: string;
  /** Called with the occurrence when a block/all-day chip is pressed. */
  onSelectEvent?: (occurrence: CalendarOccurrence) => void;
  /** Called with a draft range from a click/drag on the grid. */
  onCreateEvent?: (range: CalendarDraftRange) => void;
  /** Extra style for the grid container. */
  style?: StyleProp<ViewStyle>;
};

/**
 * The shared time grid. `dates` is the ordered list of day columns. Blocks are
 * laid out per column with {@link layoutDayColumns}; all-day occurrences become
 * chips in the top row. A column with a left-button pointer drag creates an
 * event via {@link useCalendarDragCreate}.
 */
export function TimeGrid({
  dates,
  events,
  occurrences,
  today,
  now,
  onSelectEvent,
  onCreateEvent,
  minHour = 0,
  maxHour = 24,
  slotMinutes = 30,
  pxPerHour = 48,
  style,
}: TimeGridProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createCalendarStyles(theme), [theme]);

  const hourList = useMemo(() => hours(minHour, maxHour), [minHour, maxHour]);
  const bodyHeight = hourList.length * pxPerHour;

  // Expand to occurrences over the visible window unless the caller passed them.
  const allOccurrences = useMemo(() => {
    if (occurrences) {
      return occurrences;
    }
    return getOccurrences(events ?? [], dates[0], dates[dates.length - 1]);
  }, [occurrences, events, dates]);

  const drag = useCalendarDragCreate({
    minHour,
    maxHour,
    pxPerHour,
    slotMinutes,
    onCreateEvent,
  });

  return (
    <View style={[styles.timeGrid, style]}>
      <AllDayRow
        dates={dates}
        occurrences={allOccurrences}
        onSelectEvent={onSelectEvent}
        styles={styles}
      />
      <ScrollView style={styles.timeGridBody}>
        <View style={[styles.timeGridContent, { height: bodyHeight }]}>
          <View style={styles.timeGutter}>
            {hourList.map((hour, index) => (
              <View
                key={hour}
                style={[styles.timeGutterHour, { height: pxPerHour }]}
              >
                {index === 0 ? null : (
                  <Text style={styles.timeGutterLabel}>
                    {formatHourLabel(hour)}
                  </Text>
                )}
              </View>
            ))}
          </View>
          <View style={styles.timeColumns}>
            {dates.map((date, columnIndex) => (
              <DayColumn
                bind={drag.bindColumn(columnIndex, date)}
                date={date}
                draft={
                  drag.draft && drag.draft.column === columnIndex
                    ? drag.draft
                    : null
                }
                hourList={hourList}
                isLast={columnIndex === dates.length - 1}
                isToday={date === today}
                key={date}
                maxHour={maxHour}
                minHour={minHour}
                now={now}
                occurrences={allOccurrences}
                onSelectEvent={onSelectEvent}
                pxPerHour={pxPerHour}
                styles={styles}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/** The top all-day row: a labelled gutter + one cell per date holding chips. */
function AllDayRow({
  dates,
  occurrences,
  onSelectEvent,
  styles,
}: {
  dates: string[];
  occurrences: CalendarOccurrence[];
  onSelectEvent?: (occurrence: CalendarOccurrence) => void;
  styles: CalendarStyles;
}) {
  return (
    <View style={styles.allDayRow}>
      <View style={styles.allDayGutter}>
        <Text style={styles.allDayGutterText}>All-day</Text>
      </View>
      <View style={styles.allDayLane}>
        {dates.map((date, index) => {
          const chips = occurrences.filter(
            (occ) =>
              occ.allDay &&
              dateOf(occ.start) <= date &&
              dateOf(occ.end) >= date,
          );
          return (
            <View
              key={date}
              style={[
                styles.allDayCell,
                index === dates.length - 1 ? styles.allDayCellLast : null,
              ]}
            >
              {chips.map((occ) => (
                <CalendarEventChip
                  key={occ.key}
                  occurrence={occ}
                  onSelect={onSelectEvent}
                  variant="bar"
                />
              ))}
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** One day column: hour rules, positioned blocks, now-line, and the drag ghost. */
function DayColumn({
  bind,
  date,
  draft,
  hourList,
  isLast,
  isToday,
  maxHour,
  minHour,
  now,
  occurrences,
  onSelectEvent,
  pxPerHour,
  styles,
}: {
  bind: {
    ref: (node: unknown) => void;
    onPointerDown?: (event: unknown) => void;
  };
  date: string;
  draft: { topMinutes: number; bottomMinutes: number } | null;
  hourList: number[];
  isLast: boolean;
  isToday: boolean;
  maxHour: number;
  minHour: number;
  now?: string;
  occurrences: CalendarOccurrence[];
  onSelectEvent?: (occurrence: CalendarOccurrence) => void;
  pxPerHour: number;
  styles: CalendarStyles;
}) {
  const laidOut = useMemo(
    () => layoutDayColumns(occurrences, date),
    [occurrences, date],
  );
  // Now-line only on today's column, only when `now` falls on this date, and only
  // when the current time is within the rendered [minHour, maxHour] window (a
  // constrained grid must not paint the line above or below the visible hours).
  const m = isToday && now && dateOf(now) === date ? minutesOfDay(now) : null;
  const nowMinutes =
    m !== null && m >= minHour * 60 && m <= maxHour * 60 ? m : null;

  return (
    <View
      onPointerDown={bind.onPointerDown}
      ref={bind.ref}
      style={[
        styles.timeColumn,
        isToday ? styles.timeColumnToday : null,
        isLast ? styles.timeColumnLast : null,
      ]}
      testID={`calendar-day-column-${date}`}
    >
      {hourList.map((hour, index) => (
        <View key={hour}>
          {index === 0 ? null : (
            <View style={[styles.hourLine, { top: index * pxPerHour }]} />
          )}
          <View
            style={[styles.halfHourLine, { top: (index + 0.5) * pxPerHour }]}
          />
        </View>
      ))}

      {laidOut.map((item) => {
        const top = minutesToY(item.startMinutes, minHour, pxPerHour);
        const height = Math.max(
          minutesToY(item.endMinutes, minHour, pxPerHour) - top,
          12,
        );
        const width = 100 / item.columns;
        return (
          <CalendarEventBlock
            key={item.occurrence.key}
            occurrence={item.occurrence}
            onSelect={onSelectEvent}
            position={{
              height,
              left: `${item.column * width}%`,
              top,
              width: `${width}%`,
            }}
          />
        );
      })}

      {draft ? (
        <View
          pointerEvents="none"
          style={[
            styles.dragGhost,
            {
              top: minutesToY(draft.topMinutes, minHour, pxPerHour),
              height: Math.max(
                minutesToY(draft.bottomMinutes, minHour, pxPerHour) -
                  minutesToY(draft.topMinutes, minHour, pxPerHour),
                12,
              ),
              left: 0,
              right: 0,
            },
          ]}
          testID="calendar-drag-ghost"
        >
          <Text style={styles.dragGhostText}>New event</Text>
        </View>
      ) : null}

      {nowMinutes !== null ? (
        <View
          pointerEvents="none"
          style={[
            styles.nowLine,
            { top: minutesToY(nowMinutes, minHour, pxPerHour) },
          ]}
          testID="calendar-now-line"
        >
          <View style={styles.nowLineKnob} />
        </View>
      ) : null}
    </View>
  );
}
