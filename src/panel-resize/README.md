# Panel resize

`PanelResizeHandle` changes the width of a side panel, on web and native. It
sits on the inner edge of the panel. The caller owns the width, the layout,
and the storage: the handle proposes each new width, and reports the end of
each change so the caller can store the width once.

## Responsibilities

- Propose widths from a pointer drag (web), a touch drag (native), the arrow
  keys and Home and End (web), and the increment and decrement accessibility
  actions (native). Keep every proposal inside the bounds that the caller
  gives.
- Follow a drag until release, also outside the handle, and let go of every
  listener, the page cursor, and the text-selection block when the drag ends,
  is cancelled, is turned off, or unmounts.
- Own its press, so a drag selection or a pressable around the panel does not
  start at the same time, and no text is selected during a drag.
- Expose a vertical `separator` on web, with its name, the width as its value,
  and the bounds, and an `adjustable` control on native.
- Show a short grip in the primary color under the pointer, during a drag,
  and with keyboard focus, with the shared focus glow around the grip. It
  never draws a full-height primary line along the panel.

## Usage

```tsx
import { PanelResizeHandle } from "@firna/ui/panel-resize";

const [width, setWidth] = useState(232);

<View style={{ width, borderRightWidth: 1, zIndex: 1 }}>
  <ProjectList />
  <PanelResizeHandle
    accessibilityLabel="Resize project list"
    edge="end"
    max={Math.min(360, layoutWidth - detailWidth - 240)}
    min={200}
    onChange={setWidth}
    onChangeEnd={storeSidebarWidth}
    value={width}
  />
</View>;
```

- `edge` is the edge of the panel that the handle sits on: `end` for a panel
  before the main content, `start` for a panel after it. Moving the handle
  away from the panel makes the panel wider.
- `min` and `max` are the effective bounds. Give a `max` that leaves room for
  the main content, because only the layout knows it.
- `onChange` receives each new width. `onChangeEnd` receives the width at the
  end of a drag, a key, or an accessibility action. A drag reports its last
  proposed width, and only when the width changed.
- `step` is the width change of one key or action, 16px by default. A key or
  an action at a bound changes nothing and reports nothing.
- `disabled` takes the handle out of the tab order and ends a drag in
  progress, as a release does.

The handle is 9px wide and reaches 5px past the panel edge, so its line sits on
the edge. Every library view is a stacking context, so on the `end` edge give
the panel a higher `zIndex` than the column that follows it; otherwise that
column covers the part of the handle past the edge. On native the handle also
takes 12px of hit slop on each side for a finger.

### Drawn states

Static HTML has no pointer or focus, so a drawing passes the shown styles
itself: `lineStyle={{ backgroundColor: theme.colors.border2 }}` and
`gripStyle={{ opacity: 1 }}` draw the hover and drag states, and adding
`focusRingStyleFor({ color: theme.colors.primary })` to `gripStyle` draws the
keyboard focus. The `Handle states` story shows each one.

## Accessibility

- Web: `role="separator"` with `aria-orientation="vertical"`, `aria-label`,
  `aria-valuenow`, `aria-valuemin`, and `aria-valuemax`, in the tab order.
  Left and Right move the handle one step in their direction, Home gives the
  minimum, and End gives the maximum. Handled keys do not reach the page.
- Native: `accessibilityRole="adjustable"` with the name and the width as its
  value; the increment and decrement actions change the width by one step.
- Keyboard focus shows the grip with the shared focus glow and follows the
  `focusIndicator` modes. With `none`, focus shows neither the grip nor a
  glow. A pointer press focuses the handle without the glow.

## Key Code

- `PanelResizeHandle.web.tsx` — the web separator: semantics, keys, hover,
  and the focus glow on the grip.
- `usePanelResizeDrag.ts` — the web drag lifecycle over the shared document
  listeners of `../dragGesture.ts`.
- `PanelResizeHandle.tsx` — the native handle: responder drag and
  accessibility actions.
- `panelResizeModel.ts` — the shared props and the pure width rules: bounds,
  drag direction, keys, and actions.
- `panelResizeStyles.ts` — the hit area, the line, and the short grip.

## Related Docs

- [App shell parts protocol](../../docs/protocol/app-shell-parts.md#panel-resize-handle).
- [Theming contract](../../docs/protocol/shared-ui-theming.md#theming-contract)
  for the focus-indicator modes.
