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
- Reveal optional supplementary help text (`labelInfo`) from an ⓘ button beside
  the label, in a portaled tooltip that stays out of the always-read messages.
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
- `LabelInfo` — the ⓘ button + tooltip that `Input` renders for `labelInfo`.
  Exported so other labelled controls can reuse the same help affordance.

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

### Label info

`labelInfo` renders an ⓘ button after the label that reveals supplementary help
text in a small bubble on press. The visible bubble is built on {@link Popover},
so it is portaled — it escapes `overflow` clipping inside modals and scroll
areas — and dismisses on outside-press or Escape. Screen-reader users get the
same text from the button's own description (announced on focus), so the reveal
is a sighted-user affordance and its bubble is not announced separately. Use it
for occasional "what is this / why we ask" detail; keep the short, always-on
guidance in `hint`.

```tsx
<Input
  hint="9 or 12 digits, no spaces."
  label="VAT number"
  labelInfo="Your VAT registration number identifies your business to the tax authority. Leave it blank if you are not VAT registered."
  onChangeText={setVat}
  value={vat}
/>
```

Override the glyph with `labelInfoIcon` (any `lucide-react-native` icon) and the
button's accessible name with `labelInfoLabel` (defaults to
`More information about {label}`). `labelInfo` needs a `label` to anchor the
button — it is a dev-warned no-op on the bare (label-less) variant. The reusable
`LabelInfo` primitive is exported for other labelled controls that want the same
affordance.

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

### Plain (borderless) variant

`InputFrame` takes a `variant`: `framed` (default) draws the bordered surface
box; `variant="plain"` drops the border, background, and horizontal padding for a
**chrome-less inline editor** embedded in a row — an inline title / label editor
that reads as plain text until focused. The focus ring, the `clearable` ✕ button,
and the invalid / required a11y wiring stay owned by the frame, so the field is
still keyboard-accessible and announces its state. Because a plain field has no
border, the invalid state has nothing to recolor — surface the error through the
surrounding row or a separate message.

```tsx
import { InputFrame } from "@firna/ui/input";

<InputFrame
  accessibilityLabel="List title"
  onChangeText={setTitle}
  size="sm"
  value={title}
  variant="plain"
/>;
```

### Seamless (invisible) variant

`variant="seamless"` goes a step further than `plain`: on top of dropping the
border, background, and padding it also drops the **reserved control height**, so
the field collapses onto its text and reads as ordinary copy that happens to be
editable — an inline-editable title, table cell, or paragraph. It only reveals
the shared focus ring when edited. Style the text through `inputStyle` to match
the surrounding copy (size, weight, colour, line height); the field inherits the
`size` scale otherwise.

It works on both a single-line field **and** a `multiline` one. A seamless
multiline field auto-grows to fit **all** its content (no scrollbar) so it stays
exactly as tall as the text — pass `maxLines` to cap it, and drive a controlled
`value` on web (auto-grow measures on `value` change). Reach for the bare
`Input` / `InputFrame` (or `Textarea` with `numberOfLines={1}`) so a seamless
multiline field can start as a single line.

```tsx
import { Input, Textarea } from "@firna/ui/input";

// An inline-editable heading that reads as a heading until you click into it.
// A seamless field has no fixed height or padding, so pair a raised `fontSize`
// with a matching `lineHeight` to keep the larger glyphs from clipping.
<Input
  accessibilityLabel="Document title"
  inputStyle={{ fontSize: 22, fontWeight: "700", lineHeight: 28 }}
  onChangeText={setTitle}
  value={title}
  variant="seamless"
/>

// A paragraph you edit in place; it grows to fit as you type.
<Textarea
  accessibilityLabel="Document body"
  inputStyle={{ fontSize: 15, lineHeight: 22 }}
  numberOfLines={1}
  onChangeText={setBody}
  value={body}
  variant="seamless"
/>;
```

Like `plain`, a seamless field has no border to recolor, so surface any
validation error through the surrounding layout rather than the box. Its only
focus indicator is the shared ring (there is no border to recolor and the native
outline is hidden), which by default is an **outset** glow. An `overflow: hidden`
ancestor — the very containers this variant targets, such as a table cell or a
truncating card — clips that glow, so pass `focusRingInset` to draw the ring
inside the box instead and keep a visible focus indicator (WCAG 2.1 2.4.7). On a
zero-padding seamless field the inset ring paints over the text edges, so where
you can, prefer reserving a little padding on the clipping ancestor.

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
- **Label info (4.1.2 / 2.4.7 / 1.3.1).** The `labelInfo` ⓘ is a real button
  with an accessible name (`labelInfoLabel`) and its own focus ring. It carries
  the info as its accessible **description**, announced when the button is
  focused: native reads `accessibilityHint`; web (where RNW drops that) points a
  literal `aria-describedby` at a visually-hidden copy of the text. The portaled
  bubble is a sighted-user reveal only — it does not steal focus and its content
  is `aria-hidden`, so the detail is never announced twice. Because the button
  is a sibling of the label `<Text>` (not nested inside it), it never leaks into
  the input's `aria-labelledby` name.
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
