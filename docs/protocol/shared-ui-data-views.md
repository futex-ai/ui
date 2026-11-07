# Shared UI Data Views Protocol

The requirements of the shared calendars, heatmaps, lists, tables, kanban
boards, and workflow builders. The
[shared UI component protocol](shared-ui-components.md) holds the package
boundary and links every other page.

## Calendar Contract

The calendar family covers a full event calendar (Google-Calendar-style) built
on the shared datetime helpers, distinct from the date-field pickers.

Required behavior:

- Render month, week, day, and agenda views from a single controlled event list,
  using timezone-naive ISO datetimes (`YYYY-MM-DDTHH:mm`) for timed events and
  ISO dates (`YYYY-MM-DD`) for all-day events.
- Let consumers either enforce one fixed view (no in-app switcher) or expose a
  switcher across an allowed subset of views, with controlled or uncontrolled
  view and focused-date state plus prev/next/today navigation.
- Expand recurring events through a pragmatic RRULE subset — daily, weekly (with
  by-weekday), monthly, and yearly frequencies, with interval, count, until, and
  per-date exceptions — into concrete occurrences intersecting the view window,
  preserving each instance's duration, behind a hard iteration cap.
- Lay timed events that overlap into side-by-side columns within a day, and lay
  multi-day and all-day events as spanning bars with lane overflow (`+N more`)
  in the month grid.
- Support web drag-to-create: dragging (or clicking) an empty region of the time
  grid yields a snapped start/end draft surfaced through a create callback, and
  dragging across month-grid day cells yields a multi-day all-day draft, each
  with a native-safe no-op fallback for Expo platform resolution.
- Keep view-switch segments, navigation, day cells, event blocks, and event
  chips labelled for assistive technology, and inject "today"/"now" rather than
  reading a clock inside the pure helpers.
- Keep the pure datetime, recurrence, and layout helpers exported and covered by
  unit tests.

## Heatmap Contract

The heatmap family covers the calendar contribution grid: a date range laid out
as columns of weeks with per-day intensity coloring, month labels along the top,
and an optional weekday gutter and intensity legend.

Required behavior:

- Take an inclusive ISO `YYYY-MM-DD` start/end range plus a sparse list of
  per-date values, and lay it out as column-major weeks (one column per week,
  one row per weekday) padded so the grid stays rectangular.
- Resolve the layout from pure, timezone-safe, unit-tested helpers that never
  read the current date, returning an empty grid for an invalid or reversed
  range.
- Place a short month label above the column where each month's in-range days
  begin, detecting the transition from in-range days so a leading partial week
  is not mislabeled with the previous month.
- Map each day's value to an ordered intensity ramp through ascending
  lower-bound thresholds, deriving even bands from the data's max value by
  default and honoring explicit thresholds for an absolute scale, with a
  distinct empty color for days with no value.
- Drive the cell size, gap, and corner radius, the color ramp and empty color,
  the week start, and the month / weekday / legend chrome from props with
  sensible defaults.
- Use shared theme tokens for the default ramp, the empty cell, and the label
  colors instead of consumer-local theme imports.
- Label each in-range cell for assistive technology, hide padding cells from it,
  and make cells focusable, pressable buttons when a press handler is supplied.

## List Contract

The List family covers vertical, optionally interactive rows with separators
and a standard leading/title/description/trailing layout.

Required behavior:

- `List.onItemPress` makes the complete row one button and paints an inset,
  full-row focus ring. This is the normal interaction for rows with decorative
  trailing content such as a chevron.
- `ListItem.onPress` makes only the title/description column a button. Use this
  model when a trailing control, such as a switch, must remain an independent
  sibling target; do not nest it inside a full-row `List.onItemPress` target.
- A row with a destination is a link, as the
  [navigation row rules](app-shell-parts.md#navigation-rows) say. Rows that use
  `List.onItemPress` or `ListItem.onPress` stay buttons.
- On web, visual focus rings are `domBackendCss` `:focus-visible` rules.
  Pointer focus remains real for behavior while the browser owns modality;
  keyboard input reveals the ring on the row that already holds focus. Native
  keeps its platform focus behavior.
- `focusIndicator` is an explicit customization and must not be required to
  suppress rings after ordinary pointer interaction. `outline` restores the
  browser's default keyboard-focus outline; `none` removes it for a list whose
  container shows focus itself.

## Table Contract

The table family covers the lightweight data table the accounting mockups model
as `.table`: a header row over flex rows that share their column definitions
(React Native has no native `<table>`).

Required behavior:

- Render rows from a column definition and a per-cell render callback, so a cell
  can hold plain text, tags, buttons, or any node, with a text helper for the
  default cell typography (including bold, muted, and tabular-numeric variants).
- Size each column by a fixed width or a flex share, and align its header and
  cells left, center, or right.
- Allow a per-row container style override, merged over the base row style and
  under the interactive states, so grouped tables can shade section-header and
  subtotal bands (e.g. a balance sheet).
- Make the header row optional for continuation tables and headerless layouts.
- Make rows optionally pressable: a pressable row exposes `button` accessibility
  semantics with a disabled state, owns the shared hover, focus ring, and pressed
  treatment, hides the browser's default outline, and is keyboard operable; a
  table without a row press handler renders plain static rows.
- Use shared theme tokens for the header fill, row separators, cell and header
  text, the hover and pressed fills, disabled opacity, and the focus ring, and
  size with the shared control-size scale.

## Kanban Contract

The kanban family covers the horizontally-scrolling status board the table
mockups model as `.tb-kanban`: the same records the table shows as rows, grouped
by a single-select field into one fixed-width column per status.

Required behavior:

- Group a flat cards array into columns by a `cardColumnId` accessor (the table
  rows / list items pattern), with a stable card key and a per-card render
  callback, so a card can be the standard card layout or any node; a card whose
  column id matches no column is omitted.
- Render each column as a header — a status chip whose color comes from a
  semantic tone or a literal color override, a card count, and an optional add
  button — above a vertical stack of cards, with an optional placeholder for an
  empty column.
- Allow the consumer to render its own accessory into a column header, between
  the count and the add button, decided per column (a column that renders
  nothing keeps the header markup and geometry it has when the slot is unused).
  The slot is layout-only: it is end-aligned with the add button, never shrinks
  (the title chip truncates first), is clipped to the header's content box so an
  accessory can never change a header's height at any control size, adds no role,
  label, or focus treatment of its own, and takes no part in the board's press
  suppression, drag, or drop geometry. It renders in every state the add button
  does, including the loading state.
- Provide a convenience card layout: a wrapping title, an optional wrapping row
  of chips, and an optional footer built from avatar / metadata / date slots or
  a custom footer node.
- Provide a chip primitive distinct from the badge pill: a small (`radii.sm`)
  rounded tag whose fill resolves from a tone, a literal color, or a fill-less
  plain variant for inline icon + count metadata, with a decorative leading icon
  hidden from assistive technology.
- Make cards optionally pressable: a pressable card exposes `button` semantics
  with a disabled state, owns the shared hover, inset focus ring, and pressed
  treatment, hides the browser's default outline, and is keyboard operable; a
  board without a card press handler renders plain static cards.
- Label the board and each column as accessibility groups, fold the card count
  into the column's group name (hiding the redundant visible count from
  assistive technology), and announce the board busy while showing skeleton
  placeholder cards during loading.
- Make cards draggable between and within columns via `onCardMove`, by pointer
  and by keyboard (Space grabs, arrows move, Space/Enter drops, Escape cancels,
  each step announced). The dragged card is lifted out of its column — a
  translucent clone follows the pointer (the keyboard leaves the card dimmed in
  place) — and a translucent preview of the card marks the target slot. The board
  stays controlled: the drag reports a move (`{ cardKey, fromColumnId, fromIndex,
toColumnId, toIndex }`, `toIndex` in dragged-removed semantics) for the consumer
  to apply; it never mutates the cards. Dragging is a web gesture, so the native
  drag is an inert no-op.
- Keep the web pointer-drag clone under the pointer, also when the board sits
  inside a transformed or scrolling ancestor.
- Scroll the columns horizontally on both web and phone, and size with the
  shared control-size scale.

## Workflow Builder Contract

The workflow-builder family covers the branching step-graph canvas the
workflow-builder and table-automation mockups model as `.wf-*`: a trigger-rooted
vertical spine of step cards used to construct automation workflows.

Required behavior:

- Render a typed graph model (`WorkflowGraph`) of steps along a spine, where each
  step is either a node (`trigger`, `code`, `agent`, `branch`, `app`, `outcome`)
  or a fork that splits into parallel branches, each branch carrying its own
  condition label and sub-spine, which can fork again.
- Link steps with 2px connectors and route transitions through tinted edge-label
  pills whose tone (`success`, `failure`, `condition`, `always`, `neutral`) maps
  onto the theme's accent families — the same philosophy as the badge, with no
  invented green/blue token — so the visible text carries the meaning and color
  only reinforces it.
- Render a fork as a connector rail: a horizontal line spanning the branch
  centers with a vertical drop into each branch column, so the spine visibly
  splits into each branch rather than stacking disconnected columns.
- Optionally render each transition as a round `+` insert button in place of the
  edge labels (insert mode), reporting the branch and index where a new step is
  inserted, with a trailing button that appends after the last step.
- Color-code the six node kinds with a white-glyph icon chip from a fixed,
  overridable decorative category palette (like avatar colors), and surface a
  per-node run-status dot (`ok`, `running`, `waiting`, `error`, `skipped`) with a
  spoken text alternative; the `running` dot pulses unless reduced motion. The
  dot is the shared status dot family rendered with this module's vocabulary,
  which supplies the color, the label, and the rule that only `running` pulses —
  the graph keeps its own palette (notably the faint `skipped` fill) rather than
  mapping onto the four semantic tones.
- Make nodes optionally pressable: a pressable node exposes `button`
  accessibility semantics with the selected state, owns the shared hover, focus
  ring, and pressed treatment, hides the browser's default outline, and is
  keyboard operable; a static node lets its text and status dot announce
  naturally. Offer an optional trailing add-step button and an edge-tone legend.
- Keep decorative rules (connectors) and the dotted graph-paper canvas out of the
  accessibility tree on both platforms, and paint the dotted background as a
  web-only enhancement (React Native has no CSS background-image).
- Use shared theme tokens for the card surface, border, connectors, edge fills
  and text, status colors, and the selected / focus rings, and size with the
  shared control-size scale.
