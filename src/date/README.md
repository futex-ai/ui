# Date fields (`DateField` / `DateRangeField`)

Branded date inputs for React Native and React Native Web. They render an
identical styled trigger on every platform; only the _opened_ picker differs:

- **Web** renders our own sage calendar popover anchored below the field, and
  the trigger is an editable text input (type **or** pick).
- **Native** presents the same calendar in a bottom-sheet modal with Cancel /
  Done (tap to pick).

Ported from the accounting app's `components/date`. The one adaptation: the
accounting native picker delegated to the OS via
`@react-native-community/datetimepicker`. This shared library has no native
picker dependency, so the native overlay (`DatePickerOverlay.tsx`) renders the
shared `CalendarMonth` itself. Web behaviour is unchanged.

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
- `DateRangeField.tsx` — two independent endpoints with ordering validation.
- `CalendarMonth.tsx` — the shared month grid.
- `DatePickerOverlay.web.tsx` — web calendar popover (absolute, anchored).
- `DatePickerOverlay.tsx` — native calendar sheet (Cancel/Done draft).
- `dateFieldStyles.ts` / `webCalendarStyles.ts` — `createXStyles(theme)`
  factories for the triggers and the calendar.

**Platform resolution:** the bare import `./DatePickerOverlay` resolves to the
`.tsx` (native) file for `tsc` and native bundlers; the Vite/Metro web bundle
swaps in `.web.tsx` (the Storybook config lists `.web.tsx` first).

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
- Day cells are labelled `button`s (`D Mon YYYY`) with `accessibilityState`
  selected/disabled; adjacent-month and out-of-bounds days are non-selectable;
  nav buttons are labelled.
- Web dismissal: the popover closes on selection or on an outside press
  (`useOutsideClose`). The native sheet closes on Cancel, Done, or backdrop
  press. Escape-key dismissal of the web popover is not yet implemented.

## Locale

The calendar is Monday-first (`en-GB`) and formats a fixed `D Mon YYYY`. A
`weekStartsOn` parameter on `buildMonthGrid` would generalise it for other
locales.

## Testing

`dateMath.ts` and `dateFieldLayers.ts` are unit-tested with the repo's Node test
runner. The web calendar is exercised by the Storybook Playwright spec
(`tests/browser/storybook.spec.ts`) against the `Date/Examples` stories.
