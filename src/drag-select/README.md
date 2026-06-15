# Drag Select

Web drag-selection primitives for selectable rows, tiles, and other repeated
targets. The provider is native-safe, but the DOM drag gesture and marquee
overlay only run on web.

## Responsibilities

- Track registered selectable targets by stable id.
- Measure target bounds on web drag start and select every target intersecting
  the marquee box on pointer up.
- Expose final selection ids, selected target metadata, live matching ids, and
  live matching counts through hooks.
- Render a themed, page-level marquee overlay on web.
- Keep the marquee overlay above shared modal and dropdown surfaces, with an
  `overlayZIndex` escape hatch for consumers with custom stacking contexts.
- Ignore touch drags and nested interactive controls while still allowing a
  selectable target root to begin a drag.
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
  const target = useDragSelectableTarget({ data: row, id: row.id });
  return (
    <View ref={target.ref} style={target.selected ? selectedStyle : rowStyle}>
      <Text>{row.label}</Text>
    </View>
  );
}
```

Use `useDragSelectableSelection()` when a component only needs the current
state. Use `useDragSelectableChanges(listener)` when it needs to run an effect
after drag matches or final selections change. `state.matchingCount` and
`state.matchingIds` update while dragging; `state.selectedCount`,
`state.selectedIds`, and `state.selectedTargets` update when the drag finishes.

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

`overlayZIndex` can override the default `DRAG_SELECTABLE_LAYERS.overlay` value
when a consuming surface owns a higher portal layer.
