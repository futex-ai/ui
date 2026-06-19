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
- Support an in-progress `busy` state that stays focusable and announces
  `aria-busy`, blocks the press handler, and swaps the leading icon for a
  spinner.

## Usage

```tsx
import { Button } from "@firna/ui/button";
import { Plus, Settings } from "lucide-react-native";

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

{/* In-progress: blocks the press, shows a spinner, announces `aria-busy`. */}
<Button busy={saving} onPress={save} tone="primary">
  {saving ? "Saving" : "Save"}
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

## Accessibility

- **Accessible name (WCAG 1.1.1 / 4.1.2, A).** A button with visible text uses
  that text as its name; pass `accessibilityLabel` only to override it (keep the
  visible text a substring so it still satisfies 2.5.3 Label in Name). An
  **icon-only** button (no children) **requires** `accessibilityLabel` — this is
  type-enforced, and a `__DEV__` warning fires if a name can't be resolved.
- **Decorative icon (1.1.1, A).** The leading icon is hidden from assistive
  technology (`aria-hidden` on web), so the button is announced once by its name
  rather than by the raw glyph.
- **Busy state (4.1.2, A).** `busy` sets `aria-busy`, blocks the press handler,
  and swaps the icon for a spinner while keeping the button focusable and
  announced. It is distinct from `disabled` (which removes the control from the
  tab order). The spinner stops animating under `prefers-reduced-motion`.
- **Keyboard (2.1.1, A).** Enter/Space activation is delegated to React Native
  Web's `role="button"` synthesis (no explicit `onKeyDown` is wired); a
  Playwright test asserts both keys still activate to catch RNW regressions.
- **Focus visible (2.4.7, AA).** A geometry-bearing box-shadow ring is shown on
  focus for every tone (including `primary`, where a border-colour ring would be
  invisible), and the browser's default outline is suppressed.
- **Non-text contrast (1.4.11, AA).** The secondary button's resting border uses
  the ≥3:1 `controlBorder` token. The `ghost` tone intentionally has no resting
  border or fill: its `primaryDeep` label is the affordance.

## Theming

Buttons read colours and radii from `SharedUiThemeProvider`: the primary tone
uses `colors.primary`, the ghost label uses `colors.primaryDeep`, the danger
border/label uses `colors.roseSoft` / `colors.rose`, the secondary fill uses
`colors.surface` with the `colors.controlBorder` boundary, the focus ring uses
`colors.primary`, and the corner radius uses `radii.md`.
