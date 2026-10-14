# Drag Select Protocol

## Status

Implementation contract for `@firna/ui/drag-select` 5.0. The
[drag select options plan](../../plans/drag-select-options.md) implements it.
The [drag select API reference](drag-select-api.md) lists the public types,
the option defaults, and the exported helpers.

## Purpose

`DragSelectableProvider` gives web rubber-band ("marquee") selection to
repeated targets such as rows and tiles. One provider can wrap one list, or
the scrolling main column of an app shell around every page. A page sets the
options of the nearest provider with `useDragSelectableOptions`. Native
renders the same provider and selection state, but has no drag gesture.

## Targets And Hooks

- A target registers by a stable id through the `ref` that
  `useDragSelectableTarget` returns. Registration ends when the node detaches.
- Spreading `target.a11yProps` makes the target a focusable `checkbox` with a
  roving tab stop, the shared CSS focus marker, and an accessible name
  (`label`, else `id`). The legacy `focusRingStyle` result field is always
  empty, so a consumer that still applies it never paints a second glow.
- `a11yProps` go on the registered root, or on a descendant of it when the
  row also holds other controls, because a `checkbox` must not contain a
  control. On web they write `data-drag-select-target` with the target id,
  and keyboard focus moves to the element that carries them.
- Keyboard: Space or Enter toggles the focused target. Arrow Up and Arrow Down
  move the roving focus, and Home and End jump to the ends. Shift with an
  arrow key selects the range from the focused target to the next one.
  Keyboard order is document order, with `order` as the tie-breaker.
- `useDragSelectableSelection()` and `useDragSelectableChanges(listener)`
  expose the state: `selectedIds`, `selectedCount`, `selectedTargets`,
  `matchingIds`, `matchingCount`, `matchingTargets`, `dragging`, `dragBox`,
  and `dragMode`. A listener runs after each state change.
- `matchingIds` and `matchingTargets` update while a drag runs. The selected
  fields change only through the selection rules below.
- The pure geometry helpers and the layer token stay exported and covered by
  unit tests.

## Option Precedence

- The provider and the page hook take the same `DragSelectableOptions`.
- Library defaults apply first. Provider props override them. Hook layers
  override provider props.
- Layers are ordered by the first render of the component that calls the
  hook. A later layer wins. A page that mounts after the shell wins, and in
  one render pass a child wins over its parent.
- A key whose value is `undefined` does not override.
- `ignore` is the exception: the provider combines the selectors of the
  provider props and of every layer.
- `useDragSelectableOptions` adds its layer on mount, updates it on each
  render, and removes it on unmount. It publishes in a layout effect (an
  ordinary effect during server rendering), so a changed `selectedIds` never
  paints a stale frame. It configures the nearest provider and does nothing
  outside a provider.
- A change to a non-function option re-renders the provider. Arrays compare
  element by element. The provider reads a function option when it calls
  it, so a new function identity alone re-renders nothing.
- `defaultSelectedIds` is read once, when the provider mounts.

## Start Rules

The web provider evaluates each `pointerdown` inside its element in this
order. A press that passes every rule arms the provider.

Fixed rules. No option overrides them.

1. An inner provider already claimed the press. Ignore it.
2. The provider is disabled, or no enabled target is registered. Ignore the
   press and do not claim it, so an outer provider can take it.
3. Claim the press on the native event.
4. Ignore `pointerType` `touch` and every `button` other than `0`.
5. Ignore a scrollbar press. The scroll container is the pressed element if
   it scrolls, else its nearest scrolling ancestor, else the document
   scrolling element. An element scrolls on an axis when its computed
   `overflow` on that axis is `auto`, `scroll`, or `overlay`, and its content
   overflows on that axis or it reserves scrollbar space on that axis.
   - Classic scrollbar: the point is inside the container's border box but
     outside its borders and outside its client area.
   - Overlay scrollbar: the container's content overflows on an axis, the
     container reserves no scrollbar space on that axis, and the point is
     within 16px of the far edge of its client area on that axis. The far
     edge is the right edge for vertical scrolling, the left edge when
     `direction` is `rtl`, and the bottom edge for horizontal scrolling. The
     rule does not apply when the container hides its scrollbar: its computed
     `scrollbar-width` is `none`, or it has the `data-hide-scrollbar`
     attribute that `ScrollView` writes.

Default rules. The first match sets `reason`, and `allowed` becomes `false`.
Rules 7 to 9 search the pressed element and its ancestors up to and
including the provider element.

6. `dragMode(keys)` returns `null`: `modifier`. The default mode is `null`
   when Control or Alt is held, else `add` for Shift, else `toggle` for Meta
   (Command), else `replace`.
7. The press is inside an element that matches `[data-drag-select-ignore]`
   or an `ignore` selector: `ignored`. An invalid selector matches nothing
   and gives one `devWarn` warning.
8. The press is inside a field: `field`. Fields are `input` elements other
   than the press types in rule 9, `textarea`, `select`, editable content
   (`[contenteditable]` other than `false`), the roles `textbox`, `searchbox`,
   `combobox`, `slider`, `spinbutton`, and `scrollbar`, and
   `[draggable='true']`.
9. The press is inside a control: `control`. A press on a control inside an
   enabled target is allowed instead when `startFromControls` is `true`.
   Controls are `a[href]`, `button`, `summary`, `label`, `input` of type
   `button`, `checkbox`, `image`, `radio`, `reset`, or `submit`, and the roles
   `button`, `link`, `checkbox`, `radio`, `switch`, `tab`, `menuitem`,
   `menuitemcheckbox`, `menuitemradio`, and `option`. A registered target's
   root element and the element that carries its `a11yProps` count as the
   target, not as a control, even with the `checkbox` role from
   `a11yProps`. The control search stops at the
   innermost registered target that contains the press, so a control that
   contains the target root is not searched.
10. `shouldStartDrag(start)`, when set, gives the final answer. When it
    allows a press that `dragMode` refused, the mode is `replace`.

The press's target is the innermost registered target whose root contains
the pressed element. A press on a control (rule 9 found one, whatever the
decision) needs the larger of `minimumDragDistance` and
`minimumControlDragDistance`. Any other press needs `minimumDragDistance`.

## Gesture

- Armed: the provider accepted the press. `state.dragging` is `true` and
  `state.dragMode` is the press mode. Nothing is measured, and no box is
  drawn. The provider does not call `preventDefault()` on the press, so
  focus, double-click, and triple-click keep their default behavior.
- From the accepted press to the release, the provider blocks native
  `dragstart`, so a link, an image, or highlighted text cannot start a native
  drag.
- Started: the pointer moved the threshold distance from the press point.
  The provider measures the enabled targets and draws the box. With
  `preventTextSelection`, it removes the text highlight, blocks
  `selectstart`, and sets `user-select: none` on the document element until
  the release, then restores the old value. A press without a start blocks
  no text selection. The start ends the library `Pressable` press that the
  same pointer started, so the control loses its pressed look and does not
  fire `onPress` on release. The start pushes an Escape layer and starts
  auto-scroll.
- Anchor: the start point stays attached to the content of the press's
  scroll container. A scroll of that container, or of any ancestor that
  moves it, moves the start point with the content (wheel, keyboard, or
  auto-scroll). The provider then measures the targets again. The hit test
  uses the full box from the anchored start point to the pointer.
- Release after a start: the provider measures the enabled targets again.
  The hits are the targets whose bounds intersect the full box, in document
  order. It proposes `dragSelectableNextSelection(current, hits, mode)` with
  source `drag`, and swallows the next `click` wherever it lands.
- Release before a start: no selection change and no swallowed click.
- Only the pointer that pressed moves and releases the drag. Other pointers
  are ignored, except that a `pointercancel` of any pointer cancels.
- Hard cancel, without a commit: `pointercancel`; a `blur` whose target is
  the window itself; `visibilitychange` to hidden; the provider unmounts. The
  provider stops at once and restores the page.
- Soft cancel, without a commit: Escape after a start (the shared Escape
  layer consumes the key, so a modal under the provider stays open), and
  `disabled` becoming `true`. The box disappears and `state.dragging` becomes
  `false` at once. Because the button is still down, the text-selection and
  native-drag blocks stay until the release, and the click after the release
  is swallowed when the drag had started.

## Auto-Scroll

After a start, with `autoScroll`, an animation-frame loop scrolls the press's
scroll container by 16px per frame on each axis where the pointer is within
36px of the container's visible edge or beyond it. These are the
`autoScrollDelta` values from `src/dragGesture.ts`, which the data grid
shares. The visible rectangle is the container's client area clipped to the
viewport, or the viewport for the document scrolling element. The loop stops
on release and on every cancel.

## Selection

- Selection ids are a set. The order of ids carries no meaning. The provider
  compares a proposal with the current selection as sets, and a controlled
  app may keep its ids in any order.
- `dragSelectableNextSelection` defines the order of its result: `replace`
  returns the hits. `add` returns the current ids, then the hits that are not
  current. `toggle` returns the current ids without the hits, then the hits
  that were not current. Duplicate ids appear once.
- Keyboard: Space or Enter proposes `toggle` with the focused target. Shift
  with an arrow key proposes `replace` with the range. The source is
  `keyboard`. A disabled provider ignores keyboard changes.
- The provider skips a proposal whose set equals the current set.
- Controlled, when the merged options define `selectedIds`: the provider
  stores nothing. It calls `onSelectedIdsChange(proposal, change)` and
  renders `selectedIds`. A proposal that the app does not apply changes
  nothing.
- Uncontrolled: the provider starts from `defaultSelectedIds`, applies each
  proposal, and also calls `onSelectedIdsChange`.
- Page change: when the last registered target unregisters, the provider
  clears its stored selection. In uncontrolled mode this changes the rendered
  selection, so `onSelectionChange` fires with an empty selection. The clear
  is not a proposal, so it is not announced and `onSelectedIdsChange` does
  not fire. A page in a shell starts with an empty selection. A filter or a
  reload that leaves zero rows also clears the selection.
- `onSelectionChange(selection)` fires when the rendered selection changes
  as a set, from any source. The initial selection does not fire it.
- Announcement: a proposal waits for the next change of the rendered
  selection. When that change makes the rendered selection equal to the
  proposal, the provider announces it through `selectionAnnouncement` (WCAG
  2.1 4.1.3). Otherwise it drops the proposal. A new proposal replaces a
  waiting one. So a change that the app makes on its own, and a proposal
  that the app changes or rejects, are not announced.
- `selectedTargets` is a snapshot of the registrations of the selected ids.
  The provider takes it when the rendered selection or the set of registered
  targets changes. An id with no registered target has `data: undefined`.
  Consumers that need live data map `selectedIds` through their own source.

## Box And Wrapper

- The box renders through a body-level portal as a fixed, non-interactive
  layer. Its z-index is `overlayZIndex`, else `DRAG_SELECTABLE_LAYERS.overlay`,
  which clears the modal and dropdown layers.
- The drawn box is the hit box clipped to the visible rectangle of the
  press's scroll container. No box renders when the clipped box is empty.
- The default box has the theme primary border, a 10% primary tint, the
  theme `sm` radius, and the `selectionLabel` badge at the bottom-right. It
  shows `marqueeLabel` in the top-left corner when the option is a string.
- `selectionLabel(count, context)` returns the badge text from the live
  matching count, ids, and target metadata. `null` hides the badge.
- `renderMarquee(marquee)` replaces the box, the label, and the badge. The
  provider still renders the fixed layer at the drawn box and puts the
  returned node inside it.
- The provider renders one element that takes `style` and `testID`, so a
  shell can use it as its main column. An explicit `role` wins, and `"none"`
  renders no role. Without `role`, the element has the `group` role when
  `accessibilityLabel` is set, and no role when it is not.

## Native

The native provider accepts every option and the page hook. It applies
`selectedIds` and `defaultSelectedIds` to `target.selected` and to the
selection state, and it follows the selection and page-change rules. It has
no drag gesture and no keyboard handler, so it ignores the gesture and box
options.

## Library Gesture Surfaces

Library components that own a pointer gesture mark their gesture root with
`[data-drag-select-ignore]`, so a page-wide provider never starts over them:
the calendar time grid and month grid, the data grid body, header, and
resize handles, kanban cards, sortable list items, the timeline tracks and
ruler, the video-editor `Scrubber` and `NumberScrubber`, and the chart scrub
layer. A surface that the field rule already covers needs no marker.

## Tests

- Unit tests cover the geometry, the selection reducer, the option merge,
  the start rules and their reasons, the scrollbar geometry, the anchor
  math, and `autoScrollDelta`.
- Browser tests in `tests/browser/drag-select.spec.ts` cover the gesture on
  the Storybook "Page shell", "Empty page", "Controlled selection", and
  "Custom marquee" stories. The earlier browser tests in
  `tests/browser/storybook.spec.ts` keep passing.
