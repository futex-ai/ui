/**
 * The day view: a thin wrapper over {@link TimeGrid} with a single date column.
 * Self-contained — it expands the events over `date`..`date` so it can be used
 * standalone without `CalendarView`.
 */
import { useMemo } from "react";
import { StyleProp, ViewStyle } from "react-native";

import { getOccurrences } from "./recurrence";
import { TimeGrid } from "./TimeGrid";
import type {
  CalendarDraftRange,
  CalendarEvent,
  CalendarOccurrence,
  CalendarTimeGridConfig,
} from "./types";

/** Props for {@link DayView}. */
export type DayViewProps = CalendarTimeGridConfig & {
  /** The ISO date to render. */
  date: string;
  /** Source events, expanded over the day. */
  events: CalendarEvent[];
  /** Today's ISO date, for the column highlight + now-line. */
  today: string;
  /** Current datetime (`YYYY-MM-DDTHH:mm`) for the now-line. */
  now?: string;
  /** Called with the occurrence when an event is pressed. */
  onSelectEvent?: (occurrence: CalendarOccurrence) => void;
  /** Called with a draft range from a click/drag on the grid. */
  onCreateEvent?: (range: CalendarDraftRange) => void;
  /** Extra style for the grid container. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

/** Day view rendered as a single-column {@link TimeGrid}. */
export function DayView({
  date,
  events,
  today,
  now,
  onSelectEvent,
  onCreateEvent,
  minHour,
  maxHour,
  slotMinutes,
  pxPerHour,
  style,
  testID,
}: DayViewProps) {
  const dates = useMemo(() => [date], [date]);
  const occurrences = useMemo(
    () => getOccurrences(events, date, date),
    [events, date],
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
      testID={testID}
      today={today}
    />
  );
}
