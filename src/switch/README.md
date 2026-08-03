# Switch

Reusable React Native and React Native Web on/off switch copied from the
accounting app's shared `Switch` primitive.

## Responsibilities

- Render a toggle track sized by the shared `ControlSize` scale (`sm` / `md` /
  `lg`); `md` is the original 40×24 track with an 18px knob.
- Expose `switch` semantics with checked and disabled state.
- Keep a real touch target (≥ 40px) around the track that grows with the size.
- Use shared theme colors and radii instead of consumer-local theme imports.
- Allow consumer surfaces to override the track style without forking the
  component.

## Usage

Use `Switch` for binary settings where the label is owned by the surrounding
row:

```tsx
import { Switch } from "@firna/ui/switch";

<Switch
  accessibilityLabel="Analytics cookies"
  onValueChange={setAnalyticsEnabled}
  value={analyticsEnabled}
/>;
```

Omitting `onValueChange` renders the switch as read-only. Passing `disabled`
also dims the visual track and reports the disabled accessibility state.

## Accessibility

- **Accessible name (required).** A switch must have a name. Pass
  `accessibilityLabel`, or — for the common row-label pattern — give the visible
  label a `nativeID` and point `aria-labelledby` at it so the accessible name
  matches the visible text (WCAG 2.5.3 Label in Name). One of the two is
  required; in development the component warns if neither is provided.

  ```tsx
  <Text nativeID="analytics-cookies-label">Analytics cookies</Text>
  <Switch
    aria-labelledby="analytics-cookies-label"
    onValueChange={setEnabled}
    value={enabled}
  />
  ```

- **Role + state.** Renders `role="switch"` with `aria-checked` and the disabled
  state.
- **Keyboard.** Space and Enter both toggle the switch when focused, each
  exactly once. They arrive by different routes on web: React Native Web's press
  responder presses Enter for every role, so the switch binds only Space itself
  (the responder binds Spacebar to `button` roles alone). Binding Enter as well
  would toggle it twice — once on keydown from the component, once on keyup from
  the responder — leaving the key looking dead.
- **Focus visible.** A keyboard focus ring (an inset `outline`) is drawn on the
  track (WCAG 2.4.7).
- **Contrast.** The off-track and the white knob carry a `controlBorder`-tinted
  edge so the resting boundary and the knob position cue stay perceivable
  (WCAG 1.4.11 Non-text Contrast, 1.4.1 Use of Color). The track takes the tint
  at half alpha: it paints over the grey `border2` fill rather than white, so
  the full-strength token composites to roughly twice the weight it has
  everywhere else and reads as a hard outline.
- **Reduced motion.** The knob slide is suppressed when the user prefers reduced
  motion.

### Sizes

`size` takes the shared `ControlSize` (`sm` / `md` / `lg`); `md` is the default
and matches the original 40×24 track. The size scales the track, the knob, the
on-position offset, and the surrounding touch target together, so a switch lines
up with the inputs and buttons in the same row.

```tsx
<Switch
  accessibilityLabel="Compact"
  onValueChange={setValue}
  size="sm"
  value={value}
/>
```

## Theming

Switches read colors and radii from `SharedUiThemeProvider`. The off track uses
`colors.border2` with a half-alpha `colors.controlBorder` edge, the on track uses
the active theme `colors.primary`, the knob carries a full-strength
`colors.controlBorder` edge, and the track radius uses `radii.pill`. A
`controlBorder` override that isn't an `rgba()`/`rgb()` color draws the track
edge at face value.
