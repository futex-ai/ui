# Button layout and touch targets

These sections extend the [Button README](README.md).

## Inline

`inline` renders a compact chip that flows inside a line of text — an inline
"Restore" / "Undo" action beside a label — without changing the row's line
height. It drops the fixed track height and hugs the label with a tight padding,
then pulls that padding (and the 1px border) back off with a negative vertical
margin, so the button's outer (margin-box) height collapses to exactly its label
line height. Dropped into a row it takes the same vertical space as a run of text
at its `size`, so the row's height tracks the text beside it, not the button; the
pill's fill/border overflow the text line above and below without affecting
layout.

It composes with `tone` (`secondary` (default) is a bordered chip; `ghost` and
`plain` are borderless), `size`, and a leading `icon`. It is a small,
non-touch-first target — it relies on WCAG 2.5.8's inline / line-height
target-size exception rather than the 24px minimum — so reach for it in
pointer/text contexts, not for primary touch actions. It is a text-flow chip: the
icon-only `square` / `circle` shapes and an explicit `minTouchTarget` are
fixed-size intents that contradict the collapse, so `inline` is ignored (a no-op)
when either is set, and it should not be paired with `block`.

Because the chip **and its focus ring** overflow the text line, give the row a
little vertical padding — slightly more than the pill, for the ring. On web that
only matters under an `overflow: "hidden"` ancestor; on native (notably Android)
a parent can clip children to its own bounds, so the padding keeps the pill from
being sheared. The example rows in the story set `paddingVertical` for this.

## Tap target and box size

`minTouchTarget` is a floor: it can only grow the visible box, and one below the
size's own track is inert (a `__DEV__` warning says so). Two other props cover
what it cannot:

- `boxSize` sets a `square` / `circle` button's visible dimension outright,
  including below the smallest density's 26px track, for a glyph a design specs
  smaller than any control size.
- `hitSlop` extends the pressable area beyond the visible box, so a compact
  control still meets a comfortable target (WCAG 2.1 — 2.5.5 AAA / 2.5.8 AA)
  without growing. React Native reads it off the pressable; on web —
  where the web backend's `Pressable` ignores the prop by design — the same
  area is drawn as an inset, transparent child whose events bubble to the
  button. Either way the expanded area overlaps whatever sits beside the
  control, so reach for it on a control with room around it.

```tsx
<Button
  accessibilityLabel="Remove tag"
  boxSize={16}
  hitSlop={14}
  icon={X}
  onPress={remove}
  shape="circle"
  tone="plain"
/>
```

## Touch surfaces

Inside a `TouchSurface`, every button takes the touch metrics, whatever its
`size`: a 44px track, a 15px label on a 20px line at weight 500, 18px icons,
and a target of at least 44 by 44px. A `square` or `circle` button is a 44 by
44px box, or its `minTouchTarget` when that is larger. Each target occupies its
own layout space, so a touch surface ignores `hitSlop`, and `inline` is a
no-op there.

A `boxSize` below 44px keeps its drawing at its size, and the pressable
reserves a 44 by 44px target around it instead. The focus ring stays on the
drawn face, and the caller `style` applies to the face. A 44px or larger
`boxSize` sets the box as it does elsewhere. The
[app shell parts protocol](../../docs/protocol/app-shell-parts.md#touch-surfaces)
holds the requirements.
