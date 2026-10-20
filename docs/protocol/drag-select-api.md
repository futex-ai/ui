# Drag Select Option Reference

The option defaults, the state, the callback arguments, the helpers, and the
library gesture surfaces of `@firna/ui/drag-select` 5.0. The package's type
declarations give the exact types. The behavior behind them is in
[drag-select.md](drag-select.md).

## Option Defaults

`DragSelectableProvider` and `useDragSelectableOptions` both take these
options.

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
| `selectionScope`             | none                             | Names the page or view of an uncontrolled selection. A change clears the selection.        |
| `selectionAnnouncement`      | `"N items selected"`             | Live-region text for an applied proposal. An empty string announces nothing.               |
| `overlayZIndex`              | `DRAG_SELECTABLE_LAYERS.overlay` | The z-index of the box layer.                                                              |
| `marqueeLabel`               | `null`                           | Text in the top-left corner of the box. `null` shows no label.                             |
| `selectionLabel`             | `"N item"` / `"N items"`         | Badge text. `null` hides the badge.                                                        |
| `renderMarquee`              | none                             | Replaces the box, the label, and the badge.                                                |

The default announcement is `"Selection cleared"` for zero ids, else
`"1 item selected"` or `"N items selected"`. Both distances use the same
normalization: a negative value clamps to `0`, and a non-finite value falls
back to the default. `0` starts the drag on the first movement.

The provider also takes `accessibilityLabel`, `children`,
`defaultSelectedIds`, `role` (`"group"`, `"list"`, or `"none"`), `style`, and
`testID`. The page hook does not take them.

## State

The state of `useDragSelectableSelection()` and `useDragSelectableChanges()`
has these fields:

- `selectedIds`, `selectedCount`, and `selectedTargets`: the rendered
  selection.
- `matchingIds`, `matchingCount`, and `matchingTargets`: the targets that
  the hit box touches during a drag.
- `dragBox`: the full hit box in viewport coordinates, or `null`.
- `dragging`: whether a press is armed or a drag runs.
- `dragMode`: the mode of the active press, or `null`.

## Callback Arguments

`shouldStartDrag(start)` receives:

- `allowed` and `reason`: the answer of the default rules, and the reason of
  a refusal, or `null` when they allow the press.
- `element`: the pressed element.
- `targetId`: the registered target that contains the press, or `null`.
- `keys`: the modifier keys, and `mode`: the mode that `dragMode` gave, or
  `null` when it refused the press.
- `event`: the native `pointerdown`.

`onSelectedIdsChange(ids, change)` receives the proposed ids and a change
with:

- `source`: `drag` or `keyboard`.
- `mode`: the drag mode of the proposal.
- `hitIds`: the hits, in document order.
- `previousIds`: the rendered selection when the proposal was made.

`renderMarquee(marquee)` receives the drawn box in viewport coordinates,
the matching count, ids, and targets, and the drag mode.

## Helpers

- `useDragSelectableOptions(options)` sets options on the nearest provider
  while its component is mounted.
- `dragSelectableDefaultDragMode(keys)` is the default `dragMode`.
- `dragSelectableNextSelection(currentIds, hitIds, mode)` returns the
  proposal of a drag, in the order that the protocol gives.
- Spread `dragSelectableIgnoreProps` on a library primitive (`View`,
  `Pressable`, `Text`) and `dragSelectableIgnoreDomProps` on a raw DOM
  element. Both write `data-drag-select-ignore="true"`, so a press inside the
  element never starts a drag.
- `dragSelectableIdsEqual` compares two id lists in order. The provider
  compares selections as sets instead.
- `DRAG_SELECTABLE_LAYERS`, `dragSelectableOverlayClearsSurface`, and the
  geometry helpers `dragSelectableBox`, `dragSelectableBoundsForBox`,
  `dragSelectableIdsForBox`, `dragSelectableIntersectsBox`,
  `dragSelectablePointFromEvent`, `dragSelectableThresholdForValue`, and
  `hasDragSelectableMoved` serve apps that draw their own selection UI.

## Library Gesture Surfaces

Library components that own a pointer gesture carry the ignore marker on
their gesture root, so a page-wide provider never starts over them: the
calendar time-grid day columns and the month grid, the data grid with its
header, resize handles, and body, the kanban board, the sortable list, the
timeline ruler and track lanes, and the video-editor `NumberScrubber`. The
video-editor `Scrubber` and the timeline ruler are `slider`s on web, which
the field rule refuses. `useChartScrub` from `@firna/ui/chart` has no web
gesture, so it needs no marker. An app that uses its handlers on web adds
the marker itself.
