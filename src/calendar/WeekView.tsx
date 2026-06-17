/**
 * The week view: a thin wrapper over {@link TimeGrid} that resolves the seven
 * dates of `date`'s week (honouring `weekStartsOn`) and expands the events over
 * that window. Self-contained and independently usable — it owns its own
 * occurrence expansion so it can be dropped in without `CalendarView`.
 */
import { useMemo } from "react";
import { StyleProp, ViewStyle } from "react-native";

import { weekDates } from "./calendarMath";
import { getOccurrences } from "./recurrence";
import { TimeGrid } from "./TimeGrid";
import type {
  CalendarDraftRange,
  CalendarEvent,
  CalendarOccurrence,
  CalendarTimeGridConfig,
} from "./types";

/** Props for {@link WeekView}. */
export type WeekViewProps = CalendarTimeGridConfig & {
  /** The anchor ISO date; the rendered week is the one containing it. */
  date: string;
  /** Source events, expanded over the visible week. */
  events: CalendarEvent[];
  /** Today's ISO date, for the column highlight + now-line. */
  today: string;
  /** Current datetime (`YYYY-MM-DDTHH:mm`) for the now-line. */
  now?: string;
  /** First day of the week, 0=Sun..6=Sat (default 0). */
  weekStartsOn?: number;
  /** Called with the occurrence when an event is pressed. */
  onSelectEvent?: (occurrence: CalendarOccurrence) => void;
  /** Called with a draft range from a click/drag on the grid. */
  onCreateEvent?: (range: CalendarDraftRange) => void;
  /** Extra style for the grid container. */
  style?: StyleProp<ViewStyle>;
};

/** Week view rendered as a 7-column {@link TimeGrid}. */
export function WeekView({
  date,
  events,
  today,
  now,
  weekStartsOn = 0,
  onSelectEvent,
  onCreateEvent,
  minHour,
  maxHour,
  slotMinutes,
  pxPerHour,
  style,
}: WeekViewProps) {
  const dates = useMemo(
    () => weekDates(date, weekStartsOn),
    [date, weekStartsOn],
  );
  const occurrences = useMemo(
    () => getOccurrences(events, dates[0], dates[dates.length - 1]),
    [events, dates],
  );
  return (
    <TimeGrid
      dates={dates}
      maxHour={maxHour}
      minHour={minHour}
      now={now}
      occurrences={occurrences}
      onCreateEvent={onCreateEvent}
      onSelectEvent={onSelectEvent}
      pxPerHour={pxPerHour}
      slotMinutes={slotMinutes}
      style={style}
      today={today}
    />
  );
}
