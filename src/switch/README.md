# Switch

Reusable React Native and React Native Web on/off switch copied from the
accounting app's shared `Switch` primitive.

## Responsibilities

- Render a compact 40px by 24px toggle track with an 18px knob.
- Expose `switch` semantics with checked and disabled state.
- Keep a touch target of at least 44px with `hitSlop`.
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

## Theming

Switches read colors and radii from `SharedUiThemeProvider`. The off track uses
`colors.border2`, the on track uses the active theme `colors.primary`, and the
track radius uses `radii.pill`.
