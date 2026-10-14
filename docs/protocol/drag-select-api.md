# Drag Select API Reference

The public types, option defaults, and helpers of `@firna/ui/drag-select`
5.0, the library gesture surfaces that carry the ignore marker, and the
tests that cover them. The behavior behind them is in
[drag-select.md](drag-select.md).

## Options And Provider Props

```ts
type DragSelectableDragMode = "replace" | "add" | "toggle";

type DragSelectableModifierKeys = {
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
};

type DragSelectableStartReason = "modifier" | "ignored" | "field" | "control";

type DragSelectableStart = {
  allowed: boolean; // the answer of the default rules
  reason: DragSelectableStartReason | null; // null when allowed
  element: Element; // the pressed element
  targetId: string | null; // the registered target that contains the press
  keys: DragSelectableModifierKeys;
  mode: DragSelectableDragMode | null; // from dragMode
  event: PointerEvent;
};

type DragSelectableSelectionChange = {
  source: "drag" | "keyboard";
  mode: DragSelectableDragMode;
  hitIds: string[]; // in document order
  previousIds: string[];
};

type DragSelectableMarquee = {
  box: DragSelectableBox; // viewport coordinates, clipped
  matchingCount: number;
  matchingIds: string[];
  matchingTargets: DragSelectableTargetSnapshot[];
  mode: DragSelectableDragMode;
};

type DragSelectableSelectionLabel = (
  count: number,
  context: DragSelectableSelectionLabelContext,
) => string | null;

type DragSelectableOptions = {
  autoScroll?: boolean;
  disabled?: boolean;
  dragMode?: (
    keys: DragSelectableModifierKeys,
  ) => DragSelectableDragMode | null;
  ignore?: string | readonly string[];
  marqueeLabel?: string | null;
  minimumControlDragDistance?: number;
  minimumDragDistance?: number;
  onSelectedIdsChange?: (
    ids: string[],
    change: DragSelectableSelectionChange,
  ) => void;
  onSelectionChange?: (selection: DragSelectableSelection) => void;
  overlayZIndex?: number;
  preventTextSelection?: boolean;
  renderMarquee?: (marquee: DragSelectableMarquee) => ReactNode;
  selectedIds?: readonly string[];
  selectionAnnouncement?: DragSelectableSelectionAnnouncement;
  selectionLabel?: DragSelectableSelectionLabel;
  shouldStartDrag?: (start: DragSelectableStart) => boolean;
  startFromControls?: boolean;
};

type DragSelectableProviderProps = DragSelectableOptions & {
  accessibilityLabel?: string;
  children: ReactNode;
  defaultSelectedIds?: readonly string[];
  role?: "group" | "list" | "none";
  style?: StyleProp<ViewStyle>;
  testID?: string;
};
```

`DragSelectableState` has the selection fields, the live matching fields,
`dragBox` (the full hit box in viewport coordinates, or `null`), `dragging`,
and `dragMode` (the mode of the active press, or `null`). The target hook,
its result, the selection and change hooks, the geometry helpers, and the
layer token keep their 4.x API.

## Option Defaults

| Option                       | Default                          | Meaning                                                                                    |
| ---------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `disabled`                   | `false`                          | No press arms, an active drag cancels, and keyboard changes are ignored.                   |
| `ignore`                     | none                             | CSS selectors, combined across layers. A press on or inside a match does not start a drag. |
| `startFromControls`          | `true`                           | A press on a control inside an enabled target can start a drag.                            |
| `minimumDragDistance`        | `4`                              | Pixels of movement before a drag starts.                                                   |
| `minimumControlDragDistance` | `10`                             | Pixels for a press on a control. The larger of the two distances applies.                  |
| `dragMode`                   | `dragSelectableDefaultDragMode`  | Maps the modifier keys to a mode, or to `null` for no drag.                                |
| `shouldStartDrag`            | none                             | Gives the final answer for each press that passes the fixed rules.                         |
| `preventTextSelection`       | `true`                           | Blocks text selection from the start of the drag to the release.                           |
| `autoScroll`                 | `true`                           | Scrolls the press's scroll container while the pointer is near its edges.                  |
| `selectedIds`                | none                             | Makes the selection controlled when it is defined.                                         |
| `onSelectedIdsChange`        | none                             | Receives each proposed selection.                                                          |
| `onSelectionChange`          | none                             | Receives each change of the rendered selection.                                            |
| `selectionAnnouncement`      | `"N items selected"`             | Live-region text for an applied proposal. An empty string announces nothing.               |
| `overlayZIndex`              | `DRAG_SELECTABLE_LAYERS.overlay` | The z-index of the box layer.                                                              |
| `marqueeLabel`               | `null`                           | Text in the top-left corner of the box. `null` shows no label.                             |
| `selectionLabel`             | `"N item"` / `"N items"`         | Badge text. `null` hides the badge.                                                        |
| `renderMarquee`              | none                             | Replaces the box, the label, and the badge.                                                |

The default announcement is `"Selection cleared"` for zero ids, else
`"1 item selected"` or `"N items selected"`. Both distances use the same
normalization: a negative value clamps to `0`, and a non-finite value falls
back to the default. `0` starts the drag on the first movement.

## Helpers

```ts
function useDragSelectableOptions(options: DragSelectableOptions): void;
function dragSelectableDefaultDragMode(
  keys: DragSelectableModifierKeys,
): DragSelectableDragMode | null;
function dragSelectableNextSelection(
  currentIds: readonly string[],
  hitIds: readonly string[],
  mode: DragSelectableDragMode,
): string[];
const dragSelectableIgnoreProps: { dataSet: { dragSelectIgnore: "true" } };
const dragSelectableIgnoreDomProps: { "data-drag-select-ignore": "true" };
```

- Spread `dragSelectableIgnoreProps` on a library primitive (`View`,
  `Pressable`, `Text`) and `dragSelectableIgnoreDomProps` on a raw DOM
  element. Both write `data-drag-select-ignore="true"`, so a press inside the
  element never starts a drag.
- `dragSelectableIdsEqual` stays exported and compares two id lists in
  order. The provider compares selections as sets instead.
- `DRAG_SELECTABLE_LAYERS`, `dragSelectableOverlayClearsSurface`, and the
  geometry helpers (`dragSelectableBox`, `dragSelectableBoundsForBox`,
  `dragSelectableIdsForBox`, `dragSelectableIntersectsBox`,
  `dragSelectablePointFromEvent`, `dragSelectableThresholdForValue`,
  `hasDragSelectableMoved`) keep their 4.x signatures.

## Library Gesture Surfaces

Library components that own a pointer gesture mark their gesture root with
`[data-drag-select-ignore]`, so a page-wide provider never starts over them:
the calendar time-grid day columns and the month grid, the data grid element
(header, resize handles, and body), the kanban board, the sortable list, the
timeline element that holds the ruler and the track lanes, and the
video-editor `NumberScrubber`. The video-editor `Scrubber` and the timeline
ruler are `slider`s on web, which the field rule already refuses. The chart
scrub hook (`useChartScrub`) is a native-only `PanResponder` with no web
gesture, so it needs no marker; an app that spreads its handlers on web adds
the marker itself.

## Tests

- Unit tests cover the geometry, the option merge and layers, the start
  rules and their reasons, the scrollbar rule, the anchor math, the session,
  the selection reports, `autoScrollDelta`, and the marked gesture surfaces.
- Browser tests in `tests/browser/drag-select*.spec.ts` cover the gesture on
  the "Page shell", "Empty page", "Nested providers", "Controlled
  selection", and "Custom marquee" stories. The earlier drag-select tests in
  `tests/browser/storybook.spec.ts` keep passing.
