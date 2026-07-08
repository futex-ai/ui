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
(clamped to `minWidth`), pass `minWidth` to size content popovers. The placement
options — `align`, `gutter`, `margin`, `maxHeight`, `minHeight`, `minWidth` —
are forwarded straight to `DropdownPortal`. Pass `style` to change how the
wrapper lays out (for example `alignSelf: "stretch"` to match the trigger to its
parent width).

The portal defaults to the high shared dropdown layer
(`DROPDOWN_LAYERS.portal`, currently `1_000_000`). Pass `zIndex` to `Popover`
when a consuming screen owns an even higher stacking context:

```tsx
<Popover minWidth={240} trigger={renderTrigger} zIndex={2_000_000}>
  <DetailsCard />
</Popover>
```

## Theming

The surface chrome (background, border, radius, shadow) comes from
`useDropdownSurfaceStyles`, which reads colours and radii from
`SharedUiThemeProvider`. See `src/dropdown/README.md` for the shared overlay
boundary and web/native portal rules.
