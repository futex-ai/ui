# Drag Select Protocol

## Status

Implemented requirements for `@firna/ui/drag-select` 5.0. The
[selection rules](drag-select-selection.md) say how a drag or a key changes
the selection. The [option reference](drag-select-api.md) gives the option
defaults, the state, the helpers, and the library surfaces that carry the
ignore marker.

## Purpose

`DragSelectableProvider` gives web rubber-band ("marquee") selection to
repeated targets such as rows and tiles. One provider can wrap one list, or
the scrolling main column of an app shell around every page. A page sets the
options of the nearest provider with `useDragSelectableOptions`. Native
renders the same provider and selection state, but has no drag gesture.

## Targets And Hooks

- A target registers with a stable id through the `ref` that
  `useDragSelectableTarget` returns. It leaves when that element leaves.
- Spreading `target.a11yProps` makes the target a focusable `checkbox` with a
  roving tab stop, the shared focus marker, and an accessible name: `label`,
  else `id`. `target.focusRingStyle` is always empty, so a consumer that
  applies it never paints a second glow.
- `a11yProps` go on the registered root, or on a descendant of it when the
  row also holds other controls, because a `checkbox` must not contain a
  control. Keyboard focus moves to the element that carries them. On web,
  that element has `data-drag-select-target` with the target id.
- Keyboard: Space or Enter toggles the focused target. Arrow Up and Arrow Down
  move the roving focus, and Home and End jump to the ends. Shift with an
  arrow key selects the range from the focused target to the next one.
  Keyboard order is document order, with `order` as the tie-breaker.
- `useDragSelectableSelection()` and `useDragSelectableChanges(listener)`
  expose the state that the option reference lists. A listener runs after
  each state change. The matching fields update while a drag runs, and the
  selected fields change only through the
  [selection rules](drag-select-selection.md).

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
- `useDragSelectableOptions` adds its layer when its component mounts,
  updates it on each render, and removes it on unmount. A page's options
  apply before the browser paints, so a changed `selectedIds` never shows a
  stale frame. The hook configures the nearest provider and does nothing
  outside a provider.
- The provider always uses the newest value of every option. That includes
  callbacks and render functions whose identity changes on each render.
- `defaultSelectedIds` is read once, when the provider mounts.

## Start Rules

The web provider ignores a press outside its element, such as a press in
content that a portal draws elsewhere, and does not take it. Decision: the
provider checks containment, rather than marking each portal with the ignore
marker, because an app's own portals carry none. It checks each press inside
its element in this order. A press that passes every rule arms the provider.

Fixed rules. No option overrides them.

1. An inner provider took the press. Ignore it.
2. The provider is disabled, or no enabled target is registered. Ignore the
   press, so that an outer provider can take it.
3. Take the press, so that no outer provider takes it.
4. Ignore `pointerType` `touch` and every `button` other than `0`.
5. Ignore a scrollbar press. The scroll container is the pressed element if
   it scrolls, else its nearest scrolling ancestor, else the document. An
   element scrolls on an axis when its computed `overflow` on that axis is
   `auto`, `scroll`, or `overlay`, and its content overflows on that axis or
   it reserves scrollbar space on that axis. `<body>` counts like any other
   element, except when the viewport takes its overflow. The viewport takes
   the overflow of `<body>` when the root element's computed `overflow` is
   `visible` on both axes, and then the document scrolls. Decision: one rule
   names the element whose overflow the viewport takes, rather than always
   treating `<body>` as the document, because a page can scroll `<body>`
   while the root hides its overflow.
   - Classic scrollbar: the point is inside the container's border box but
     outside its borders and outside its client area.
   - Overlay scrollbar: the content overflows on an axis that the container
     can scroll, the container reserves no scrollbar space on that axis, and
     the point is within 16px of the far edge of its client area on that
     axis: the right edge for vertical scrolling, the left edge when
     `direction` is `rtl`, and the bottom edge for horizontal scrolling. The
     rule does not apply when the container hides its scrollbar: its computed
     `scrollbar-width` is `none`, or it is a library `ScrollView` that hides
     its scroll indicators.

Default rules. The first match sets `reason`, and `allowed` becomes `false`.
Rules 7 to 9 search the pressed element and its ancestors up to and
including the provider element.

6. `dragMode(keys)` returns `null`: `modifier`. The default mode is `null`
   when Control or Alt is held, else `add` for Shift, else `toggle` for Meta
   (Command), else `replace`.
7. The press is inside an element that matches `[data-drag-select-ignore]`
   or an `ignore` selector: `ignored`. An invalid selector matches nothing
   and gives one development warning.
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
   `menuitemcheckbox`, `menuitemradio`, and `option`. A target's root element
   and the element that carries its `a11yProps` count as the target, not as a
   control, even with the `checkbox` role. The control search stops at the
   press's target, so a control that contains the target root does not count.
10. `shouldStartDrag(start)`, when set, gives the final answer. When it
    allows a press that `dragMode` refused, the mode is `replace`.

The press's target is the innermost registered target whose root contains
the pressed element. A press on a control (rule 9 found one, whatever the
decision) needs the larger of `minimumDragDistance` and
`minimumControlDragDistance`. Any other press needs `minimumDragDistance`.

## Gesture

- Armed: the provider accepted the press. `state.dragging` is `true`,
  `state.dragMode` is the press mode, and no box is drawn yet. Focus,
  double-click, and triple-click keep their default browser behavior.
- From the accepted press to the release, no native drag starts from a
  link, an image, or highlighted text.
- Started: the pointer moved the threshold distance from the press point,
  and the provider draws the box. With `preventTextSelection`, the start
  removes any text highlight, and no text highlights until the release. A
  press without a start blocks no text selection. The start ends the library
  `Pressable` press that the same pointer started, so the control loses its
  pressed look and does not fire `onPress` on release. The control's
  `onPressOut` receives the pointer event that started the drag.
- Anchor: the start point stays attached to the content of the press's
  scroll container. A scroll of that container, or of any ancestor that
  moves it, moves the start point with the content. The hit box runs from
  the anchored start point to the pointer.
- Release after a start: the hits are the enabled targets whose bounds touch
  the hit box, in document order. The provider proposes
  `dragSelectableNextSelection(current, hits, mode)` with source `drag`, and
  swallows the next `click` wherever it lands.
- Release before a start: no selection change and no swallowed click.
- Only the pointer that pressed moves and releases the drag. Other pointers
  are ignored, except that a `pointercancel` of any pointer cancels.
- Hard cancel, without a commit: `pointercancel`, a `blur` of the window
  itself, `visibilitychange` to hidden, or an unmount. The provider stops at
  once and restores the page.
- Soft cancel, without a commit: Escape after a start, and `disabled`
  becoming `true`. The Escape key reaches no other Escape handler, so a modal
  under the provider stays open. The box disappears and `state.dragging`
  becomes `false` at once. Until the release, text still does not highlight
  and no native drag starts. The click after the release is swallowed when
  the drag had started.

## Auto-Scroll

After a start, with `autoScroll`, the press's scroll container scrolls 16px
each frame on each axis where the pointer is within 36px of the container's
visible edge or beyond it. It never scrolls an axis that the container
cannot scroll. For an element, that is an axis whose computed `overflow` is
not `auto`, `scroll`, or `overlay`. For the document, it is an axis whose
viewport `overflow` is `hidden` or `clip`. The visible edge is the edge of
the container's client area clipped to the viewport, or of the viewport for
the document. Auto-scroll stops on release and on every cancel.

## Box And Wrapper

- The box renders through a body-level portal as a fixed, non-interactive
  layer with the `data-drag-select-marquee` attribute. Its z-index is
  `overlayZIndex`, else `DRAG_SELECTABLE_LAYERS.overlay`, which clears the
  modal and dropdown layers.
- The drawn box is the hit box cut to the visible rectangle of the press's
  scroll container. The box of a straight drag, which has no width or no
  height, still draws, as a line. No box draws when the hit box and the
  visible rectangle do not touch. Decision: a straight drag draws a line,
  rather than a box widened to at least 1px, so the drawn box that
  `renderMarquee` receives stays the cut hit box.
- The default box has the theme primary border, a 10% primary tint, the
  theme `sm` radius, and the `selectionLabel` badge at the bottom-right. It
  shows `marqueeLabel` in the top-left corner when the option is a string.
- `selectionLabel(count, context)` returns the badge text from the live
  matching targets. `null` hides the badge.
- `renderMarquee(marquee)` replaces the box, the label, and the badge. The
  provider still renders the fixed layer at the drawn box and puts the
  returned node inside it.
- The provider renders one element that takes `style` and `testID`, so a
  shell can use it as its main column. An explicit `role` wins. `"none"`
  renders no role and no accessible name: the provider drops
  `accessibilityLabel`, because an element without a role cannot be named.
  Without `role`, the element has the `group` role when `accessibilityLabel`
  is set, and no role when it is not.

## Native

The native provider accepts every option and the page hook. It applies
`selectedIds`, `defaultSelectedIds`, and `selectionScope` to
`target.selected` and to the selection state, and it follows the
[selection rules](drag-select-selection.md). It has no drag gesture and no
keyboard handler, so it ignores the gesture and box options.
