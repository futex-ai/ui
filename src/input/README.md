# Input

Shared labelled text input and textarea primitives for React Native and React
Native Web, adapted from the accounting app's `Field` primitive and extended
with the icon/clear chrome that the date field already used. This is the single
text-entry family for the library — other framed inputs (e.g. the date field's
web trigger) build on it.

## Responsibilities

- Render labelled text fields and textareas: label (+ required `*`), a bordered
  input box, and the error / hint messages below it.
- Highlight validation state — an `error` message turns the border rose and is
  announced via `aria-invalid`; `required` wires `aria-required` and the `*`.
- Show optional leading (`prefixIcon`) and trailing (`suffixIcon`) icons inside
  the box, plus an opt-in accessible `clearable` ✕ button.
- Own the sage focus ring on the whole box and hide the browser's default
  outline, using shared theme colors and radii.
- Size the field with the shared `ControlSize` scale (`sm` / `md` / `lg`),
  scaling the box height, textarea minimum height, padding, text, and icons
  together.
- Expose a textarea ({@link Textarea}) and a bare box ({@link InputFrame}) so
  callers can choose a multiline field or embed just the framed input when they
  own their own label/messages or popover.

## Components

- `Input` — the full labelled field (label + box + messages). The default
  choice. Omit `label` for a bare variant that still renders messages.
- `Textarea` — the full labelled multiline field. It shares `Input`'s props,
  forces multiline mode, and defaults to four visible rows.
- `InputFrame` — just the bordered box (icons, input, clear button, focus ring),
  with no label or messages. Embed it inside custom layouts or controls.

## Usage

```tsx
import { Input } from "@firna/ui/input";
import { Search } from "lucide-react-native";

<Input
  clearable
  error={touched && !email ? "Email is required" : undefined}
  hint="We only use this to send receipts."
  label="Email"
  onChangeText={setEmail}
  placeholder="you@example.com"
  prefixIcon={Search}
  required
  value={email}
/>;
```

```tsx
import { Textarea } from "@firna/ui/input";

<Textarea
  clearable
  hint="Add the context reviewers need."
  label="Project notes"
  onChangeText={setNotes}
  placeholder="Scope, constraints, open questions..."
  value={notes}
/>;
```

### Auto-growing textarea

Pass `maxLines` (above `numberOfLines`) to make a textarea grow with its content:
it opens at `numberOfLines` rows — the minimum it shrinks back to — grows one
line at a time as the caller types, and stops at `maxLines` rows, after which it
scrolls. Omit `maxLines` for a fixed-height textarea.

```tsx
<Textarea
  label="Release notes"
  // Start at two rows, grow up to six, then scroll.
  maxLines={6}
  numberOfLines={2}
  onChangeText={setNotes}
  value={notes}
/>
```

`maxLines` also works on the bare `Input`/`InputFrame` when `multiline` is set.
Row counts convert to pixels through the size's line height, so the field grows
by whole lines and scales with `size`. The growth is measured platform-specifically:
native reads the multiline `TextInput`'s `onContentSizeChange`, while web resets
the underlying `<textarea>` to its natural height and re-measures on every change
— so on web an auto-growing field must be **controlled** (drive `value`).

### Icons

`prefixIcon` and `suffixIcon` take a `lucide-react-native` icon component and are
decorative by default (hidden from assistive tech). Give the suffix an
`onSuffixIconPress` to make it pressable; add `suffixIconLabel` to make it a
focusable, keyboard-reachable button (e.g. a show/hide-password toggle). Without
a label, a pressable suffix is a mouse-only affordance (skipped by the keyboard
and assistive tech) for actions that already have an accessible path.

### Clearing

`clearable` shows a ✕ button — keyboard reachable and announced as
`Clear {accessibilityLabel}` — once `value` is non-empty. It calls
`onChangeText("")` by default (which also returns focus to the input), or
`onClear` when provided. Pass `clearVisible` to drive the button's visibility
explicitly when the value is committed separately from the live input text (the
date field does this).

### Sizes

`size` takes the shared `ControlSize` (`sm` / `md` / `lg`); `md` is the default
and matches the original 40px single-line box. The size scales the box height,
padding, input text, textarea minimum height, and prefix/suffix/clear icons
together. The label, hint, and error messages keep a constant scale so dense and
roomy fields read the same. Buttons share this scale, so a field and its submit
button can be sized to match.

## Styling

The framed input exposes two style props, which **differ from the accounting
`Field` this was adapted from** (where `style` targeted the input itself):

- `style` — the outer bordered **box** (`ViewStyle`). When porting from `Field`,
  text styling moves here only if it applies to the box.
- `inputStyle` — the inner `TextInput` (`TextStyle`). Use this for text colour,
  font, etc.

`active` forces the primary (focused) border — useful when an attached popover is
open without the input being focused (the date field uses it while the calendar
is open).

## Accessibility

- **Name (2.5.3 Label in Name / 1.3.1, A).** The visible `label` is tied to the
  `TextInput` with `aria-labelledby` (the label `<Text>` carries a generated
  `nativeID`), so the accessible name _is_ the visible text — not a separate
  `aria-label` copy. An explicit `accessibilityLabel` still overrides it (use it
  for the bare, label-less variant).
- **Errors and hints (3.3.1 / 3.3.2, A).** `error` and `hint` text get generated
  ids and are referenced from the input via `aria-describedby`; the error is also
  pointed to by `aria-errormessage` and paired with `aria-invalid`. RNW does
  **not** map `accessibilityHint` to `aria-describedby`, so this is wired with
  literal `aria-*` attributes (native still receives `accessibilityHint`).
- **Live errors (4.1.3, AA).** The error message renders in an assertive live
  region (`role="alert"` / `accessibilityLiveRegion`), so a newly-shown
  validation message is announced without moving focus.
- **Input purpose (1.3.5, AA).** Pass the standard `autoComplete` token (and,
  where useful, `inputMode`) so the field's purpose is programmatically
  determinable and the browser/AT can autofill it — e.g. `autoComplete="email"`
  - `inputMode="email"`, or `autoComplete="current-password"`. These forward
    straight through to the underlying `TextInput`.
- **Required (3.3.2, A).** `required` wires `aria-required`; the visible `*` is
  marked `aria-hidden` so it does not leak into the accessible name.
- **Focus (2.4.7, AA).** The box shows a geometry-bearing focus ring (a real
  outline, not just a border recolor) on keyboard/pointer focus, visible even on
  an invalid (rose-bordered) field.

## Theming

Inputs and textareas read colors and radii from `SharedUiThemeProvider`: the box
uses `colors.surface` / `colors.controlBorder` (a soft, translucent-ink
control-boundary token), the focus ring and active border use `colors.primary`,
the invalid border and required `*` use `colors.rose`, the placeholder and hint
text use `colors.placeholder` (≥4.5:1 — 1.4.3, AA), and the box radius uses
`radii.md`.

## Used by

The date field's web trigger (`src/date/DateTrigger.tsx`) renders an
`InputFrame` with a calendar suffix icon and the clear button, so the type-or-pick
date input shares the same chrome, focus ring, and clear behaviour as every other
text input.
