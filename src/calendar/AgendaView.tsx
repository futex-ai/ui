/**
 * The agenda view: a scrollable, day-grouped list of the upcoming `agendaDays`
 * starting at `date`. Each day with events gets a header (weekday + short date)
 * and a row per occurrence (colour dot, time, title); empty days are skipped and
 * a fully empty window shows an empty state. Rows are labelled press targets.
 * Self-contained — it expands its own occurrences over the window.
 */
import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { addDays, parseIso, SHORT_MONTHS } from "../date/dateMath";
import { hideWebOutlineView, PressableHoverState } from "../focusRing";
import { useSharedUiTheme } from "../theme";

import { createCalendarStyles, type CalendarStyles } from "./calendarStyles";
import { dateOf, formatTimeRange, weekdayLabels } from "./calendarMath";
import { getOccurrences } from "./recurrence";
import type { CalendarEvent, CalendarOccurrence } from "./types";

/** Props for {@link AgendaView}. */
export type AgendaViewProps = {
  /** The first ISO date of the agenda window. */
  date: string;
  /** Source events, expanded over the window. */
  events: CalendarEvent[];
  /** Today's ISO date, used to accent today's header. */
  today: string;
  /** Number of days the agenda spans (default 30). */
  agendaDays?: number;
  /** Called with the occurrence when a row is pressed. */
  onSelectEvent?: (occurrence: CalendarOccurrence) => void;
  /** Extra style for the agenda container. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

/** A single day's group of occurrences in the agenda. */
type DayGroup = { date: string; occurrences: CalendarOccurrence[] };

/** The agenda list view. */
export function AgendaView({
  date,
  events,
  today,
  agendaDays = 30,
  onSelectEvent,
  style,
  testID,
}: AgendaViewProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createCalendarStyles(theme), [theme]);

  const end = useMemo(() => addDays(date, agendaDays - 1), [date, agendaDays]);
  const groups = useMemo(
    () => groupByDay(getOccurrences(events, date, end), date, end),
    [events, date, end],
  );

  return (
    <View style={[styles.agenda, style]} testID={testID}>
      <ScrollView
        contentContainerStyle={styles.agendaContent}
        style={styles.agendaScroll}
      >
        {groups.length === 0 ? (
          <View style={styles.agendaEmpty}>
            <Text style={styles.agendaEmptyText}>No events</Text>
          </View>
        ) : (
          groups.map((group, index) => (
            <AgendaDayGroup
              first={index === 0}
              group={group}
              isToday={group.date === today}
              key={group.date}
              onSelectEvent={onSelectEvent}
              styles={styles}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

/** A day header plus its event rows. */
function AgendaDayGroup({
  group,
  first,
  isToday,
  onSelectEvent,
  styles,
}: {
  group: DayGroup;
  first: boolean;
  isToday: boolean;
  onSelectEvent?: (occurrence: CalendarOccurrence) => void;
  styles: CalendarStyles;
}) {
  const parts = parseIso(group.date);
  // Sunday-first weekday labels indexed by the date's own weekday.
  const weekday = parts
    ? weekdayLabels(0)[
        new Date(parts.year, parts.month - 1, parts.day).getDay()
      ]
    : "";
  const label = parts
    ? `${parts.day} ${SHORT_MONTHS[parts.month - 1]}`
    : group.date;
  return (
    <View>
      <View
        style={[
          styles.agendaDayHeader,
          first ? styles.agendaDayHeaderFirst : null,
        ]}
      >
        <Text style={styles.agendaDayWeekday}>{weekday}</Text>
        <Text
          style={[styles.agendaDayDate, isToday ? styles.agendaDayToday : null]}
        >
          {label}
        </Text>
      </View>
      {group.occurrences.map((occ) => (
        <AgendaRow
          key={occ.key}
          occurrence={occ}
          onSelectEvent={onSelectEvent}
          styles={styles}
        />
      ))}
    </View>
  );
}

/** A single occurrence row: colour dot, time, title. */
function AgendaRow({
  occurrence,
  onSelectEvent,
  styles,
}: {
  occurrence: CalendarOccurrence;
  onSelectEvent?: (occurrence: CalendarOccurrence) => void;
  styles: CalendarStyles;
}) {
  const theme = useSharedUiTheme();
  const color = occurrence.event.color ?? theme.colors.primary;
  const time = occurrence.allDay
    ? "All day"
    : formatTimeRange(occurrence.start, occurrence.end);
  return (
    <Pressable
      accessibilityLabel={`${occurrence.event.title}, ${time}`}
      accessibilityRole="button"
      onPress={() => onSelectEvent?.(occurrence)}
      style={({ hovered }: PressableHoverState) => [
        styles.agendaRow,
        hovered ? styles.agendaRowHover : null,
        hideWebOutlineView,
      ]}
      testID={`calendar-event-${occurrence.key}`}
    >
      <View style={[styles.agendaDot, { backgroundColor: color }]} />
      <Text style={styles.agendaTime}>{time}</Text>
      <Text numberOfLines={1} style={styles.agendaTitle}>
        {occurrence.event.title}
      </Text>
    </Pressable>
  );
}

/**
 * Group the (already start-sorted) occurrences by the day they fall on. A
 * multi-day occurrence is listed under each day in the window it covers, so the
 * agenda shows it on every relevant day like Google. Days with no events are
 * omitted entirely.
 */
function groupByDay(
  occurrences: CalendarOccurrence[],
  rangeStart: string,
  rangeEnd: string,
): DayGroup[] {
  const groups: DayGroup[] = [];
  let cursor = rangeStart;
  // Walk every day in the window; bounded by addDays so a bad range can't loop.
  for (let i = 0; i < 366 && cursor <= rangeEnd; i += 1) {
    const onDay = occurrences.filter(
      (occ) => dateOf(occ.start) <= cursor && lastCoveredDate(occ) >= cursor,
    );
    if (onDay.length > 0) {
      groups.push({ date: cursor, occurrences: onDay });
    }
    cursor = addDays(cursor, 1);
  }
  return groups;
}

/** The last calendar day an occurrence covers (all-day ends are inclusive). */
function lastCoveredDate(occurrence: CalendarOccurrence): string {
  const endDate = dateOf(occurrence.end);
  if (occurrence.allDay) {
    return endDate;
  }
  // A timed event ending at exactly midnight doesn't paint the end day.
  return endDate > dateOf(occurrence.start) && occurrence.end.endsWith("T00:00")
    ? addDays(endDate, -1)
    : endDate;
}
