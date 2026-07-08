# Drag Select

Web drag-selection primitives for selectable rows, tiles, and other repeated
targets. The provider is native-safe, but the DOM drag gesture and marquee
overlay only run on web.

## Responsibilities

- Track registered selectable targets by stable id.
- Measure target bounds on web drag start and select every target intersecting
  the marquee box on pointer up.
- Keep clicks and short pointer movement from starting the visible marquee or
  committing a selection. The default threshold is `4px`.
- Expose final selection ids, selected target metadata, live matching ids, and
  live matching counts through hooks.
- Render a themed, page-level marquee overlay on web.
- Keep the marquee overlay above shared modal and dropdown surfaces, with an
  `overlayZIndex` escape hatch for consumers with custom stacking contexts.
- Ignore touch drags and nested interactive controls while still allowing a
  selectable target root to begin a drag.
- Cancel interrupted pointer streams without committing a partial selection.
- Keep a native fallback that renders children and registers no selections.

## Usage

```tsx
import {
  DragSelectableProvider,
  useDragSelectableChanges,
  useDragSelectableTarget,
} from "@firna/ui/drag-select";

function LedgerRows({ rows }) {
  return (
    <DragSelectableProvider>
      <SelectionListener />
      {rows.map((row) => (
        <LedgerRow key={row.id} row={row} />
      ))}
    </DragSelectableProvider>
  );
}

function SelectionListener() {
  useDragSelectableChanges((state) => {
    console.log(state.selectedCount, state.selectedIds);
  });
  return null;
}

function LedgerRow({ row }) {
  const target = useDragSelectableTarget({
    data: row,
    id: row.id,
    label: row.label,
  });
  return (
    <View
      {...target.a11yProps}
      ref={target.ref}
      style={[
        target.selected ? selectedStyle : rowStyle,
        target.focused ? target.focusRingStyle : null,
      ]}
    >
      <Text>{row.label}</Text>
    </View>
  );
}
```

## Accessibility

The marquee is a pointer-only gesture, so every selectable target also exposes a
keyboard-and-screen-reader path (WCAG 2.1 — 2.5.1 Pointer Gestures, A; 2.1.1
Keyboard, A; 4.1.2 Name, Role, Value, A):

- Spread `target.a11yProps` onto the target's outer `View`. This makes it a
  focusable `checkbox` with the correct `accessibilityRole`,
  `accessibilityState.checked/disabled`, accessible name (`options.label`,
  defaulting to `id`), and roving `tabIndex` (the group is a single Tab stop).
- **Space / Enter** toggles the focused target. **Arrow Up/Down** moves the
  roving focus (Home/End jump to the ends). **Shift + Arrow** extends the
  selection as a contiguous range.
- Apply `target.focusRingStyle` when `target.focused` is true for a visible
  keyboard-focus indicator (WCAG 2.1 — 2.4.7 Focus Visible, AA).
- Set `accessibilityLabel` (and optionally `role="list"`) on the provider so the
  collection is announced as a named group (WCAG 2.1 — 1.3.1, A).
- Each committed selection change is announced to assistive tech through a
  polite live region (WCAG 2.1 — 4.1.3 Status Messages, AA). Customize the text
  with `selectionAnnouncement`, or return an empty string to silence it.
- Do not convey the selected state with background color alone — pair it with a
  non-color affordance such as a check glyph or border (WCAG 2.1 — 1.4.1, A).
  The state itself is exposed via `aria-checked`, so the glyph should be
  `aria-hidden`.

Use `useDragSelectableSelection()` when a component only needs the current
state. Use `useDragSelectableChanges(listener)` when it needs to run an effect
after drag matches or final selections change. `state.matchingCount` and
`state.matchingIds` update while dragging; `state.selectedCount`,
`state.selectedIds`, and `state.selectedTargets` update when the drag finishes.
`state.selectedTargets` is a selection-time metadata snapshot. Use
`state.selectedIds` to look up fresh row data from the consuming app's current
data source.

`selectionLabel` customizes the badge text in the marquee overlay. It receives
the live matching count plus matching ids and target metadata:

```tsx
<DragSelectableProvider
  selectionLabel={(count, { matchingIds }) =>
    `${count} transactions (${matchingIds.join(", ")})`
  }
>
  {children}
</DragSelectableProvider>
```

`accessibilityLabel` names the container group, and `role` (`"group"` default or
`"list"`) sets its ARIA role. `selectionAnnouncement(count, selection)` builds
the polite live-region message spoken whenever the committed selection count
changes.

`overlayZIndex` can override the default `DRAG_SELECTABLE_LAYERS.overlay` value
when a consuming surface owns a higher portal layer.

`minimumDragDistance` customizes how far the pointer must move before live
matching, the marquee overlay, and final selection can begin. Pass `0` to start
selection as soon as the pointer moves; negative values are clamped to `0`;
non-finite values fall back to the default `4px`.

```tsx
<DragSelectableProvider minimumDragDistance={16}>
  {children}
</DragSelectableProvider>
```
