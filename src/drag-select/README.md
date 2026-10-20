# Drag Select

Rubber-band ("marquee") selection for repeated rows, tiles, and other
targets. One `DragSelectableProvider` can wrap one list, or the scrolling
main column of an app shell around every page. Each page then sets the
options it needs with `useDragSelectableOptions`. The drag gesture and the
box run on web. Native renders the same provider and selection state without
a gesture.

The requirements are in
[the drag select protocol](../../docs/protocol/drag-select.md), and the
option defaults are in
[the option reference](../../docs/protocol/drag-select-api.md).

## Responsibilities

- Track registered targets by stable id, with keyboard and screen-reader
  selection on every target.
- Decide which presses can start a drag: fixed rules (touch, other buttons,
  scrollbars, no targets), default rules (modifier keys, ignored regions,
  fields, controls), and an app callback with the final answer.
- Run the drag: a movement threshold, a box anchored to the scrolled
  content, edge auto-scroll, blocked text selection and native drags, and a
  swallowed click after the release.
- Keep the selection, or let the app own it (`selectedIds` and
  `onSelectedIdsChange`).
- Render the themed box through a body-level portal above modal and dropdown
  surfaces, or the app's own box through `renderMarquee`.

## Page Shell

The shell makes its main column the provider, keeps it off by default, and
names the current page with `selectionScope`. A page turns the provider on
and configures it with the page hook:

```tsx
import {
  DragSelectableProvider,
  useDragSelectableOptions,
  useDragSelectableTarget,
} from "@firna/ui/drag-select";

function Shell({ page, route }) {
  return (
    <View style={styles.app}>
      <Sidebar />
      <DragSelectableProvider
        disabled
        selectionScope={route}
        style={styles.mainColumn}
      >
        {page}
      </DragSelectableProvider>
    </View>
  );
}

function TransactionsPage({ rows }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  useDragSelectableOptions({
    disabled: false,
    ignore: "[data-notes]",
    onSelectedIdsChange: (ids) => setSelectedIds(ids),
    selectedIds,
  });
  return rows.map((row) => <TransactionRow key={row.id} row={row} />);
}

function TransactionRow({ row }) {
  const target = useDragSelectableTarget({
    data: row,
    id: row.id,
    label: row.label,
  });
  // The row holds a button, so the checkbox semantics go on a child.
  return (
    <View ref={target.ref} style={target.selected ? selectedStyle : rowStyle}>
      <View {...target.a11yProps} style={styles.checkAndLabel}>
        <Text>{row.label}</Text>
      </View>
      <Button onPress={() => openRow(row.id)}>Open</Button>
    </View>
  );
}
```

- Hook layers override provider props, and a later layer wins. A key set to
  `undefined` does not override. `ignore` selectors combine across layers.
- The hook publishes before paint, so a changed `selectedIds` never shows a
  stale frame.
- A page may pass new callbacks on every render. The provider calls the
  current ones, and the box uses the current `renderMarquee` and
  `selectionLabel`, without a provider render.

## Controlled And Uncontrolled Selection

- Controlled: pass `selectedIds`. The provider stores nothing, sends each
  proposal to `onSelectedIdsChange(ids, change)`, and renders `selectedIds`.
  `change` has the `source` (`drag` or `keyboard`), the `mode`, the `hitIds`
  in document order, and the `previousIds`.
- Uncontrolled: omit `selectedIds`. The provider starts from
  `defaultSelectedIds`, applies each proposal, and still calls
  `onSelectedIdsChange`.
- Selection ids are a set. Their order carries no meaning, and an id listed
  twice in `selectedIds` or `defaultSelectedIds` counts once.
- A page that passes a restored selection through the page hook starts with
  it: the provider does not report that starting selection as a change.
- Scope: when `selectionScope` changes, the uncontrolled selection clears,
  so each page in a shell starts empty, even when two pages show the same
  records.
- With or without a scope, the selection clears when the last target
  unregisters and none of the selected rows registers again in the same task.
  Without a scope, this rule clears the selection on a page change. A filter
  or a reload that leaves zero rows also clears it. React's development
  double mount keeps it, because the same rows register again at once.
- `onSelectionChange(selection)` fires when the rendered selection changes.
  A proposal is announced (WCAG 2.1 4.1.3) only when the rendered selection
  becomes that proposal, so a rejected proposal stays silent.

## Options

| Option                       | Default                  | Use                                                    |
| ---------------------------- | ------------------------ | ------------------------------------------------------ |
| `disabled`                   | `false`                  | Turn the provider off. An active drag cancels.         |
| `ignore`                     | none                     | CSS selectors where a press never starts a drag.       |
| `startFromControls`          | `true`                   | Let a press on a control inside a row start a drag.    |
| `minimumDragDistance`        | `4`                      | Pixels of movement before the drag starts.             |
| `minimumControlDragDistance` | `10`                     | Pixels for a press on a control.                       |
| `dragMode`                   | Shift adds, Meta toggles | Map modifier keys to a mode, or to `null` for no drag. |
| `shouldStartDrag`            | none                     | Final answer for each press, with the default answer.  |
| `preventTextSelection`       | `true`                   | Block text selection during a drag.                    |
| `autoScroll`                 | `true`                   | Scroll the container near its edges during a drag.     |
| `selectedIds`                | none                     | Own the selection (controlled).                        |
| `onSelectedIdsChange`        | none                     | Receive each proposed selection.                       |
| `onSelectionChange`          | none                     | Receive each change of the rendered selection.         |
| `selectionScope`             | none                     | Name the page, so a new page starts empty.             |
| `selectionAnnouncement`      | `"N items selected"`     | Live-region text. Return `""` to stay silent.          |
| `overlayZIndex`              | the overlay layer token  | Raise the box above a custom stacking context.         |
| `marqueeLabel`               | `null`                   | Text in the top-left corner of the box.                |
| `selectionLabel`             | `"N items"`              | Badge text. Return `null` to hide the badge.           |
| `renderMarquee`              | none                     | Draw your own box inside the fixed layer.              |

Provider-only props: `accessibilityLabel`, `children`, `defaultSelectedIds`,
`role` (`"group"`, `"list"`, or `"none"`), `style`, and `testID`.

## Start Rules

A press inside the provider starts nothing when the provider is disabled or
has no enabled target, for touch and for every button but the main one, and
on a scrollbar (classic, or a 16px overlay zone at the far edge of a
container whose scrollbar takes no space). Then the default rules refuse:

- Control or Alt held (`modifier`). Shift adds and Meta (Command) toggles.
- A press inside `[data-drag-select-ignore]` or an `ignore` selector
  (`ignored`).
- A press inside a field: a text input, `textarea`, `select`, editable
  content, a slider, a spin button, a combobox, or a draggable element
  (`field`).
- A press on a control (a link, button, label, checkbox, radio, switch, tab,
  menu item, or option) outside an enabled row (`control`). A control inside
  a row can start a drag after `minimumControlDragDistance`, and a press
  without movement still activates it.

`shouldStartDrag(start)` receives the default answer (`start.allowed`,
`start.reason`) and returns the final one.

Mark any region where a press must never start a drag with the ignore
marker. The library's own gesture surfaces carry it already: the data grid,
the calendar time grid and month grid, the kanban board, the sortable list,
the timeline ruler and lanes, and `NumberScrubber`. The video-editor
`Scrubber` is a `slider`, which the field rule refuses.

```tsx
import {
  dragSelectableIgnoreDomProps,
  dragSelectableIgnoreProps,
} from "@firna/ui/drag-select";

<View {...dragSelectableIgnoreProps}>…</View>;
<div {...dragSelectableIgnoreDomProps}>…</div>;
```

## During And After A Drag

- The box follows the scrolled content: a wheel or keyboard scroll during
  the drag keeps the start point on the row where it started.
- Near the edge of the scroll container, the container scrolls by itself, on
  the axes where its overflow lets it scroll.
- Text does not highlight during a drag. A double-click or a triple-click
  still selects text, because a press without movement blocks nothing.
- A drag that started on a row `Button` ends that button's press, so it does
  not fire `onPress`.
- After the release, the provider swallows the click, so a drag never opens
  a row. A plain click is not swallowed.
- Escape cancels a started drag without a change. `pointercancel`, a window
  blur, and a hidden page also cancel it.

## Box

The default box has the theme primary border and a light tint, with the
`selectionLabel` badge at the bottom-right. `marqueeLabel` adds a label in
the top-left corner, and a `selectionLabel` that returns `null` hides the
badge. `renderMarquee` draws your own box: the provider still renders the
fixed, non-interactive layer at the box (clipped to the visible part of the
scroll container) and puts your node inside it. A straight drag, with no
width or no height, draws its box as a line.

```tsx
<DragSelectableProvider
  renderMarquee={({ matchingCount, mode }) => (
    <View style={styles.myBox}>
      <Text>{`${matchingCount} rows · ${mode}`}</Text>
    </View>
  )}
>
  {rows}
</DragSelectableProvider>
```

## Accessibility

- Spread `target.a11yProps` onto the target's outer `View`. It makes the
  target a focusable `checkbox` with the right state, an accessible name
  (`label`, else `id`), the shared focus marker, and a roving tab stop.
- A row that also holds a button or a link keeps `target.ref` on the row and
  spreads `target.a11yProps` on a child, such as the check box and the label,
  because a `checkbox` must not contain another control. Keyboard focus
  follows the element with the `a11yProps`.
- **Space / Enter** toggles the focused target. **Arrow Up/Down** moves the
  focus, and Home/End jump to the ends. **Shift + Arrow** selects a range.
- `target.focusRingStyle` is always empty and exists only so older code
  compiles.
- Give the provider an `accessibilityLabel` so the collection is a named
  `group` (or pass `role="list"`). Without a name the wrapper has no role, so
  a page-wide provider adds nothing to the accessibility tree. `role="none"`
  renders no role and drops `accessibilityLabel`, because an element with
  no role cannot have a name.
- Pair the selected state with a non-color affordance such as a check glyph
  (WCAG 2.1 1.4.1). The state is exposed through `aria-checked`, so mark the
  glyph `aria-hidden`.

## State Hooks

`useDragSelectableSelection()` returns the state. `useDragSelectableChanges(listener)`
also runs `listener` after each change. `matchingCount`, `matchingIds`, and
`matchingTargets` update during a drag. `selectedCount`, `selectedIds`, and
`selectedTargets` follow the rendered selection. `dragging` and `dragMode`
describe the active press, and `dragBox` is the hit box in viewport
coordinates. `selectedTargets` is a snapshot of the registrations, with the
target `data` current when the selection or the set of targets last changed;
use `selectedIds` to read fresh row data from the app's own source.

## Key Code

- `DragSelectableProvider.web.tsx` and `DragSelectableProvider.tsx`: the web
  and native providers.
- `DragSelectableContext.tsx`: the context and the target, selection, and
  change hooks. `useDragSelectableTargetKeys.ts` holds the keyboard model.
- `useDragSelectableOptions.ts`, `useDragSelectableOptionLayers.ts`,
  `dragSelectableLayerStore.ts`, and `dragSelectableOptions.ts`: the page
  hook, the layers, the merge, and the defaults. `dragSelectableOptionTypes.ts`
  holds the public option types.
- `useDragSelectableGesture.ts`: the web gesture. `dragSelectablePress.ts`
  holds the claim and the fixed rules, `dragSelectableStartRules.ts` the
  default rules, `dragSelectableSession.ts` one gesture from the press to the
  release, and `dragSelectableSessionDom.ts` its DOM listeners.
  `dragSelectableTextSelection.ts` blocks text selection during a drag.
- `dragSelectableScrollContainer.ts`, `dragSelectableScrollAxes.ts`,
  `dragSelectableScrollbar.ts`, and `dragSelectableScrollAnchor.ts`: the
  press's scroll container, the axes it can scroll, the scrollbar rule, and
  the anchored start point.
- `useDragSelectableSelectionState.ts` and `dragSelectableSelectionModel.ts`:
  the selection, its modes, and its scope. `useDragSelectableSelectionReport.ts`
  reports and announces its changes and spots a page's starting selection.
- `useDragSelectableRegistry.ts`, `dragSelectableTargetOrder.ts`, and
  `dragSelectableTargetNode.ts`: the registered targets, their document
  order, and the element that takes their focus.
- `useDragSelectableCore.ts`: the options, registry, and selection that
  both providers share.
- `dragSelectableAutoScroll.ts`: the edge auto-scroll loop.
- `dragSelectableIgnore.ts`: the ignore marker.
- `DragSelectableOverlay.web.tsx` and `dragSelectableOverlayTypes.ts`: the
  box, which reads its options live. `dragSelectableRole.ts`: the provider
  element's role and name.
- Tests: `tests/unit/dragSelect*.test.ts` for the rules and the geometry,
  `tests/unit/staticDragSelect.test.ts` for the built package, and
  `tests/browser/drag-select*.spec.ts` for the gesture on the "Drag
  Select/Examples" stories.
