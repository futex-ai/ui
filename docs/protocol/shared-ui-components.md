# Shared UI Component Library Protocol

## Status

Implemented contract for the dropdown, drag-select, segmented control, radio
card, switch, spinner, loader, animated border, button, list, data table,
workflow builder, modal, toast,
avatar, status badge, rich-text editor, and event-calendar extraction,
including the shared control-size scale for buttons, inputs, and textareas.

## Purpose

This repository provides shared React Native and React Native Web UI primitives
for Firna apps. The first consumers are the accounting app and the Juno app.
The first shared component families are the dropdown components, drag-select
provider, segmented control patterns, radio-option cards, switch primitive, data
table, workflow-builder step graph, web modal components, transient notification
toasts, and the circular user avatar currently implemented in the accounting
app, plus labelled text inputs and textareas for shared forms.

## Package Boundary

- The library must not import from consumer-local aliases such as `@/theme`,
  `@/forms/focusRing`, screen modules, route modules, or app-specific state.
- Consumer apps provide data, callbacks, labels, and theme overrides.
- The library owns component presentation, keyboard behavior, focus treatment,
  portal behavior, layering, and pure interaction helpers.
- `react`, `react-native`, `react-native-web`, `react-dom`, and
  `lucide-react-native` are external peer/runtime dependencies, not copied app
  code.

## Rich Text Editor Contract

The rich-text editor's cross-platform markdown, block-editing, mobile toolbar,
and accessibility behavior is specified separately in
[rich-text-editor.md](rich-text-editor.md). Its multi-user presentation layer —
live carets, tracked changes, and comment threads — is specified in
[rich-text-collaboration.md](rich-text-collaboration.md).

## Theming Contract

- The library ships a default theme matching the accounting component colors.
- Consumers can override brand-sensitive tokens through a shared theme provider
  or theme creation helper.
- At minimum, the theme must expose primary color tokens:
  `primary`, `primaryDeep`, `primarySoft`, and `primaryBorder`.
- Shared semantic tokens must also cover surface, text, muted text, borders,
  danger, warning, radii, and fonts so copied components do not depend on a
  consumer theme module.
- The warning and danger accents must ship a deep variant (`amberDeep`,
  `roseDeep`, mirroring `primaryDeep`) so a tinted status fill can carry
  AA-contrast accent text; the lighter `amber` / `rose` accents fall below the
  4.5:1 text minimum on their own soft tints.
- Focus rings use the active theme primary color.
- Consumer theme overrides must be shallow and predictable; unspecified tokens
  fall back to the default shared theme.
- Dark mode ships as presets, not as a mode flag: four presets are shipped (the
  accounting default and Juno, each light and dark). A theme creation helper
  must accept a base theme to extend so a branded override of a dark preset
  stays dark.
- Inverse content — text and icons on a solid accent fill — must resolve through
  a single `onSolid` token rather than a literal white, so it inverts with the
  palette.
- Solid fills invert on the dark presets: the deep accents become light and
  `onSolid` becomes the page ink-well. This keeps every token relationship
  (deep-on-soft, deep-as-fill, ramp ordering) valid in both schemes, so
  components need no scheme-specific code.
- A `scheme` field states which side of the light/dark divide a palette sits on.
  Components must not branch on it except at genuine physical-metaphor sites
  that cannot invert through tokens — today the switch knob, the skeleton sheen,
  the solid toast's hover wash, and the data grid's fixed pill colors.
- Every documented contrast obligation applies to all four presets.
- The library does not detect the OS color scheme; consumers own that wiring so
  the theme module stays free of platform imports.

## Segmented Control Contract

The segmented control family covers compact single-select controls where all
options remain visible. This includes accounting's report-style pill tabs and
the Profit & loss income-source filter pills.

Required behavior:

- Render one selected value from a small option set.
- Expose `radiogroup` and `radio` accessibility roles, with checked and
  disabled state on every segment.
- Support the outline variant used for filter pills and the pill-track variant
  used for tab-like report switches.
- Support equal-width segments and content-sized wrapping filter pills.
- Use shared theme tokens for selected backgrounds, selected text, borders,
  disabled opacity, labels, hint text, and validation text.
- Keep labels, required state, hints, and validation errors available without
  depending on consumer-local form components.

## Switch Contract

The switch family covers compact binary settings where surrounding rows or form
fields own the visible label.

Required behavior:

- Render a 40px by 24px track with an 18px knob that moves between off and on
  positions.
- Expose `switch` accessibility semantics with checked and disabled state.
- Keep the touch target at least 44px on native and web even though the visible
  track is smaller.
- Treat missing `onValueChange` as a read-only disabled control.
- Use shared theme tokens for off track color, on track color, disabled opacity,
  and pill radius.
- Keep a `trackStyle` override available for non-default surfaces without
  requiring consumers to fork the component.

## Spinner Contract

The spinner family covers the indeterminate loading indicator: a ring whose
accent arc rotates continuously while content is loading.

Required behavior:

- Render a circular ring sized by the shared `ControlSize` scale (`sm` / `md` /
  `lg`, with `md` as the default) or by an explicit pixel diameter, deriving the
  ring stroke thickness from the diameter.
- Animate a continuous rotation through React Native's `Animated` API so the
  same component spins on native and web, and stop the loop on unmount.
- Expose `progressbar` accessibility semantics with a busy state and an
  accessible name that defaults to a loading label.
- Use shared theme tokens for the accent arc (`primary`) and the ring track
  (`border2`), and allow per-instance `color` and `trackColor` overrides for
  alternate surfaces without forking the component.
- Keep only the inner ring rotating so the labelled container keeps a stable box
  for layout and assistive technology.
- Honour the user's "reduce motion" preference by slowing the loop right down
  and fading the ring in place instead of rotating it. The indicator must keep
  animating: a frozen spinner reads as a hung screen.

## Loader Contract

The loader family covers the rest of the loading vocabulary: an indeterminate
indicator with a switchable shape, and the two determinate progress meters.

Required behavior:

- Render `Loader` in any of six shapes — `ring`, `dot-grid`, `dots`, `bars`,
  `blades`, `pulse` — defaulting to `ring`.
- Size every shape's box height from the same scale the spinner uses (`sm` /
  `md` / `lg`, `md` default, or an explicit pixel size) so a shape can be
  swapped for another without moving the surrounding layout. `dots` and `bars`
  may be wider than they are tall; the rest are square.
- Delegate `variant="ring"` to the spinner rather than reimplementing the arc,
  so the library holds exactly one ring.
- Give each shape a default cycle length suited to its motion, overridable per
  instance with `duration`.
- Drive every shape from a single `Animated` loop that stops on unmount and
  animates only opacity and transform, so the loader stays on the native driver
  on iOS and Android and renders identically on web. Stagger elements by
  interpolating that one driver at a phase offset rather than by running one
  loop per element.
- Honour "reduce motion" by slowing the loop and animating brightness alone —
  no translation, scale, or rotation — rather than freezing.
- Expose `progressbar` accessibility semantics with a busy state and an
  accessible name that defaults to a loading label. The shape itself is
  decorative and must stay out of the accessibility tree.
- Use shared theme tokens for the animated elements (`primary`) and tracks
  (`border2`), with per-instance `color` and `trackColor` overrides.

`ProgressBar` and `ProgressRing` cover progress whose total is known:

- `ProgressBar` renders a full-width track. A `value` prop, a 0–1 fraction
  clamped to range, makes it determinate; omitting `value` sweeps a segment
  across the track for unknown progress.
- `ProgressRing` renders the determinate circular meter, sharing the spinner's
  geometry so it can replace a spinner of the same size without moving the
  layout. Its arc starts at 12 o'clock and fills clockwise.
- Both publish the percentage through `aria-valuenow` on ARIA's default 0–100
  range, so screen readers announce a percentage rather than a fraction. An
  indeterminate bar publishes a busy state and no value, per ARIA.
- Emit both React Native's `accessibilityValue` and the literal `aria-value*`
  DOM props. react-native-web does not translate the former into the latter, so
  setting only `accessibilityValue` leaves a web screen reader with a
  `progressbar` that carries no value. This applies to any determinate control,
  not only these two.

## Animated Border Contract

The animated border covers the decorative "working" highlight: a comet trail
that traces the perimeter of the element it frames, marking an active tool icon,
avatar, or card while work is running.

Required behavior:

- Trace the real rounded-rectangle path of the framed box, sized by `width` /
  `height` (or a square `size`) and `borderRadius`, so the trail follows the
  same corner radius as the element it frames. `shape="circle"` fully rounds the
  box instead — a true circle when square, an elongated stadium ("pill") when
  not — and ignores `borderRadius`.
- Draw the trail as stacked `react-native-svg` rects with an animated
  `strokeDashoffset`: a short, bright head leading progressively fainter, longer
  tail segments. Real path geometry is required because a CSS gradient border
  cannot bend around a corner and a single rotated dash only reads as motion on
  a circle.
- Run the loop through React Native's `Animated` API and stop it on unmount. The
  loop is JS-driven (`useNativeDriver: false`) because an SVG attribute cannot
  run on the native driver.
- Accept `color` as either a single color or a `[from, to]` pair, defaulting to
  the theme `primary`. A pair strokes the trail with an SVG gradient sweeping
  `from → to → from` across the box, so a border can carry a consumer's brand
  pair and identify which connected app is working, not merely that something
  is. `from` is repeated at both ends so the two sides of the border read the
  same rather than ramping one way across it.
- Treat a pair of identical colors as the single-color case — solid, with no
  gradient defined — so a caller holding one brand color can repeat it instead
  of branching. Gradient ids must be per-instance and free of any characters
  that would break a `url(#…)` reference on web.
- Keep the border out of the accessibility tree on every platform and let
  pointer events pass through to the content it overlays. It is decoration; the
  surrounding control owns the announced state.
- Honour the user's "reduce motion" preference by settling into a static
  outline — stroked with the same color or gradient — instead of looping the
  trail around the perimeter.
- Wrap `children` and overlay the border over them, or render standalone (with
  no children) for the caller to position over an existing box.

## Radio Card Contract

The radio card family covers titled, card-shaped single-select options where the
supporting body copy is part of the option label.

Required behavior:

- Render a title, optional body copy, and a circular checked indicator.
- Expose `radio` accessibility semantics with checked and disabled state.
- Treat missing `onPress` as a read-only disabled option.
- Allow consumers to place related cards under their own labelled `radiogroup`.
- Use shared theme tokens for selected backgrounds, selected borders, dot
  colors, text, disabled opacity, fonts, radii, and focus treatment.

## Button Contract

The button family covers the pressable actions that the accounting mockups model
as `.btn`: primary calls to action, neutral secondary actions, low-emphasis
ghost actions, and destructive danger actions.

Required behavior:

- Render a labelled button with an optional leading icon tinted to match the
  label color.
- Treat caller-supplied icon nodes as decorative content: hide them from the web
  accessibility tree and prevent pointer targeting so focus stays on the outer
  button even when a child SVG is independently focusable.
- Support the primary (filled), secondary (surface + border, the default), ghost
  (no fill or border), and danger (rose border + label) tones.
- Support a full-width block variant for stacked form actions and bottom sheets.
- Expose `button` accessibility semantics with a disabled state, and treat a
  missing press handler as a read-only disabled control.
- Accept a caller-supplied role in place of `button`, limited to the
  single-activation roles a button's press behavior stays correct under:
  `checkbox`, `menuitem`, `radio`, `switch`, and `tab`. `link` is excluded — a
  re-roled button has no `href`, so a real link must be an anchor.
- Accept the state that role carries — `checked` for a checkbox / radio /
  switch, `selected` for a tab, `pressed` for a toggle button, and `expanded`
  for a control that reveals a menu, panel, or section — and emit it on both the
  React Native state channel and the literal ARIA attributes web needs, since
  React Native Web ignores `accessibilityState` on a pressable.
- Warn in development when a state is paired with a role ARIA does not allow it
  on, or when a role that requires a state is left without one.
- Bind Spacebar for every role other than `button`, which is the only role React
  Native Web's press responder binds it on, and leave Enter to that responder so
  no press fires twice.
- Remain a single control: group semantics — the `tablist` / `radiogroup` /
  `menu` container, roving focus, and arrow-key navigation — stay with the
  caller or with the segmented control.
- Own the shared focus ring and hide the browser's default outline under every
  role. On web the custom ring must follow `:focus-visible`, not raw focus, and
  disabling a focused button must clear the tracked state so re-enabling it
  cannot restore a stale ring. Native keeps its platform focus behavior.
- Use shared theme tokens for fills, borders, label colors, disabled opacity,
  fonts, and radii, and size with the shared control-size scale.

## Control Size Contract

Interactive controls share one size scale so a form can size its fields and
their buttons from a single vocabulary.

Required behavior:

- Expose `sm`, `md` (default), and `lg` sizes through a shared `ControlSize`
  type used by the button, input/field, and textarea.
- The button scales its height, horizontal padding, label type scale, and icon
  with the size.
- The input/field scales its box height, padding, input text, textarea minimum
  height, and prefix / suffix / clear icons with the size, while keeping the
  label, hint, and error messages at a constant scale.
- `md` preserves the established defaults (the 38px button and the 40px input
  box) so existing call sites are unchanged when no size is supplied.

## Input Contract

The input family covers labelled single-line text fields, labelled multiline
textareas, and a bare framed input box for controls that own their own label or
popover.

Required behavior:

- Render a visible label, required marker, framed text entry surface, hint text,
  and validation error without depending on consumer-local form components.
- Associate labels, hints, and errors with the underlying `TextInput` through
  generated ids and literal ARIA attributes on web, while preserving native
  accessibility hints.
- Treat `Input` as the default single-line field and `Textarea` as the multiline
  field; `Textarea` must force multiline mode and default to four visible rows.
- Use the same validation border, focus ring, placeholder color, clear button,
  icons, and `ControlSize` scaling for single-line and multiline fields.
- Keep `InputFrame` available as the shared bare box so date fields and other
  custom controls can reuse the chrome without duplicating it.

## Avatar Contract

The avatar family covers the compact initials badge used to represent a person
or entity, as either a circular disc or a rounded square.

Required behavior:

- Render a disc or a rounded square with one or two initials centered on it.
- Drive the box, the corner radius, and the initials' font size from a single
  `size` prop so every avatar scales proportionally.
- Offer two shapes: `circle` (the default, radius `size / 2`) and `square`,
  whose radius is `size * radii.avatarRatio` — a theme ratio token (default
  `0.25`) clamped to `[0, 0.5]` so the corner reads identically at every size.
- Support a solid tone (primary-filled disc with white initials) and a soft tone
  (soft-tinted disc with deep-primary initials).
- Offer an indeterminate `loading` state that replaces the initials in place
  with the loader family's `dot-grid` shape, drawn in the same foreground color
  the initials would have used. The disc keeps its fill, corner, and footprint
  so a row of avatars does not reflow, and it reports itself as a busy
  progress indicator rather than an image for as long as it is loading.
- Use shared theme tokens for the disc backgrounds, the initials' color, and the
  initials' font, with no consumer-local theme imports.
- Accept an optional accessible name and a container style override without
  requiring consumers to fork the component.
- Accept an optional initials color override so consumer-provided palette discs
  can keep matching palette-specific foreground colors.

## Badge Contract

The badge family covers the compact, non-interactive status pill that labels a
status (e.g. `Active`, `Pending`, `Overdue`) with a themed tone.

Required behavior:

- Render a content-hugging, fully-rounded pill around one short label, sized on
  the shared `ControlSize` scale (`sm` / `md` (default) / `lg`).
- Carry a semantic status `tone` — `neutral` (default), `primary`, `warning`,
  and `danger` — in a `soft` (tinted fill, deep accent text) or `solid` (filled
  accent, white text) variant. There is no `success` or `info` tone, because the
  shared theme exposes no green or blue accent distinct from the brand
  `primary`; a status badge maps onto the existing accent families.
- Keep every tone/variant pair at the WCAG 1.4.3 AA text-contrast minimum
  (≥4.5:1) on its own fill in both shipped themes, using the deep
  `amberDeep` / `roseDeep` accents for the warning and danger tones.
- Keep the visible label text as the status channel so the tone color reinforces
  rather than solely conveys the meaning, with an optional accessibility-label
  override for abbreviated or numeric labels.
- Offer an optional leading status dot, tinted to the resolved label color (or a
  custom color), which may `pulse` for a live state through the same shared halo
  as the status dot family.
- Use shared theme tokens for the fills, the label color, the font, and the pill
  radius, with no consumer-local theme imports.

## Status Dot Contract

The status dot family covers the small round state indicator that sits beside a
label — in a list row, a table cell, a header, or inside a badge.

Required behavior:

- Render a circle sized on the shared `ControlSize` scale (`sm` / `md`
  (default) / `lg`), where `md` matches the workflow graph's run-status dot so
  the two families cannot diverge.
- Carry the `Badge` tone vocabulary (`neutral` (default), `primary`, `warning`,
  `danger`) as a type alias rather than a restated union, so a dot and the pill
  beside it describe a status in one language. A dot has no text of its own, so
  it takes the mid accent rather than a soft-fill/deep-text pair.
- Accept a custom color for a caller-owned palette the semantic tones do not
  cover — the route by which the workflow graph keeps its own status palette.
- Offer an optional `pulse` that swells a translucent halo out of the dot and
  fades it — the design system's live-state ping — while the dot itself stays
  solid. The halo is drawn out of flow so it overflows the dot (and any pill
  around it) without affecting layout, it is shared with the badge dot so no
  surface hand-rolls a heartbeat, it is decorative, and under reduced motion it
  is not drawn at all (2.3.3). Its loop stops on unmount.
- Stay decorative unless given a label, on the assumption the adjacent text
  states the status; a labelled dot reports as an `image` with that name, so the
  status is never carried by color alone (WCAG 1.4.1).
- Use shared theme tokens for the fill and the radius, with no consumer-local
  theme imports.

## Date Contract

The date family covers single-date fields and start–end ranges built from two
independent single-date inputs.

Required behavior:

- Use ISO `YYYY-MM-DD` as the canonical value with `""` as the unset sentinel,
  and render the display as `D Mon YYYY`.
- Render an identical styled trigger on every platform and resolve only the
  opened picker per platform: an editable type-or-pick text input plus anchored
  calendar popover on web, and a tap-to-pick calendar sheet on native.
- Keep the web calendar popover at its compact `280px` width below wider form
  fields, shrinking it only when required by the viewport; the field width must
  not spread the seven day columns across the form.
- Give editable and tap-to-pick triggers the shared input border and focus glow,
  and let the bare `DateInput` autofocus when mounted as an embedded editor.
- Clamp selections and typed values to the inclusive `min`/`max` bounds.
- Validate range ordering, surfacing an error when the start is after the end,
  while still allowing each endpoint to hold any date independently.
- Offer an opt-in (`clearable`, off by default) clear affordance that, once a
  value is set, resets the value to the unset sentinel without clamping and closes
  the picker; range endpoints clear independently. The clear control is a
  labelled, focusable button, distinct from the decorative calendar icon.
- Lift the open field root (and the range row) above following form content so
  the calendar escapes sibling stacking contexts.
- Keep day cells, navigation buttons, and the clear button labelled for
  assistive technology, and include the field label in those accessible names.

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
- On web, visual focus rings must follow `:focus-visible`, not raw focus. Pointer
  focus remains real for behavior but does not paint a ring; keyboard input can
  reveal the ring without requiring a new focus event. Native keeps its
  platform focus behavior.
- `disableFocusRing` is an explicit customization and must not be required to
  suppress rings after ordinary pointer interaction. Disabling the custom ring
  restores the browser's default keyboard-focus outline.
- Modality tracking belongs to the shared `useFocusRing` hook. List and
  ListItem must consume its visible-focus state rather than implement local
  pointer/keyboard tracking.

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
- Render the web pointer-drag clone through a `document.body` portal. Its fixed
  position consumes viewport `clientX` / `clientY` coordinates and must remain in
  that coordinate system even when the board is inside a transformed or scrolling
  ancestor such as a React Native Web `ScrollView`.
- Scroll the columns horizontally on both web and phone, and size with the
  shared control-size scale.

## Dropdown Contract

The dropdown family covers three related surfaces:

- Button-backed selectors and action menus.
- Read-only selector-shaped controls.
- Input-backed combobox popovers and chip multi-selects.

Required behavior:

- Measure an anchor and render a portal surface that escapes ordinary page
  stacking contexts.
- Treat the anchor width as the portal surface minimum by default, while
  allowing fixed-width custom surfaces to opt out when their content contract
  is intentionally narrower than a wide anchor.
- Place below the trigger when space permits, flip above near the viewport
  bottom, and clamp max height.
- Treat a selector trigger as the popup's minimum width, grow the popup to its
  wider option content, and cap that growth at `360px` by default and at the
  viewport edge in all cases. Per-selector minimum and maximum overrides may
  change the content bounds, but the configured maximum must not shrink a
  popup below a wider visible trigger unless the viewport itself is narrower.
- Support keyboard navigation, disabled row skipping, Enter selection, Escape
  close, hover active state, outside pointer close, loading/empty rows, section
  headers, dividers, footers, secondary text, right-side content, and danger or
  warning row tones.
- Keep the keyboard-active option scrolled into the visible list viewport when
  navigation moves through long dropdown or combobox lists.
- Include the field label in selector accessible names when a visual label is
  supplied, so repeated selectors remain distinguishable to assistive
  technology.
- Preserve no-match empty rows even when combobox footers are present.
- Keep input-backed comboboxes on a non-modal web portal so text inputs retain
  focus while results are open.
- Give field-style selectors and chip multi-selects the shared input border and
  focus glow, with autofocus support for controls mounted as active editors.
  Focusing a chip multi-select search input must open its option list, and
  pressing anywhere on the control must return focus to that input.
- Size chip multi-selects from the shared control scale and provide a
  fixed-height single-line mode for dense table or data-grid editors, so their
  chips cannot expand over neighboring rows; summarize overflow selections and
  keep checked option rows enabled as removal toggles.
- Provide an action-menu wrapper that owns the trigger anchor, controlled or
  uncontrolled open state, portal/list composition, and default close-after-row
  selection behavior for common trigger-backed menus.
- Offer selectable trigger gestures (press, hover, long-press, context menu) on
  the action-menu wrapper, resolving hover and context-menu behavior per
  platform and keeping press available where a gesture is unavailable.
- Keep dropdown and combobox portal layers above modal surfaces.
- Preserve native-safe fallbacks for Expo platform resolution.

## Drag Select Contract

The drag-select family covers web-only rubber-band selection for repeated rows,
tiles, and similar rendered targets. Native platforms receive a safe provider
fallback but no drag gesture.

Required behavior:

- Register selectable targets by stable id through a hook-owned ref.
- Measure registered target bounds on drag start and select every enabled target
  whose measured bounds intersect the marquee box on pointer up.
- Require pointer movement to meet a provider-configurable minimum drag
  distance before live matching, marquee rendering, or final selection starts.
  The default minimum is `4px`; `0` starts selection immediately after movement,
  negative values clamp to `0`, and non-finite values fall back to the default.
- Expose final selected ids, selected target metadata, selected count, live
  matching ids, live matching target metadata, and live matching count through
  hooks.
- Treat selected target metadata as a snapshot captured when selection finishes;
  consumers that need live target data should map selected ids through their own
  current data source.
- Provide a provider-level selection-change callback and a hook-level listener
  for components that need side effects when selection changes.
- Allow the marquee badge copy to be customized from the live matching count,
  ids, and target metadata.
- Render the web marquee through a body-level portal using shared theme primary
  colors, radii, and a shared layer token that clears modal and dropdown
  surfaces while allowing an explicit provider override.
- Ignore touch drags and nested form/menu/link controls while allowing a
  selectable target root to start the drag.
- Keep the pure geometry helpers exported and covered by unit tests.
- Preserve a native-safe fallback for Expo platform resolution.

## Modal Contract

The modal family is a web modal frame, not a native modal replacement.

Required behavior:

- Render web dialogs through a `document.body` portal.
- Provide backdrop, surface, title, optional subtitle, close control, scrollable
  body, footer slot, size variants, and center or bottom-sheet placement.
- Support close policy for Escape, backdrop press, close button, request close,
  non-dismissible flows, and busy/disabled close states.
- Move focus into the modal on open, trap Tab focus inside the modal while it is
  open, and restore previous focus on close.
- Use accessible dialog labeling and close labels.
- Provide native-safe fallback files that return `null` rather than replacing
  iOS or Android native sheets, action sheets, OS pickers, or platform modals.

## Toast Contract

The toast family covers transient, non-blocking notifications driven from an
imperative API rather than rendered declaratively at a call site.

Required behavior:

- Provide a `ToastProvider` that owns a capped, ordered queue and publishes an
  imperative API (`toast`, `dismiss`, `dismissAll`) through a `useToast` hook
  and a module-level `toastController`; the hook must throw when used outside a
  provider, and the controller must throw before a provider is mounted.
- `toast()` must return an id usable with `dismiss`, default the tone to `info`,
  and default the auto-dismiss delay to the provider default while accepting a
  per-toast `duration` override and a `null`/non-positive duration for sticky
  toasts. Toasts must also accept a `variant` prop that defaults to `card`.
- Cap simultaneously visible toasts at a provider-configurable `max` (default 4)
  by dropping the oldest entries.
- Render toasts in a viewport pinned to one of six placements (top/bottom ×
  left/center/right), with the newest toast nearest the pinned edge, through a
  `document.body` portal with `position: fixed` on web and an
  absolutely-positioned, `pointerEvents="box-none"` overlay on native.
- Auto-dismiss each toast after its resolved duration and pause the countdown
  while the pointer or keyboard focus is over the toast.
- Carry tone (`info`, `success`, `warning`, `error`) as the leading icon color
  and screen-reader semantics: errors announce assertively with the `alert`
  role, other tones politely with the `status` role. The card keeps a uniform
  1px border on every edge — tone must never be drawn as a left accent strip
  (see the accent-bar rule in `AGENTS.md`).
- Support a compact `solid` variant that uses the tone color as the filled
  background, hides the default card icon, and can match the bottom-center
  transaction-error style through props.
- Support caller-provided leading icons for toast surfaces so in-progress,
  branded, or feature-specific visuals do not require new visual variants.
- Allow per-toast surface and filled-foreground overrides so compact solid
  toasts can match dark in-progress status surfaces through props.
- Allow per-toast title and description text style overrides that layer after
  the built-in variant text styles.
- Support an optional action button that runs its handler and then dismisses the
  toast, and an optional close control that dismisses only its own toast.
- Use shared theme tokens for the surface, border, accent colors, text, fonts,
  and radii, with no consumer-local theme imports.
- Float the toast viewport above modal surfaces, nested overlays, and the
  consent banner, and export the layer token for consumers.

## Workflow Builder Contract

The workflow-builder family covers the branching step-graph canvas the
workflow-builder and table-automation mockups model as `.wf-*`: a trigger-rooted
vertical spine of step cards used to construct automation workflows.

Required behavior:

- Render a typed graph model (`WorkflowGraph`) of steps along a spine, where each
  step is either a node (`trigger`, `code`, `agent`, `branch`, `app`, `outcome`)
  or a fork that splits into parallel branches, each branch carrying its own
  condition label and sub-spine (rendered recursively).
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

## Layering Contract

- Ordinary content sits below dropdowns and modal portals.
- Modal backdrop sits below modal surface.
- Dropdowns and comboboxes opened inside modals sit above modal surfaces.
- The toast viewport sits above modal surfaces, nested dropdown/combobox
  overlays, and the cookie-consent banner.
- Date calendar popovers, dropdown portals, and generic popovers use a high
  default overlay floor and expose z-index props for consumer-owned stacking
  contexts that sit above the shared defaults.
- Layer tokens must be exported so consumers can align adjacent overlays
  without hard-coded numeric z-index values.

## Test And Build Contract

- Pure helpers for placement, navigation, close policy, and layer ordering must
  have unit tests.
- Component source contracts that protect web/native boundaries must have tests.
- Browser interaction tests must cover opening, keyboard navigation, outside
  dismissal, segmented selection, switch toggling, table row press (click and
  keyboard), focus retention/restoration, pointer-versus-keyboard focus-ring
  modality, focused-control disable/re-enable, and portal layering for
  dropdowns, comboboxes, and web modals.
- The package must typecheck and build before it is used by accounting or Juno.
- `npm run test:package` must pack the built library, install the tarball into a
  temporary consumer, import every public package subpath with Node's native ESM
  resolver, typecheck those public package subpaths with TypeScript's NodeNext
  resolver, and import the same subpaths through a Vite build.
- After package build/tests pass, smoke-test at least one local web route or
  harness that opens a dropdown, a combobox, and a modal, toggles a segmented
  control and switch, and selects a radio card.

## Package Release Contract

- The public npm package name is `@firna/ui`.
- Standard ESM `import` exports must point at Node-resolvable `dist/node/**`
  files with explicit relative `.js` specifiers.
- Exported `types` entries must point at NodeNext-compatible declarations under
  `dist/node/**`, with explicit relative `.js` specifiers inside declaration
  imports and re-exports.
- The `react-native` export condition must continue to point at the normal
  `dist/**` build so React Native platform resolution can choose platform files.
- Every primitive a consumer is expected to import directly must have its own
  subpath, not the package root alone. This includes the shared focus-glow
  primitive (`./focusRing`, mirroring `./theme`): a consumer that imports every
  component by subpath would otherwise pull the whole barrel through Metro just
  to wire a focus ring onto its own control.
- release-please owns release PR creation, changelog updates, npm metadata
  version updates, `vX.Y.Z` Git tags, and GitHub releases.
- release-please must use the `node` release type so release PRs update
  `CHANGELOG.md`, `package.json`, and `package-lock.json` together.
- Generated release PRs must be normalized by the release workflow before they
  are considered ready for merge: the workflow checks out the release PR branch,
  runs the repository formatter, and pushes a bot commit only when formatting
  changed generated files.
- Ordinary pushes to `main` must not publish npm packages; publishing must only
  run when release-please reports that a GitHub release was created from a
  merged release PR, or when a maintainer manually dispatches a publish retry
  for an existing `vX.Y.Z` tag.
- npm publishing must run in the same workflow invocation that creates the
  GitHub release so it does not depend on a separate `release` event emitted by
  `GITHUB_TOKEN`.
- That workflow must remain at `.github/workflows/release-plz.yml` unless the
  npm trusted-publisher configuration is updated at the same time; npm validates
  the configured workflow filename during `npm publish`.
- The same workflow must expose a manual retry path that checks out an existing
  release tag and runs the same verification and npm publish steps without
  creating a new GitHub release.
- npm publishing must use npm trusted publishing with `id-token: write` and
  must guard against republishing an already-published version.
- Scoped package publishing must use public access.

## CI And Preview Contract

- Storybook deployments use Cloudflare Pages.
- The Cloudflare Pages project name is `futex-ui-storybook`.
- The stable main Storybook deploy uses the Cloudflare Pages production branch
  `main` and the default production URL
  `https://futex-ui-storybook.pages.dev`, unless a custom domain is added later.
- Same-repository non-release PR Storybook previews deploy the static Storybook
  build to Cloudflare Pages with branch name `pr-<number>`, producing a
  predictable preview URL such as
  `https://pr-123.futex-ui-storybook.pages.dev`.
- Every PR must run `cargo xtask check` after dependency installation. The
  xtask check runs the JavaScript verification suite: formatting, unit tests,
  typecheck, package build, package tarball smoke test, Storybook build, and
  browser interaction tests.
- The main branch must publish a stable default Storybook deployment.
- Every same-repository non-release PR must publish an isolated Storybook
  preview deployment.
- Release Please PRs, identified by a `release-please--` head branch or an
  `autorelease:` label, must skip the Storybook preview deploy job because they
  only update release metadata for changes already previewed in source PRs.
- The PR Storybook URL must be posted back to the pull request through a sticky
  comment with marker `<!-- futex-ui-storybook-preview -->`, matching the
  preview-comment pattern used by accounting and Juno.
- The sticky comment must be updated on every PR deploy attempt with status,
  preview URL, commit SHA, and workflow run URL.
- PR previews update in place on every new commit by redeploying the same
  `pr-<number>` Cloudflare Pages branch.
- On PR close, the workflow must mark the sticky comment inactive and use the
  Cloudflare Pages API to force-delete aliased non-production deployments for
  the `pr-<number>` branch when that API is available to the workflow; if
  deletion cannot be performed safely, the close workflow must report that the
  preview was retained and include the reason.
- Required Cloudflare configuration is repository variable
  `CLOUDFLARE_ACCOUNT_ID` and repository secret `CLOUDFLARE_PAGES_API_TOKEN` or
  `CLOUDFLARE_API_TOKEN`.
- Storybook previews must include at least the shared dropdown selector,
  dropdown action menu, input-backed combobox, chip multi-select, segmented
  control variants, radio card group, switch toggle, button tones and sizes,
  user avatars, a month event calendar, a data table with clickable rows,
  centered web modal, bottom-sheet web modal, toast tones and an action toast,
  default accounting theme, and alternate primary color theme.
- Storybook navigation must keep each example family in its own top-level
  folder, currently `Avatar/Examples`, `Badge/Examples`, `Button/Examples`,
  `Calendar/Examples`,
  `Date/Examples`, `Dropdown/Examples`, `Heatmap/Examples`, `Input/Examples`,
  `Loader/Examples`,
  `Modal/Examples`, `Popover/Examples`, `Radio/Examples`, `Segmented/Examples`,
  `Spinner/Examples`, `Status dot/Examples`, `Switch/Examples`,
  `Table/Examples`,
  `Theme/Examples`, and `Toast/Examples`.

## Non-Goals

- Migrating accounting or Juno imports in this package extraction change.
- Replacing native iOS or Android modal/sheet/picker behavior.
- Adding app-specific mutations, data fetching, routing, or screen state.
- Adding a broad design system beyond the copied dropdown, segmented control,
  and modal families.
