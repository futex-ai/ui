# Popover

An anchored content popover for React Native and React Native Web. It opens a
floating surface next to a trigger to show arbitrary content — details, help
text, a small form, a colour picker — without selecting a value.

`Popover` is the non-selecting sibling of `DropdownSelector`. It reuses the same
overlay foundation rather than reimplementing it: `DropdownPortal` provides
anchor measurement, viewport-aware placement (flipping above the trigger when
there is no room below and clamping height), the non-modal `pointer-events:
box-none` web portal layer, native modal-backing, and outside-click / Escape
dismissal. `Popover` adds only the open-state controller and the trigger props.

## Responsibilities

- Anchor a content surface to a measured trigger and keep it on screen.
- Stay above tables, forms, sidebars, and modals via `DROPDOWN_LAYERS`.
- Close on outside press and Escape (web) or scrim tap / back button (native).
- Support controlled (`open` + `onOpenChange`) and uncontrolled (`defaultOpen`)
  open state.
- Report expanded state, the kind of overlay (`aria-haspopup`), and the
  controlled surface id (`aria-controls`) to assistive tech through the trigger
  props.
- Name the surface (`label`) and relate it to the trigger, and — on web —
  manage focus order: focus moves into the surface on open and back to the
  trigger on close.
- Serve the trigger-less case too: `ContextMenu` opens at a gesture's point
  rather than against a measured element, so a right-click or long-press menu
  lands under the pointer instead of at the edge of whatever was pressed.

## Usage

```tsx
import { Popover } from "@firna/ui/popover";

<Popover
  minWidth={240}
  trigger={({ open, triggerProps }) => (
    <Pressable
      {...triggerProps}
      accessibilityLabel="Account details"
      accessibilityRole="button"
      style={[styles.button, open && styles.buttonOpen]}
    >
      <Text>Details</Text>
    </Pressable>
  )}
>
  {({ close }) => (
    <View style={styles.content}>
      <Text style={styles.title}>Greenhouse Studio</Text>
      <Text style={styles.body}>Standard VAT scheme · GBP</Text>
      <Pressable accessibilityRole="button" onPress={close}>
        <Text style={styles.link}>Close</Text>
      </Pressable>
    </View>
  )}
</Popover>;
```

The `trigger` render prop receives `{ open, toggle, close, triggerProps }`.
Spread `triggerProps` onto a `Pressable` to toggle the popover and report its
`aria-expanded` state to assistive tech; `open`, `toggle`, and `close` let you
drive and reflect it manually. The `children` body may be a plain node or a
render function receiving `{ close, placement }`, where `placement.maxHeight` is
the room available before the surface would leave the viewport. The surface
clamps to that height and clips overflow, so wrap taller content in a
`ScrollView` to keep it scrollable.

### Controlled

```tsx
const [open, setOpen] = useState(false);

<Popover open={open} onOpenChange={setOpen} trigger={/* … */}>
  {/* … */}
</Popover>;
```

## Accessibility

The popover is **press-triggered** and **non-modal**: it dismisses on outside
press and Escape (`DropdownPortal` owns both), so the hover/focus-reveal rules of
WCAG 1.4.13 do not apply to the default model.

- **Name & role (4.1.2).** Pass `label` to expose the surface as a named
  `dialog` (default) or `region`/`tooltip` via `role`. Without a `label` the
  surface stays a plain, role-less container so an unnamed landmark is never
  announced.
- **Trigger relationship (1.3.1).** `triggerProps` carries `aria-expanded`,
  `aria-haspopup` (`"dialog"` for a dialog, otherwise `"true"`), and — while open
  — `aria-controls` pointing at the surface. Spread it onto your `Pressable`;
  these are flat top-level props so a consumer `accessibilityState` cannot
  clobber them.
- **Focus order (2.4.3, web).** On open, focus moves into the surface (the
  container, or `initialFocusRef` if given) so the keyboard and screen reader
  land inside the popover; on close, focus returns to the trigger. The surface
  shows a focus ring (2.4.7) when it itself holds focus. Pass
  `manageFocus={false}` — or use `role="tooltip"` — for a supplemental hint that
  must not steal focus.

```tsx
<Popover
  label="Account details"
  role="dialog"
  minWidth={240}
  trigger={({ open, triggerProps }) => (
    <Pressable
      {...triggerProps}
      accessibilityLabel="Account details"
      accessibilityRole="button"
      style={[styles.button, open && styles.buttonOpen]}
    >
      <Text>Details</Text>
    </Pressable>
  )}
>
  {({ close }) => <AccountCard onClose={close} />}
</Popover>
```

## Sizing and placement

The trigger is wrapped in a self-hugging `View` (`alignSelf: "flex-start"`) so a
small trigger keeps a small anchor. Because the surface width follows the anchor
(clamped to `minWidth`), pass `minWidth` to size content popovers. For a compact
surface below a wider trigger, pass `anchorWidthAsMinimum={false}` together with
explicit `minWidth` / `maxWidth` bounds. The placement options — `align`,
`anchorWidthAsMinimum`, `gutter`, `margin`, `maxHeight`, `maxWidth`, `minHeight`,
and `minWidth` — are forwarded straight to `DropdownPortal`. Pass `style` to
change how the wrapper lays out (for example `alignSelf: "stretch"` to match the
trigger to its parent width).

The portal defaults to the high shared dropdown layer
(`DROPDOWN_LAYERS.portal`, currently `1_000_000`). Pass `zIndex` to `Popover`
when a consuming screen owns an even higher stacking context:

```tsx
<Popover minWidth={240} trigger={renderTrigger} zIndex={2_000_000}>
  <DetailsCard />
</Popover>
```

## ResponsivePopover

`ResponsivePopover` is a controlled, externally-anchored surface that **adapts by
platform**: the anchored popover on web, a [`Sheet`](../sheet/README.md) bottom
sheet on native, behind one API. Unlike `Popover` (which owns its trigger via a
render prop and manages its own open state), `ResponsivePopover` takes an
external `anchorRef` and controlled `open`/`onClose`, so it drops in where a
consumer already renders the trigger and owns visibility.

On web it composes the shared `DropdownPortal` (viewport-aware placement,
non-modal `box-none` layer, outside-press/Escape dismissal) with `PopoverSurface`
(role `dialog`, accessible name from `label`, focus into the surface on open and
back to the anchor on close) — the same a11y as `Popover`, since it lives in the
shared surface. On native the same body renders in a bottom sheet. The one
render-prop contract works on both platforms; only `layout` (`"popover"` vs
`"sheet"`) and the web-only `placement` differ.

```tsx
import { ResponsivePopover } from "@firna/ui/popover";

const anchorRef = useRef<View>(null);
const [open, setOpen] = useState(false);

<Pressable ref={anchorRef} aria-expanded={open} onPress={() => setOpen((o) => !o)}>
  <Text>Filters</Text>
</Pressable>
<ResponsivePopover
  anchorRef={anchorRef}
  label="Filters"
  maxHeight={360}
  minWidth={280}
  onClose={() => setOpen(false)}
  open={open}
>
  {({ close, layout }) => <FilterForm layout={layout} onApply={close} />}
</ResponsivePopover>;
```

Web-only props (`align`, `minWidth`, `manageFocus`, `initialFocusRef`, `zIndex`)
and native-only props (`title`, `dismissLabel`, `hideSheetHeader`) are ignored on
the other platform. `align` accepts `"start" | "center" | "end"` (default
`"end"`); `"center"` currently falls back to `"start"` until the placement engine
gains center support.

## ResponsiveMenu

`ResponsiveMenu` is a menu over the `ResponsivePopover` surface — an anchored
dialog on web, a bottom sheet on native — that gives the responsive surface the
same keyboard behaviour as [`DropdownMenu`](../dropdown/README.md): opening moves
focus into the dialog surface, yet ↑/↓ still move the active row and Enter
selects. Reach for it instead of dropping a bare `DropdownList` into a
`ResponsivePopover`: that list's key handler is bound to its inner `ScrollView`,
so it only fires while focus sits inside the scroll node — but the surface takes
focus on open, so the keydowns bubble past it and nothing navigates.
`ResponsiveMenu` fixes this by owning the same `useDropdownSelectorNavigation`
document-level listener `DropdownMenu` uses and driving the list through a
controlled active row, so navigation is independent of where focus lands. On
native there is no keyboard — the rows are tapped directly.

You supply `entries` (the same [`DropdownListEntry`](../dropdown/README.md) rows)
plus the `ResponsivePopover` surface props; the caller still owns the trigger and
`open` state. Rows close the surface after selection unless `closeOnSelect` is
`false`.

```tsx
import { ResponsiveMenu } from "@firna/ui/popover";

const anchorRef = useRef<View>(null);
const [open, setOpen] = useState(false);

<Pressable ref={anchorRef} aria-expanded={open} onPress={() => setOpen((o) => !o)}>
  <Text>Row actions</Text>
</Pressable>
<ResponsiveMenu
  anchorRef={anchorRef}
  label="Row actions"
  maxHeight={320}
  minWidth={220}
  onClose={() => setOpen(false)}
  open={open}
  entries={[
    { id: "rename", label: "Rename", onPress: rename, type: "item" },
    { id: "delete", label: "Delete", onPress: remove, tone: "danger", type: "item" },
  ]}
/>;
```

## ContextMenu

`ContextMenu` is the menu a secondary gesture opens — right-click on web,
long-press on native. It differs from every other surface here in one way that
drives its whole design: **it has no trigger element.** It is positioned at the
_point_ of the gesture through the portal's virtual `anchorRect`, not measured
against a box. On native there is no cursor to anchor to, so it renders as a
bottom sheet via `ResponsiveMenu`.

The gesture itself comes from `contextMenuTriggerProps`, which returns
`onContextMenu` on web (suppressing the browser's own menu) and `onLongPress` on
native. Neither branch wires `onPress`, so a plain tap or click is always left to
the host — the same contract `DropdownMenu`'s `contextMenu` trigger mode keeps.
`contextMenuPoint` reads the viewport coordinates back out of the event.

```tsx
import { ContextMenu, contextMenuTriggerProps } from "@firna/ui/popover";
import { Platform } from "react-native";

const [point, setPoint] = useState<DropdownPoint | null>(null);

<View
  {...contextMenuTriggerProps({
    isWeb: Platform.OS === "web",
    onOpen: setPoint,
  })}
>
  <Text>Right-click me</Text>
</View>
<ContextMenu
  accessibilityLabel="Row actions"
  entries={[
    { id: "rename", label: "Rename", onPress: rename, type: "item" },
    { id: "sep", label: "", type: "divider" },
    { id: "delete", label: "Delete", onPress: remove, tone: "danger", type: "item" },
  ]}
  onClose={() => setPoint(null)}
  open={point !== null}
  point={point}
  title="Row 4"
/>;
```

`point` doubles as the open guard: the menu stays closed while it is `null`, so
a gesture that yields no coordinates (a handler invoked with no event) is a
no-op rather than a menu in the corner. Set `title` for native — a sheet slides
up detached from whatever was pressed, so without it there is nothing to say
which row or column the actions apply to.

Two defaults are deliberately not left to callers. `minWidth` (220) is required
arithmetic, not taste: a point anchor is zero-width, `dropdownPlacement`'s
preferred width falls back to the anchor's width, and `dropdownWidthBounds`
treats that width as a minimum — so without it the surface resolves to 0px wide
and disappears. And `highlightVariant` is pinned to `"ring"` because the solid
active fill inverts row text to white, which a caller's `leading` icons cannot
opt out of.

Keyboard navigation runs on the same `useDropdownSelectorNavigation`
document-level listener as `ResponsiveMenu`, for the same reason: with nothing
focusing the surface, `DropdownList`'s own key handler — bound to its inner
`ScrollView` — never fires. Dismissal adds one rule the anchored surfaces do not
need: **the menu closes on scroll.** `useDropdownDismiss` closes on an outside
`pointerdown`, which a wheel is not, so a scroll would otherwise leave the menu
pinned to a point whose content had moved out from under it. Scrolls originating
inside the menu's own list are ignored, so a long menu still scrolls.

[`DataGrid`](../data-grid/README.md) is the reference consumer: it drives one
`ContextMenu` for header, row-gutter, and cell regions.

## Theming

The surface chrome (background, border, radius, shadow) comes from
`useDropdownSurfaceStyles`, which reads colours and radii from
`SharedUiThemeProvider`. See `src/dropdown/README.md` for the shared overlay
boundary and web/native portal rules.
