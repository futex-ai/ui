# Avatar

Reusable React Native and React Native Web circular user avatar copied from the
accounting app's shared `Avatar` primitive. It renders short initials on a
themed disc.

## Responsibilities

- Render a circular disc with one or two initials centered on it.
- Scale the diameter, circular radius (`size / 2`), and initials' font size
  (`size * 0.38`) from a single `size` prop.
- Offer two tones: `solid` (primary-filled disc, white text) and `soft` (soft
  tint, deep-primary text).
- Use shared theme colors and fonts instead of consumer-local theme imports.
- Allow consumer surfaces to override the disc style and supply an accessible
  name without forking the component.

## Usage

Use `Avatar` wherever a person or entity needs a compact initials badge:

```tsx
import { Avatar } from "@futex/ui/avatar";

<Avatar accessibilityLabel="Greenhouse Studio" label="GS" />;
<Avatar label="PR" tone="soft" />;
<Avatar label="VA" size={48} />;
```

`label` is the visible initials. `size` defaults to `32`. `tone` defaults to
`solid`. Pass `accessibilityLabel` to give assistive tech the full name (it
overrides the visible initials as the accessible name); omit it and the initials
are read instead. `style` overrides the container disc for non-default surfaces.

## Theming

Avatars read colors and fonts from `SharedUiThemeProvider`. The `solid` disc
uses `colors.primary` with white initials; the `soft` disc uses `colors.soft`
with `colors.primaryDeep` initials; the initials use the theme `fonts.sans`.
