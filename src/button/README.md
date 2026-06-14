# Button

Shared pressable button for React Native and React Native Web, adapted from the
accounting app's `.btn` primitive. It is the single button primitive for the
library: tones, sizes, an optional leading icon, and a full-width block variant,
all driven by shared theme tokens.

## Responsibilities

- Render a labelled button with one of four tones: `primary` (filled),
  `secondary` (the default surface + border), `ghost` (no fill/border), and
  `danger` (rose border + label).
- Size the control with the shared `ControlSize` scale (`sm` / `md` / `lg`),
  scaling height, padding, the label type scale, and the icon.
- Show an optional leading `icon` tinted to match the label colour.
- Stretch full width with `block`.
- Own the sage focus ring on the whole control and hide the browser's default
  outline, using shared theme colours and radii.
- Expose `button` accessibility semantics with a disabled state, and treat a
  missing `onPress` as a read-only disabled control (matching the library's
  other pressables).

## Usage

```tsx
import { Button } from "@futex/ui/button";
import { Plus } from "lucide-react-native";

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
```

### Tones

`tone` sets the emphasis: `primary` for the main action, `secondary` (default)
for neutral actions, `ghost` for low-emphasis inline actions, and `danger` for
destructive ones. The label and any leading icon share one colour per tone.

### Sizes

`size` takes the shared `ControlSize` (`sm` / `md` / `lg`); `md` is the default
and matches the accounting button (38px tall). Buttons and inputs share this
scale, so a form can size a field and its submit button consistently. `sm`
(30px) suits dense, non-touch-first contexts such as table rows and toolbars;
prefer `md` or `lg` for primary, touch-first actions.

### Block

`block` stretches the button to fill its container (full width), for stacked
form actions and bottom sheets.

## Styling

`style` extends the pressable container (`ViewStyle`). Tone, size, the focus
ring, and the disabled treatment are applied by the component; `style` layers on
top for one-off layout tweaks (e.g. margins).

## Theming

Buttons read colours and radii from `SharedUiThemeProvider`: the primary tone
uses `colors.primary`, the ghost label uses `colors.primaryDeep`, the danger
border/label uses `colors.roseSoft` / `colors.rose`, the secondary fill/border
uses `colors.surface` / `colors.border2`, the focus ring uses `colors.primary`,
and the corner radius uses `radii.md`.
