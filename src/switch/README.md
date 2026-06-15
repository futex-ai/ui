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
import { Switch } from "@futex/ui/switch";

<Switch
  accessibilityLabel="Analytics cookies"
  onValueChange={setAnalyticsEnabled}
  value={analyticsEnabled}
/>;
```

Omitting `onValueChange` renders the switch as read-only. Passing `disabled`
also dims the visual track and reports the disabled accessibility state.

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
`colors.border2`, the on track uses the active theme `colors.primary`, and the
track radius uses `radii.pill`.
