# Popover

An anchored content popover for React Native and React Native Web. It opens a
floating surface next to a trigger to show arbitrary content — details, help
text, a small form, a colour picker — without selecting a value.

`Popover` is the non-selecting sibling of `DropdownSelector`. It reuses the same
overlay foundation rather than reimplementing it: `DropdownPortal` provides
anchor measurement, viewport-aware placement (on web, measuring the surface and
flipping it above the trigger when it does not fit below, and clamping height),
the non-modal `pointer-events: box-none` web portal layer, native
modal-backing, and outside-click / Escape dismissal. `Popover` adds only the open-state controller and the trigger props.

The [menus guide](menus.md) covers `ResponsiveMenu`, `InlineMenu`, the phone
menu sheet, and `ContextMenu`.

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
- Draw a menu open in place beside its trigger, with no portal or measurement,
  so static HTML shows it open (`InlineMenu`), and draw the phone menu sheet in
  place (`InlineMenuSheet`).
- On a touch surface, open menus as the phone menu sheet, with touch rows and
  a close control that keeps the keyboard.

The [app shell parts protocol](../../docs/protocol/app-shell-parts.md#menus)
holds the requirements of the in-place menu and the menu sheet.

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

See the [menus guide](menus.md#responsivemenu).

## InlineMenu

See the [menus guide](menus.md#inlinemenu).

## Phone menu sheet

See the [menus guide](menus.md#phone-menu-sheet).

## ContextMenu

See the [menus guide](menus.md#contextmenu).

## Key Code

- `ResponsiveMenu.tsx` — the anchored web menu, the native sheet menu, and the
  touch-surface switch to the menu sheet.
- `InlineMenu.web.tsx` / `InlineMenu.tsx` — the menu drawn in place on web, and
  the menu sheet on a touch surface and on native; `inlineMenuModel.ts` holds
  their props and placement.
- `MenuSheet.tsx` — the phone menu sheet that both menus open.
- `InlineMenuSheet.tsx` — the phone menu sheet drawn in place.

## Theming

The surface chrome (background, border, radius, shadow) comes from
`useDropdownSurfaceStyles`, which reads colours and radii from
`SharedUiThemeProvider`. See `src/dropdown/README.md` for the shared overlay
boundary and web/native portal rules.
