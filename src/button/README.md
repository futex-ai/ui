# Button

Shared pressable button for React Native and React Native Web, adapted from the
accounting app's `.btn` primitive. It is the single button primitive for the
library: tones, sizes, an optional leading icon (lucide or a caller-supplied
node), icon-only shapes, and a full-width block variant, all driven by shared
theme tokens.

Longer topics have their own guides: [layout and touch targets](layout.md),
[roles, triggers, and accessibility](roles-and-accessibility.md), and
[content, events, and styling](customization.md).

## Responsibilities

- Render a labelled button with one of five tones: `primary` (filled),
  `secondary` (the default surface + border), `ghost` (no fill/border, brand
  label), `plain` (no fill/border, neutral `ink` label — a flush icon button),
  and `danger` (rose border + label).
- Size the control with the shared `ControlSize` scale (`xs` / `sm` / `md` /
  `lg`), scaling height, padding, the label type scale, and the icon.
- Give every button a target of at least 44 by 44px inside a `TouchSurface`,
  whatever its size, with each target in its own layout space.
- Show an optional leading `icon` (a lucide glyph, tinted to the label colour) or
  a caller-supplied `iconNode` (any node — e.g. an `@expo/vector-icons` glyph —
  rendered as-is, never wrapped in `<Text>`).
- Keep caller-supplied icon nodes decorative and non-interactive so a focusable
  child SVG cannot take pointer focus away from the outer button.
- Render as an icon-only `square` or `circle` (`shape`) 1:1 tap target, with an
  optional `minTouchTarget` floor independent of the label height scale, a
  `boxSize` that sets that box outright (including below the smallest density),
  and a `hitSlop` that grows the tap area without growing the control.
- Render a compact, line-height-neutral `inline` chip that flows inside a line of
  text (an inline "Restore" / "Undo" action) without growing the row's height.
- Stretch full width with `block`.
- Carry the whole press lifecycle — `onPressIn`, `onPressOut`, `onLongPress`,
  `delayLongPress`, and a forwarded gesture event — so push-to-talk and
  open-at-the-pointer controls do not need a hand-rolled pressable.
- Give every tone a pressed treatment, and accept a functional `style` so a
  caller whose own fill has erased those washes can put press feedback back.
- Sit on photography or video with the `onMedia` tone, whose translucent white
  veil and label stay white in every scheme.
- Open the label and the row to the caller: `labelStyle`, `numberOfLines`, a
  `trailing` slot, and a `content` escape hatch for a pressable card.
- Own the sage focus ring on the whole control and hide the browser's default
  outline, using shared theme colours and radii. On web the ring follows
  `:focus-visible`, and disabling a focused button clears its tracked focus so a
  stale ring cannot return when the button is re-enabled.
- Expose `button` accessibility semantics with a disabled state, and treat a
  missing `onPress` as a read-only disabled control (matching the library's
  other pressables).
- Re-point that role with `role` — `checkbox`, `menuitem`, `radio`, `switch`, or
  `tab` — paired with the state that role must carry (`checked` / `selected` /
  `pressed` / `expanded`), and bind Spacebar for the roles the web backend
  leaves unbound.
- Support an in-progress `busy` state that stays focusable and announces
  `aria-busy`, blocks the whole press lifecycle, and swaps the leading icon for
  a spinner.
- Announce the overlay a trigger opens with `hasPopup` (`aria-haspopup`).

## Usage

```tsx
import { Button } from "@firna/ui/button";
import { Plus, Settings } from "lucide-react-native"; // or "lucide-react" on web

<Button icon={Plus} onPress={addAccount} tone="primary">
  Add account
</Button>

<Button onPress={cancel}>Cancel</Button>

<Button block onPress={save} size="lg" tone="primary">
  Save changes
</Button>

<Button onPress={remove} size="sm" tone="danger">
  Delete
</Button>

{/* Icon-only: no visible text, so `accessibilityLabel` is required. */}
<Button accessibilityLabel="Settings" icon={Settings} onPress={openSettings} />

{/* Flush circular header icon button: borderless `plain` tone, 1:1 `circle`
    shape, a non-lucide glyph, and a 40px minimum tap target. */}
<Button
  accessibilityLabel="More"
  iconNode={<Ionicons name="ellipsis-horizontal" size={20} color="#1c1f1d" />}
  minTouchTarget={40}
  onPress={openMenu}
  shape="circle"
  tone="plain"
/>

{/* In-progress: blocks the press, shows a spinner, announces `aria-busy`. */}
<Button busy={saving} onPress={save} tone="primary">
  {saving ? "Saving" : "Save"}
</Button>

{/* Inline chip beside a label — collapses to the row's line height. The row's
    `paddingVertical` gives the overflowing pill + focus ring room (needed under
    `overflow: "hidden"` on web and on native Android). */}
<View style={{ alignItems: "center", flexDirection: "row", gap: 8, paddingVertical: 8 }}>
  <Text>Moved to Trash</Text>
  <Button inline onPress={restore}>Restore</Button>
</View>
```

### Tones

`tone` sets the emphasis: `primary` for the main action, `secondary` (default)
for neutral actions, `ghost` for low-emphasis inline actions (brand-accent
label), `plain` for a flush, chrome-less icon button (neutral `ink` label with a
neutral hover/pressed wash), and `danger` for destructive ones. The label and
any leading lucide `icon` share one colour per tone; an `iconNode` keeps its own
colour.

### Icon-only shapes

`shape` sets the container geometry: `rounded` (default) is the padded rectangle;
`square` is an equal-padding 1:1 box; `circle` is that box with a full radius.
The 1:1 shapes are for icon-only buttons. `minTouchTarget` floors the tap target
(min width and height) at a given px — independent of `size` — so a compact icon
button still meets a comfortable ≥40–44px touch target; on `square` / `circle`
it also grows the box to that dimension.

### Icons

Pass a lucide component to `icon` (tinted to the label colour and sized to the
control), or any node to `iconNode` for a non-lucide glyph — the node renders
as-is (never inside `<Text>`), so the caller owns its colour and size. `iconNode`
wins when both are set. Either way the glyph is hidden from assistive technology
on web; the label (or the required `accessibilityLabel`) is the accessible name.
The `iconNode` wrapper also ignores pointer events, ensuring clicks target and
focus the button even if the supplied node contains an SVG with a `tabIndex`.
Interactive content is therefore not supported inside `iconNode`; render it as
a separate named control instead.

### Sizes

`size` takes the shared `ControlSize` (`xs` / `sm` / `md` / `lg`); `md` is the
default and matches the accounting button (38px tall). Buttons and inputs share
this scale, so a form can size a field and its submit button consistently. `sm`
(30px) suits dense, non-touch-first contexts such as table rows and toolbars;
prefer `md` or `lg` for primary, touch-first actions. `xs` (26px) is the dense
desktop size: a 12px label on a 16px line at weight 500, with 14px icons. The
other sizes keep their bold labels.

### Inline

See the [layout guide](layout.md#inline).

### Block

`block` stretches the button to fill its container (full width), for stacked
form actions and bottom sheets.

### Roles and states

See the [roles and accessibility guide](roles-and-accessibility.md#roles-and-states).

### Imperative focus

See the [customization guide](customization.md#imperative-focus).

### Press lifecycle

See the [customization guide](customization.md#press-lifecycle).

### On media

See the [customization guide](customization.md#on-media).

### Tap target and box size

See the [layout guide](layout.md#tap-target-and-box-size).

### Touch surfaces

See the [layout guide](layout.md#touch-surfaces).

### Label, slots, and cards

See the [customization guide](customization.md#label-slots-and-cards).

### Menu triggers

See the [roles and accessibility guide](roles-and-accessibility.md#menu-triggers).

## Styling

See the [customization guide](customization.md#styling).

## Accessibility

See the [roles and accessibility guide](roles-and-accessibility.md#accessibility).

## Theming

Buttons read colours and radii from `SharedUiThemeProvider`: the primary tone
uses `colors.primary`, the ghost label uses `colors.primaryDeep`, the danger
border/label uses `colors.roseSoft` / `colors.rose`, the secondary fill uses
`colors.surface` with the `colors.controlBorder` boundary, the focus ring uses
`colors.primary`, and the corner radius uses `radii.md`. The pressed treatments
use `colors.bg2` (secondary) and `colors.roseDeep` (danger); `primary` dims
instead, because `primaryDeep` is already the darkest accent the theme contract
defines. The `onMedia` tone is the one exception to all of this — see
[On media](customization.md#on-media).

## Key Code

- [`Button.tsx`](Button.tsx): the component, which wires its props to the
  pressable, the focus ring, the semantics, and the touch target.
- [`buttonProps.ts`](buttonProps.ts): the props, tones, shapes, and the
  interaction state of a functional `style`.
- [`buttonPaint.ts`](buttonPaint.ts): the label colour, the shape, and the tone
  and state layers. `LinkButton` paints with the same functions.
- [`buttonStyles.ts`](buttonStyles.ts): the size table, the touch metrics, and
  the styles of each tone.
- [`ButtonContent.tsx`](ButtonContent.tsx): the spinner, the icon, the label,
  and the trailing slot.
- [`buttonSemantics.ts`](buttonSemantics.ts) and
  [`buttonTouch.ts`](buttonTouch.ts): the role and state mapping, and the touch
  geometry.
