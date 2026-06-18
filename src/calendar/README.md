# Calendar (`CalendarView`)

A full event calendar (Google-Calendar-style) for React Native and React Native
Web: **month**, **week**, **day**, and **agenda** views over one controlled event
list, with recurring-event expansion and web drag-to-create. It is distinct from
the [`date`](../date/README.md) family — that family is single-date / range
_pickers_; this family renders and edits a _calendar of events_.

```tsx
import { CalendarView, type CalendarEvent } from "@firna/ui/calendar";

const events: CalendarEvent[] = [
  {
    id: "1",
    title: "Standup",
    start: "2026-06-17T09:30",
    end: "2026-06-17T10:00",
  },
  {
    id: "2",
    title: "Offsite",
    start: "2026-06-18",
    end: "2026-06-19",
    allDay: true,
  },
];

<CalendarView events={events} onCreateEvent={(draft) => addEvent(draft)} />;
```

## Views

`CalendarView` renders a toolbar (prev / next / **Today** + a title + a view
switcher) above the active view. The four views are also exported standalone for
consumers that want to render one view without the toolbar:

- **`MonthView`** — a weeks×7 grid. Multi-day and all-day events render as
  horizontal **spanning bars** laid into lanes; once a week-row runs out of lanes
  the extra events collapse into a `+N more` affordance per day.
- **`WeekView`** / **`DayView`** — a scrollable **time grid** (`TimeGrid`) with a
  fixed date header (weekday + day number per column, today highlighted), an hour
  gutter, an all-day row, a now-line, and timed events positioned by start /
  duration. Events that overlap are packed **side by side into columns**.
- **`AgendaView`** — a chronological list grouped by day, for a compact,
  list-style read of an upcoming window.

### Enforcing vs. allowing a view change

The `views` prop is the set of views offered in the switcher (default all four).

- **Allow the user to switch** — pass the views you want (or omit `views` for all
  four). Combine with controlled `view` + `onViewChange` to drive it externally.
- **Enforce a single view** — pass a one-element list. The switcher is hidden and
  the view is locked, even against a controlled `view` prop.

```tsx
// Switchable (controlled):
<CalendarView events={events} view={view} onViewChange={setView} />;

// Enforced — week only, no switcher:
<CalendarView events={events} views={["week"]} />;
```

`view` / `defaultView` and `date` / `defaultDate` are each
**controlled-or-uncontrolled** (a controlled value plus an `on*Change` callback,
or an uncontrolled default the component manages). Toolbar prev/next step by the
view's granularity (month / week / day / agenda window); **Today** jumps the
anchor date to `today`.

## Value model

- **Timed event**: `start` / `end` are timezone-naive ISO datetimes
  `"YYYY-MM-DDTHH:mm"` (e.g. `"2026-06-17T09:30"`). Lexicographic string order is
  chronological order — the math relies on this, so there is no `Date`-from-string
  parsing and no timezone drift.
- **All-day event**: `allDay: true` with date-only `start` / `end`
  (`"YYYY-MM-DD"`); the last day is **inclusive**.
- **`color`** sets the block/chip fill (defaults to the theme primary); **`data`**
  is an opaque payload echoed back on every occurrence.

## Recurring events

Attach a `recurrence` rule (a pragmatic RRULE subset) and the views expand it into
concrete `CalendarOccurrence`s that intersect the visible window — each instance
keeps the master event's duration.

```tsx
const standup: CalendarEvent = {
  id: "standup",
  title: "Daily standup",
  start: "2026-06-01T09:30",
  end: "2026-06-01T09:45",
  recurrence: {
    frequency: "weekly",
    interval: 1,
    byWeekday: [1, 2, 3, 4, 5], // Mon–Fri (0=Sun)
    until: "2026-12-31",
    exceptions: ["2026-06-25"], // a one-off cancellation
  },
};
```

Supported: `frequency` (`daily` / `weekly` / `monthly` / `yearly`), `interval`,
weekly `byWeekday`, `count`, `until`, and per-date `exceptions`. `count` counts
**emitted** occurrences (an excepted date is skipped, not consumed). Month/year
frequencies skip impossible dates (e.g. the 31st in short months, Feb 29 in
non-leap years). Expansion is bounded by a hard iteration cap so a misconfigured
rule can never loop forever. Use `getOccurrences(events, rangeStart, rangeEnd)` /
`expandRecurrence(event, rangeStart, rangeEnd)` directly when you need the
expanded list yourself.

## Drag to create

On **web**, dragging (or clicking) an empty region of the time grid produces a
snapped `CalendarDraftRange` and calls `onCreateEvent`; a plain click creates a
single `slotMinutes`-long event at that slot. A live ghost block tracks the drag.
This mirrors the [`drag-select`](../drag-select/README.md) provider: it measures
the column via `getBoundingClientRect`, listens on `document` for
`pointermove` / `pointerup` / `pointercancel`, ignores touch and non-left
buttons, and is guarded for SSR. On **native**, `useCalendarDragCreate` resolves
to a no-op fallback (same signature), so platform resolution keeps the API stable
without a drag gesture. `MonthView` has the matching gesture for the month grid
(`useCalendarMonthDragCreate`): **clicking** a day creates a single-day all-day
draft, while **dragging across day cells** sweeps out a highlighted multi-day
all-day range and creates it on release. The single-day click works on native
too (the cell keeps its own press); only the cross-cell drag is web-only.

The consumer owns persistence — `onCreateEvent` hands you the range; you decide
whether to open an editor, push to state, or POST it.

## Time-grid config

`minHour` (default 0), `maxHour` (default 24), `slotMinutes` (snap granularity,
default 30), and `pxPerHour` (default 48) tune the day/week grid and the drag
snap. `weekStartsOn` (0=Sun..6=Sat, default 0) rotates the week/month grids and
`agendaDays` (default 30) sizes the agenda window.

## Components & API

- `CalendarView` — batteries-included orchestrator (toolbar + active view).
- `CalendarToolbar` — prev/next/today nav, view title, and the `SegmentedControl`
  view switcher (hidden when only one view is offered).
- `MonthView`, `WeekView`, `DayView`, `AgendaView` — the standalone views.
- `TimeGrid` — the shared scrollable time grid (date header, columns, all-day
  row, now-line, positioned blocks, drag-to-create) that `WeekView` / `DayView`
  wrap.
- `CalendarEventBlock` / `CalendarEventChip` — the rendered event block (time
  grid) and chip (month / agenda), both labelled buttons.
- `useCalendarDragCreate` — the web/native time-grid drag-to-create hook.
- `useCalendarMonthDragCreate` — the web/native month-grid click & drag-to-create
  hook (drag across day cells for a multi-day range).

## File layout

- `types.ts` — `CalendarEvent`, `RecurrenceRule`, `CalendarOccurrence`,
  `CalendarDraftRange`, `CalendarViewType`, `CalendarTimeGridConfig`. No React.
- `calendarMath.ts` — pure, timezone-safe datetime helpers (parse/format/add/diff,
  week & month grids, view ranges/titles/stepping, time-grid geometry & snapping,
  time formatting). Builds on `../date/dateMath`. No React, no clock. Unit-tested.
- `recurrence.ts` — recurrence expansion (`expandRecurrence`, `getOccurrences`).
  Pure, unit-tested.
- `eventLayout.ts` — overlap column packing (`layoutDayColumns`) and month
  spanning-bar lanes (`layoutMonthWeek`). Pure, unit-tested.
- `calendarStyles.ts` — `createCalendarStyles(theme)` factory.
- `CalendarView.tsx` / `CalendarToolbar.tsx` — orchestrator + toolbar.
- `MonthView.tsx` / `TimeGrid.tsx` / `WeekView.tsx` / `DayView.tsx` /
  `AgendaView.tsx` — the views.
- `CalendarEventBlock.tsx` / `CalendarEventChip.tsx` — event presenters.
- `useCalendarDragCreate.web.ts` / `useCalendarDragCreate.ts` — time-grid web
  hook + the native-safe no-op fallback (the bare `./useCalendarDragCreate`
  import resolves `.web` on web bundlers and `.ts` for `tsc` / native).
- `useCalendarMonthDragCreate.web.ts` / `useCalendarMonthDragCreate.ts` — the
  month-grid click & drag-to-create web hook + its native-safe fallback.

## Theming

Styles read colors / fonts / radii from `SharedUiThemeProvider` via
`useSharedUiTheme()` and the `createCalendarStyles(theme)` factory — the same
pattern as the rest of the library. The brand accent is the theme's `primary` /
`primaryDeep` tokens; event color defaults to `primary`.

## Accessibility

- View-switch segments are a `radiogroup` of labelled `radio`s
  (`SegmentedControl`); nav and **Today** are labelled buttons.
- Event blocks and chips are labelled `button`s
  (`"<title>, <time range>"` or `"<title>, all day"`); month day cells are
  labelled buttons whose press creates an all-day draft, with the chips nested as
  independently accessible buttons (the cell row is `accessible={false}` so a
  chip press never doubles as a cell press — see `../date/DateTrigger.tsx`).
- The pure helpers take injected `today` / `now`, so screen-reader and snapshot
  tests stay deterministic.

## Testing

`calendarMath.ts`, `recurrence.ts`, and `eventLayout.ts` are unit-tested with the
repo's Node test runner (datetime math; daily/weekly/monthly/yearly recurrence
with interval / count / until / exceptions and duration preservation; column and
spanning-bar layout). The views, view switching, recurrence expansion, and the
web drag-to-create gesture are exercised by the Storybook Playwright spec
(`tests/browser/storybook.spec.ts`) against the `Calendar/Examples` stories.
