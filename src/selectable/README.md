# Selectable

Provider and hooks for observing browser text selections that intersect a known
set of DOM elements. Use it when a product screen needs to react to copied or
highlighted table rows, cards, transcript spans, or other selectable content.

## Responsibilities

- Listen to browser selection changes from one provider boundary.
- Match the current selection against a CSS selector, defaulting to
  `[data-selectable-id]`.
- Report the selected count, selected ids, selected DOM elements, and selected
  text through context.
- Let consumers subscribe to selection updates without adding their own document
  listeners.
- Render as a native-safe no-op outside web so shared screens can keep one
  component tree.

## Usage

```tsx
import {
  SelectableProvider,
  useSelectableSelectionChange,
} from "@firna/ui/selectable";

function InvoiceTable({ children }: { children: React.ReactNode }) {
  return (
    <SelectableProvider selector="[data-invoice-row-id]">
      {children}
      <SelectionSummary />
    </SelectableProvider>
  );
}

function SelectionSummary() {
  const selection = useSelectableSelectionChange((nextSelection) => {
    console.log(nextSelection.selectedCount, nextSelection.selectedIds);
  });

  return <Text>{selection.selectedCount} rows selected</Text>;
}
```

By default, ids are read from `data-selectable-id`, falling back to `id`. Pass
`getElementId` when the screen uses a different DOM attribute:

```tsx
<SelectableProvider
  getElementId={(element) => element.getAttribute("data-invoice-row-id")}
  selector="[data-invoice-row-id]"
>
  {children}
</SelectableProvider>
```

Use `useSelectableSelection()` when a component only needs the latest snapshot
and does not need callback-style change notification.

## Scope

The provider observes text/range selections exposed by the browser Selection
API. It does not render selection styling, make elements focusable, or implement
drag-to-select grids. On native platforms the provider reports an empty
selection and never subscribes to DOM events.
