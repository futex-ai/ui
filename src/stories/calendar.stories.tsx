import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { useState } from "react";
import { Text, View } from "react-native";

import {
  AgendaView,
  CalendarView,
  DayView,
  MonthView,
  WeekView,
  formatTimeRange,
  type CalendarDraftRange,
  type CalendarEvent,
  type CalendarViewType,
} from "../index";
import { StorySurface } from "./sharedExamples";

// Everything is pinned to fixed instants so the Playwright runs are fully
// deterministic — the stories never read a live clock. `TODAY` is a Wednesday
// (2026-06-17) and `NOW` is mid-morning, so the now-line lands in the visible
// grid.
const TODAY = "2026-06-17";
const NOW = "2026-06-17T10:30";

// A fixed fixture spanning the week of `TODAY`: timed singles, an overlapping
// pair, an all-day multi-day bar, and a short timed event. Colours come from
// the theme palette so the chips stay on-brand.
const EVENTS: CalendarEvent[] = [
  {
    color: "#4f7864",
    end: "2026-06-17T10:30",
    id: "standup",
    start: "2026-06-17T09:30",
    title: "Standup",
  },
  {
    color: "#315f96",
    end: "2026-06-17T12:30",
    id: "design-review",
    start: "2026-06-17T11:00",
    title: "Design review",
  },
  {
    color: "#946727",
    end: "2026-06-17T12:00",
    id: "interview",
    start: "2026-06-17T11:30",
    title: "Interview",
  },
  {
    color: "#a84f45",
    end: "2026-06-18T15:00",
    id: "client-call",
    start: "2026-06-18T14:00",
    title: "Client call",
  },
  {
    allDay: true,
    color: "#4f7864",
    end: "2026-06-19",
    id: "offsite",
    start: "2026-06-17",
    title: "Team offsite",
  },
  {
    color: "#315f96",
    end: "2026-06-16T16:00",
    id: "1-1",
    start: "2026-06-16T15:30",
    title: "1:1",
  },
  {
    color: "#946727",
    end: "2026-06-20T18:30",
    id: "release",
    start: "2026-06-20T18:00",
    title: "Release",
  },
];

// Two recurring masters for the recurrence story: a daily standup and a
// thrice-weekly sync. Both expand across the whole visible month.
const RECURRING_EVENTS: CalendarEvent[] = [
  {
    color: "#4f7864",
    end: "2026-06-01T09:15",
    id: "daily-standup",
    recurrence: { count: 20, frequency: "daily" },
    start: "2026-06-01T09:00",
    title: "Daily standup",
  },
  {
    color: "#315f96",
    end: "2026-06-02T14:00",
    id: "weekly-sync",
    recurrence: { byWeekday: [2, 4], frequency: "weekly" },
    start: "2026-06-02T13:00",
    title: "Weekly sync",
  },
];

const meta = {
  title: "Calendar/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const MonthCalendar: Story = {
  name: "Month view",
  render: () => (
    <StorySurface>
      <CalendarExampleFrame>
        <MonthView date={TODAY} events={EVENTS} today={TODAY} />
      </CalendarExampleFrame>
    </StorySurface>
  ),
};

export const WeekCalendar: Story = {
  name: "Week view",
  render: () => (
    <StorySurface>
      <CalendarExampleFrame>
        <WeekView date={TODAY} events={EVENTS} now={NOW} today={TODAY} />
      </CalendarExampleFrame>
    </StorySurface>
  ),
};

export const DayCalendar: Story = {
  name: "Day view",
  render: () => (
    <StorySurface>
      <CalendarExampleFrame>
        <DayView date={TODAY} events={EVENTS} now={NOW} today={TODAY} />
      </CalendarExampleFrame>
    </StorySurface>
  ),
};

export const AgendaCalendar: Story = {
  name: "Agenda view",
  render: () => (
    <StorySurface>
      <CalendarExampleFrame>
        <AgendaView
          agendaDays={14}
          date={TODAY}
          events={EVENTS}
          today={TODAY}
        />
      </CalendarExampleFrame>
    </StorySurface>
  ),
};

export const SwitchableCalendar: Story = {
  name: "Switchable views",
  render: () => (
    <StorySurface>
      <SwitchableCalendarExample />
    </StorySurface>
  ),
};

export const EnforcedWeekCalendar: Story = {
  name: "Enforced week view",
  render: () => (
    <StorySurface>
      <CalendarExampleFrame>
        <CalendarView
          date={TODAY}
          events={EVENTS}
          now={NOW}
          today={TODAY}
          views={["week"]}
        />
      </CalendarExampleFrame>
    </StorySurface>
  ),
};

export const RecurringEventsCalendar: Story = {
  name: "Recurring events",
  render: () => (
    <StorySurface>
      <CalendarExampleFrame>
        <CalendarView
          date={TODAY}
          defaultView="month"
          events={RECURRING_EVENTS}
          now={NOW}
          today={TODAY}
          views={["month"]}
        />
      </CalendarExampleFrame>
    </StorySurface>
  ),
};

export const DragToCreateCalendar: Story = {
  name: "Drag to create",
  render: () => (
    <StorySurface>
      <DragToCreateExample />
    </StorySurface>
  ),
};

/**
 * A fixed-size frame so the calendar fills a predictable area in Storybook (and
 * gives the time grid room to scroll). The views flex to fill it.
 */
function CalendarExampleFrame({ children }: { children: ReactNode }) {
  return <View style={{ height: 560, width: 760 }}>{children}</View>;
}

/** The full orchestrator with the view switcher, holding its own view + date. */
function SwitchableCalendarExample() {
  const [view, setView] = useState<CalendarViewType>("month");
  const [date, setDate] = useState(TODAY);
  return (
    <CalendarExampleFrame>
      <CalendarView
        date={date}
        events={EVENTS}
        now={NOW}
        onDateChange={setDate}
        onViewChange={setView}
        today={TODAY}
        view={view}
      />
    </CalendarExampleFrame>
  );
}

/**
 * A day view whose grid creates events on click/drag. The last created range is
 * echoed into a `created-event-log` Text (so a browser test can assert it), and
 * the new event is appended to local state so its block renders in the grid.
 */
function DragToCreateExample() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [lastRange, setLastRange] = useState<CalendarDraftRange | null>(null);

  const handleCreate = (range: CalendarDraftRange) => {
    setLastRange(range);
    setEvents((prev) => [
      ...prev,
      {
        color: "#4f7864",
        end: range.end,
        id: `created-${prev.length + 1}`,
        start: range.start,
        title: "New event",
      },
    ]);
  };

  return (
    <View style={{ gap: 10, height: 600, width: 420 }}>
      <Text testID="created-event-log">
        {lastRange
          ? `Created ${formatTimeRange(lastRange.start, lastRange.end)} (${
              lastRange.start
            } – ${lastRange.end})`
          : "Drag the grid to create an event"}
      </Text>
      <View style={{ flex: 1 }}>
        <DayView
          date={TODAY}
          events={events}
          minHour={7}
          now={NOW}
          onCreateEvent={handleCreate}
          today={TODAY}
        />
      </View>
    </View>
  );
}
