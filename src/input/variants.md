# Input variants

These sections extend the [Input README](README.md).

## Plain (borderless) variant

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

## Seamless (invisible) variant

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
platform affordance remains), which by default is an **outset** glow. An `overflow: hidden`
ancestor — the very containers this variant targets, such as a table cell or a
truncating card — clips that glow, so pass `focusRingInset` to draw the ring
inside the box instead and keep a visible focus indicator (WCAG 2.1 2.4.7). On a
zero-padding seamless field the inset ring paints over the text edges, so where
you can, prefer reserving a little padding on the clipping ancestor.

When the field sits inside a surface that already shows focus — a search bar
that highlights itself, a grid cell with its own selection ring — pass
`focusIndicator="none"` instead. The frame then paints no glow, no outline, and
no active border, so the surface must show focus itself (WCAG 2.1 2.4.7); track
it with the field's `onFocus` / `onBlur`. The "Caller-owned indicator" story
under Focus ring/Examples shows the pattern.
