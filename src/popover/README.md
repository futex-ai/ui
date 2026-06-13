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
- Report expanded state to assistive tech through the trigger props.

## Usage

```tsx
import { Popover } from "@futex/ui/popover";

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

## Sizing and placement

The trigger is wrapped in a self-hugging `View` (`alignSelf: "flex-start"`) so a
small trigger keeps a small anchor. Because the surface width follows the anchor
(clamped to `minWidth`), pass `minWidth` to size content popovers. The placement
options — `align`, `gutter`, `margin`, `maxHeight`, `minHeight`, `minWidth` —
are forwarded straight to `DropdownPortal`. Pass `style` to change how the
wrapper lays out (for example `alignSelf: "stretch"` to match the trigger to its
parent width).

## Theming

The surface chrome (background, border, radius, shadow) comes from
`useDropdownSurfaceStyles`, which reads colours and radii from
`SharedUiThemeProvider`. See `src/dropdown/README.md` for the shared overlay
boundary and web/native portal rules.
