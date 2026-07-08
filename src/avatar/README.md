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
- Allow palette-specific discs to override the initials' color while preserving
  the component-owned font sizing and weight.
- Expose the disc to assistive tech as a single named image, with an opt-out for
  decorative use beside a visible label.

## Usage

Use `Avatar` wherever a person or entity needs a compact initials badge:

```tsx
import { Avatar } from "@firna/ui/avatar";

<Avatar accessibilityLabel="Greenhouse Studio" label="GS" />;
<Avatar label="PR" tone="soft" />;
<Avatar label="VA" size={48} />;
<Avatar
  label="AR"
  style={{ backgroundColor: "#f4ecd8" }}
  textColor="#946727"
/>;
```

`label` is the visible initials. `size` defaults to `32`. `tone` defaults to
`solid`. Pass `accessibilityLabel` to give assistive tech the full name (it
overrides the visible initials as the accessible name); omit it and the initials
are read instead. `style` overrides the container disc for non-default surfaces.
`textColor` overrides the initials' color for palette-specific discs.

## Accessibility

- The disc is exposed as a single image (`accessibilityRole="image"` →
  `role="img"`) named by `accessibilityLabel` (falling back to the visible
  initials). The inner initials `Text` is hidden from assistive tech
  (`aria-hidden` on web, `importantForAccessibility="no"` on native) so the
  avatar is announced once by its name rather than as raw initials (1.1.1,
  4.1.2).
- Pass `decorative` when the avatar sits beside a visible label that already
  names the person/entity. The disc is then removed from the accessibility tree
  (`aria-hidden` on web, `importantForAccessibility="no-hide-descendants"` /
  `accessibilityElementsHidden` on native) so the name is not announced twice.
- **Contrast contract:** the built-in tones (`solid`, `soft`) meet the 4.5:1 AA
  text-contrast minimum in both shipped themes. When you override `textColor`
  and/or the disc `backgroundColor` via `style`, you are responsible for keeping
  the initials at ≥4.5:1 against the disc background (1.4.3).

## Theming

Avatars read colors and fonts from `SharedUiThemeProvider`. The `solid` disc
uses `colors.primary` with white initials; the `soft` disc uses `colors.soft`
with `colors.primaryDeep` initials; the initials use the theme `fonts.sans`.
When `textColor` is provided, it overrides the tone's default initials color.
