# Shared UI Controls Protocol

The requirements of the shared segmented controls, switches, radio cards,
buttons, control sizes, inputs, and date fields. The
[shared UI component protocol](shared-ui-components.md) holds the package
boundary and links every other page.

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
  re-roled button has no `href`, so a real link must be an anchor. The
  [link button](app-shell-parts.md#link-buttons) is that anchor.
- Accept the state that role carries — `checked` for a checkbox / radio /
  switch, `selected` for a tab, `pressed` for a toggle button, and `expanded`
  for a control that reveals a menu, panel, or section — and emit it on both the
  React Native state channel and the literal ARIA attributes that web needs.
- Warn in development when a state is paired with a role ARIA does not allow it
  on, or when a role that requires a state is left without one.
- Activate on Enter and on Space under every role. Each key press fires one
  press, never two.
- Remain a single control: group semantics — the `tablist` / `radiogroup` /
  `menu` container, roving focus, and arrow-key navigation — stay with the
  caller or with the segmented control.
- Own the shared CSS focus marker under every role. On web `domBackendCss` must
  hide the browser outline only while its `:focus-visible` glow is active;
  `focusIndicator="outline"` restores the default outline and
  `focusIndicator="none"` removes it. Disabling a focused button must still
  clear tracked interaction state so re-enabling it cannot restore stale
  non-painting focus state. Native keeps its platform focus behavior.
- Use shared theme tokens for fills, borders, label colors, disabled opacity,
  fonts, and radii, and size with the shared control-size scale.

## Control Size Contract

Interactive controls share one size scale so a form can size its fields and
their buttons from a single vocabulary.

Required behavior:

- Expose `xs`, `sm`, `md` (default), and `lg` sizes through a shared
  `ControlSize` type used by the button, input/field, and textarea.
- `xs` is the dense size. The
  [app shell parts protocol](app-shell-parts.md#dense-size) gives its metrics
  and the families that draw it. Adding `xs` changes no metric of `sm`, `md`,
  or `lg`.
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
- With `focusIndicator="none"` the frame shows no glow, no outline, and no
  active border while its input is focused; an explicit `active` or `invalid`
  border still applies, and the clear and suffix buttons keep their browser
  outline.

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
- Render every calendar month as six weeks, padding with the adjacent months'
  muted days, so the calendar keeps one size while the user pages months.
- Never clip the web calendar to the room below its field: it opens through
  the shared measured placement (Dropdown Contract), which flips it above when
  the whole calendar does not fit below. When neither side fits a whole month,
  scroll the month inside the clamped popover so every week row stays
  reachable.
- Give editable and tap-to-pick triggers the shared input border and focus glow,
  and let the bare `DateInput` autofocus when mounted as an embedded editor.
- Clamp selections and typed values to the inclusive `min`/`max` bounds.
- Validate range ordering, surfacing an error when the start is after the end,
  while still allowing each endpoint to hold any date independently.
- Offer an opt-in (`clearable`, off by default) clear affordance that, once a
  value is set, resets the value to the unset sentinel without clamping and closes
  the picker; range endpoints clear independently. The clear control is a
  labelled, focusable button, distinct from the decorative calendar icon.
- While a date field is open, show it, its range row, and its calendar above
  the form content that follows.
- Keep day cells, navigation buttons, and the clear button labelled for
  assistive technology, and include the field label in those accessible names.
