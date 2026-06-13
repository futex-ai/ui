# Date fields (`DateField` / `DateRangeField`)

Branded date inputs for React Native and React Native Web. They render an
identical styled trigger on every platform; only the _opened_ picker differs,
and a `variant` prop chooses which picker that is.

## Variants

- **`variant="calendar"` (default)** — the branded month grid.
  - **Web** renders a sage calendar popover anchored below the field, and the
    trigger is an editable text input (type **or** pick).
  - **Native** presents the same calendar in a bottom-sheet modal with Cancel /
    Done (tap to pick).
- **`variant="wheel"`** — an iOS-style spinning **day / month / year** wheel in a
  bottom sheet, built from our theme (not the OS picker). The trigger is a
  tap-to-open target on every platform (typing a date doesn't pair with a
  spinner). Spinning or tapping a row stages a draft; Cancel discards it and Done
  commits it. The wheel sheet uses our own modal — `WebModalFrame`
  (`placement="bottom-sheet"`) on web, RN `Modal` on native — so there is **no
  native date-picker dependency**.

```tsx
<DateField label="Year ends" onChange={setIso} value={iso} variant="wheel" />
```

Ported from the accounting app's `components/date`. The accounting native picker
delegated to the OS via `@react-native-community/datetimepicker`; this shared
library has no native picker dependency, so the calendar variant renders the
shared `CalendarMonth` itself and the wheel variant renders our own
`DateWheel`.

## Components

- **`DateField`** — single date. Label + trigger + error/hint.
- **`DateInput`** — the bare trigger + its own single-date picker (no
  label/error/hint). Used by `DateField` and by each `DateRangeField` endpoint.
- **`DateRangeField`** — start–end range built from two independent
  `DateInput`s, with ordering validation.
- **`CalendarMonth`** — the shared, theme-driven month grid (header nav,
  Monday-first weekday row, labelled day buttons).

## Value model

- **Canonical value: ISO `YYYY-MM-DD`.** `""` means "not set".
- **Display: `D Mon YYYY`** (e.g. `4 Mar 2024`).
- **Range value: `{ start, end }`** of ISO strings.

## Clearing

Clearing is **opt-in**: pass `clearable` to `DateField` / `DateInput` /
`DateRangeField` (off by default). When enabled, the trigger shows a circle-✕
clear button beside the trailing icon once a value is set. Pressing it resets the
value to `""` (unset) — bypassing the min/max clamp, since empty is the unset
sentinel — and closes the open picker (calendar popover or wheel sheet). Each
`DateRangeField` endpoint clears independently, in both variants. On web with the
calendar variant, focus returns to the now-empty input without re-opening it.
With the wheel variant on every platform — and the calendar on native — the clear
button is a sibling accessible button inside a non-accessible row Pressable, so it
captures its own touch (clearing never also opens the picker) while staying
independently reachable by VoiceOver/TalkBack alongside the open button.

`DateField` is controlled — `value` (ISO) plus `onChange: (iso) => void`.
`DateRangeField` takes `value: { start, end }` plus `onChange: (next) => void`.

```tsx
import { DateField, DateRangeField } from "@futex/ui/date";

<DateField label="Year ends" onChange={setIso} value={iso} />;

<DateRangeField label="Current period" onChange={setRange} value={range} />;
```

## File layout

- `dateMath.ts` — pure, timezone-safe helpers (ISO parse/format, `D Mon YYYY`
  formatting, month-grid build, clamp/compare, range parse/format). No React.
  Unit-tested. Includes a domain `deriveCurrentPeriod` helper the components do
  not use, kept for parity with the source.
- `useDateField.ts` — shared hook: value, format, min/max clamp, typed-text
  parse, open state. No platform code.
- `types.ts` — shared overlay prop contract (`DatePickerOverlayProps`).
- `dateFieldLayers.ts` — z-index tokens for lifting open fields/rows.
- `DateField.tsx` — `DateField`, `DateInput`, and the shared `FieldLabel`.
- `DateTrigger.tsx` — the platform triggers (`WebTrigger`, `NativeTrigger` tap
  target) and the `triggerBorder` helper. `WebTrigger` renders the shared
  `InputFrame` (`@futex/ui/input`) for the editable box — the same chrome, focus
  ring, clear button, and `aria-invalid` wiring as every other text input — and
  only supplies the type-or-pick behaviour (commit-on-type, focus-to-open) plus
  the calendar suffix icon. `NativeTrigger` is a tap target, not a text input, so
  it keeps its own row layout.
- `DateRangeField.tsx` — two independent endpoints with ordering validation.
- `CalendarMonth.tsx` — the shared month grid (calendar variant).
- `DateWheel.tsx` — the shared spinning day/month/year wheel (wheel variant). A
  snap-scrolling, tappable, theme-driven three-column picker; spinning to a
  shorter month keeps a valid day and out-of-bounds dates snap back.
- `DatePickerOverlay.web.tsx` — web overlay: calendar popover (anchored) or, for
  the wheel variant, a `WebModalFrame` bottom sheet with Cancel/Done.
- `DatePickerOverlay.tsx` — native overlay: a bottom-sheet `Modal` (Cancel/Done
  draft) rendering the calendar or the wheel by `variant`.
- `dateFieldStyles.ts` / `webCalendarStyles.ts` / `wheelPickerStyles.ts` —
  `createXStyles(theme)` factories for the triggers, the calendar, and the wheel.

**Platform resolution:** the bare import `./DatePickerOverlay` resolves to the
`.tsx` (native) file for `tsc` and native bundlers; the Vite/Metro web bundle
swaps in `.web.tsx` (the Storybook config lists `.web.tsx` first). Both files
honour the `variant` prop, so the calendar/wheel choice is identical per platform.

## Theming

Styles read colors, fonts, and radii from `SharedUiThemeProvider` via
`useSharedUiTheme()` and per-component `createXStyles(theme)` factories — the
same pattern as the other components in this library. The brand accent is the
theme's `primary` / `primaryDeep` tokens.

## Web stacking (z-index)

react-native-web gives every `View` `position: relative` + `zIndex: 0`, so each
is its own stacking context and a high `zIndex` on a nested element cannot escape
its parent. The calendar is therefore lifted at each wrapper that would trap it:

- **Field root** — `fieldOpen` (`zIndex: 1000`) on the open field so the calendar
  paints over following form fields.
- **`DateRangeField` row** — also lifted when either endpoint is open, because the
  open endpoint's calendar is nested inside the row and would otherwise be painted
  over by the row's later-DOM hint/error siblings.

`dateFieldLayers.ts` documents and unit-tests this rule.

## Accessibility

- The editable web trigger carries the field label (`accessibilityLabel`) and
  opens the calendar on focus; the calendar icon is decorative (`aria-hidden`,
  `tabIndex={-1}`).
- The clear button (when `clearable`) is a real labelled `button` (`Clear
<label>`) in the tab order and a11y tree — unlike the calendar icon it is a
  distinct action with no keyboard equivalent, and it only renders while there is
  a value to remove.
- Day cells are labelled `button`s (`D Mon YYYY`) with `accessibilityState`
  selected/disabled; adjacent-month and out-of-bounds days are non-selectable;
  nav buttons are labelled.
- Wheel rows are labelled `button`s (`Day 31`, `Month Mar`, `Year 2026`) with
  `accessibilityState` selected/disabled — tapping a row selects it without
  needing a fling, so the wheel is reachable by pointer and keyboard, not only by
  scroll. Out-of-bounds rows are disabled.
- Web dismissal: the calendar popover closes on selection or on an outside press
  (`useOutsideClose`). The native sheet and the web wheel sheet close on Cancel,
  Done, or backdrop press; the web wheel sheet (`WebModalFrame`) also closes on
  Escape and traps/restores focus. Escape dismissal of the calendar popover is
  not yet implemented.

## Locale

The calendar is Monday-first (`en-GB`) and formats a fixed `D Mon YYYY`. A
`weekStartsOn` parameter on `buildMonthGrid` would generalise it for other
locales.

## Testing

`dateMath.ts` (including the wheel's `clampDay` / `wheelYearRange` helpers) and
`dateFieldLayers.ts` are unit-tested with the repo's Node test runner. Both the
calendar and wheel variants are exercised by the Storybook Playwright spec
(`tests/browser/storybook.spec.ts`) against the `Date/Examples` stories —
covering month navigation and day picking for the calendar, and draft
staging/commit, day-and-bounds clamping, Cancel, clearing, and the range field
for the wheel.
