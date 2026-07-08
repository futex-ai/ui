/**
 * The top-level calendar orchestrator: a toolbar over the active view. Both the
 * view and the anchor date are controlled-or-uncontrolled via a tiny local
 * `useControllable` helper (no extra dependency). Defaults for `today`/`now` are
 * derived once from a current-instant `Date` inside `useMemo`, exactly like
 * `src/date/DateField.tsx` — the pure modules never read the clock, so the
 * orchestrator injects it. The renderer is picked by `view`; each view expands
 * its own occurrences over its window.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

import { todayIso } from "../date/dateMath";
import { useSharedUiTheme } from "../theme";

import { AgendaView } from "./AgendaView";
import { CalendarToolbar } from "./CalendarToolbar";
import { createCalendarStyles } from "./calendarStyles";
import { stepDate } from "./calendarMath";
import { DayView } from "./DayView";
import { MonthView } from "./MonthView";
import type {
  CalendarDraftRange,
  CalendarEvent,
  CalendarOccurrence,
  CalendarTimeGridConfig,
  CalendarViewType,
} from "./types";
import { WeekView } from "./WeekView";

/** Props for {@link CalendarView}. */
export type CalendarViewProps = CalendarTimeGridConfig & {
  /** The consumer-owned events to render. */
  events: CalendarEvent[];
  /** Controlled active view. */
  view?: CalendarViewType;
  /** Initial view when uncontrolled (default `"month"`). */
  defaultView?: CalendarViewType;
  /** Notified when the active view changes. */
  onViewChange?: (view: CalendarViewType) => void;
  /** Switcher options (default all four). One entry hides the switcher. */
  views?: CalendarViewType[];
  /** Controlled anchor ISO date. */
  date?: string;
  /** Initial anchor ISO date when uncontrolled (default = `today`). */
  defaultDate?: string;
  /** Notified when the anchor date changes. */
  onDateChange?: (date: string) => void;
  /** Today's ISO date (default `todayIso(new Date())`). */
  today?: string;
  /** Current datetime for the now-line (default `${today}T${HH:mm}`). */
  now?: string;
  /** Called with the occurrence when an event is selected. */
  onSelectEvent?: (occurrence: CalendarOccurrence) => void;
  /** Called with a draft range from a click/drag (time grid) or cell press (month). */
  onCreateEvent?: (range: CalendarDraftRange) => void;
  /** First day of the week, 0=Sun..6=Sat (default 0). */
  weekStartsOn?: number;
  /** Agenda window length in days (default 30). */
  agendaDays?: number;
  /** Hide the toolbar entirely. */
  hideToolbar?: boolean;
  /** Extra style for the calendar container. */
  style?: StyleProp<ViewStyle>;
};

const ALL_VIEWS: CalendarViewType[] = ["month", "week", "day", "agenda"];

/**
 * A controlled-or-uncontrolled state slot. When `controlled` is provided the
 * hook is fully controlled (it never holds its own state); otherwise it manages
 * `defaultValue` internally. The setter always fires `onChange`. Mirrors the
 * common `useControllableState` shape without pulling in a dependency.
 */
function useControllable<T>(
  controlled: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
): [T, (value: T) => void] {
  const [internal, setInternal] = useState(defaultValue);
  // Latest `onChange` without re-creating the setter each render.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const isControlled = controlled !== undefined;
  const value = isControlled ? controlled : internal;
  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) {
        setInternal(next);
      }
      onChangeRef.current?.(next);
    },
    [isControlled],
  );
  return [value, setValue];
}

/** Current minutes-of-day as a zero-padded `HH:mm`, from a JS `Date`. */
function clockOf(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/** The top-level calendar with a toolbar and the active view. */
export function CalendarView({
  events,
  view: controlledView,
  defaultView = "month",
  onViewChange,
  views = ALL_VIEWS,
  date: controlledDate,
  defaultDate,
  onDateChange,
  today: todayProp,
  now: nowProp,
  onSelectEvent,
  onCreateEvent,
  weekStartsOn = 0,
  agendaDays = 30,
  minHour,
  maxHour,
  slotMinutes,
  pxPerHour,
  hideToolbar = false,
  style,
}: CalendarViewProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createCalendarStyles(theme), [theme]);

  // Derive today/now once from a current-instant Date (like DateField), so the
  // pure layers stay clock-free and tests can inject deterministic values.
  const today = useMemo(() => todayProp ?? todayIso(new Date()), [todayProp]);
  const now = useMemo(
    () => nowProp ?? `${today}T${clockOf(new Date())}`,
    [nowProp, today],
  );

  // A single-entry `views` list enforces that view regardless of any controlled
  // prop, so the enforced story can never switch away.
  const enforced = views.length === 1 ? views[0] : undefined;
  const [view, setView] = useControllable(
    enforced ?? controlledView,
    enforced ?? defaultView,
    onViewChange,
  );
  const [date, setDate] = useControllable(
    controlledDate,
    defaultDate ?? today,
    onDateChange,
  );

  const handleStep = useCallback(
    (dir: -1 | 1) => {
      setDate(stepDate(view, date, weekStartsOn, agendaDays, dir));
    },
    [setDate, view, date, weekStartsOn, agendaDays],
  );
  const handleToday = useCallback(() => setDate(today), [setDate, today]);

  const timeGridConfig: CalendarTimeGridConfig = {
    maxHour,
    minHour,
    pxPerHour,
    slotMinutes,
  };

  return (
    <View style={[styles.root, style]}>
      {hideToolbar ? null : (
        <CalendarToolbar
          agendaDays={agendaDays}
          date={date}
          onStep={handleStep}
          onToday={handleToday}
          onViewChange={setView}
          view={view}
          views={views}
          weekStartsOn={weekStartsOn}
        />
      )}
      {view === "month" ? (
        <MonthView
          date={date}
          events={events}
          onCreateEvent={onCreateEvent}
          onSelectEvent={onSelectEvent}
          today={today}
          weekStartsOn={weekStartsOn}
        />
      ) : null}
      {view === "week" ? (
        <WeekView
          date={date}
          events={events}
          now={now}
          onCreateEvent={onCreateEvent}
          onSelectEvent={onSelectEvent}
          today={today}
          weekStartsOn={weekStartsOn}
          {...timeGridConfig}
        />
      ) : null}
      {view === "day" ? (
        <DayView
          date={date}
          events={events}
          now={now}
          onCreateEvent={onCreateEvent}
          onSelectEvent={onSelectEvent}
          today={today}
          {...timeGridConfig}
        />
      ) : null}
      {view === "agenda" ? (
        <AgendaView
          agendaDays={agendaDays}
          date={date}
          events={events}
          onSelectEvent={onSelectEvent}
          today={today}
        />
      ) : null}
    </View>
  );
}
