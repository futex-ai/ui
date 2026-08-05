# Avatar

Reusable React Native and React Native Web user avatar copied from the
accounting app's shared `Avatar` primitive. It renders short initials on a
themed disc or rounded square.

## Responsibilities

- Render a disc or rounded square with one or two initials centered on it.
- Offer two shapes: `circle` (default) and `square`, whose corner radius scales
  with `size` from the theme's `radii.avatarRatio`.
- Scale the box, the corner radius (`size / 2` for `circle`,
  `size * radii.avatarRatio` for `square`), and the initials' font size
  (`size * 0.38`) from a single `size` prop.
- Offer two tones: `solid` (primary-filled disc, white text) and `soft` (soft
  tint, deep-primary text).
- Replace the initials with the shared `dot-grid` loader while `loading`,
  without changing the disc's fill, corner, or footprint.
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
<Avatar label="GS" shape="square" size={48} />;
<Avatar label="VA" loading />;
<Avatar
  label="AR"
  style={{ backgroundColor: "#f4ecd8" }}
  textColor="#946727"
/>;
```

`label` is the visible initials. `size` defaults to `32`. `tone` defaults to
`solid`. `shape` defaults to `circle`; `square` is the same 1:1 box with
proportionally rounded corners. Pass `accessibilityLabel` to give assistive tech
the full name (it overrides the visible initials as the accessible name); omit it
and the initials are read instead. `style` overrides the container disc for
non-default surfaces — pass `style={{ borderRadius }}` for a one-off radius that
should not follow the theme ratio. `textColor` overrides the initials' color for
palette-specific discs.

`loading` (default `false`) swaps the initials for the `dot-grid`
[`Loader`](../loader/README.md) shape, drawn at half the avatar's box in the
same foreground color the initials would have used — including a `textColor`
override. The disc keeps its tone, shape, size, and corner radius throughout, so
a row of avatars does not reflow when the data arrives. `label` is still
required while loading: it is what the disc falls back to for its accessible
name, and what it renders the moment `loading` goes false.

## Accessibility

- The disc is exposed as a single image (`accessibilityRole="image"` →
  `role="img"`) named by `accessibilityLabel` (falling back to the visible
  initials). The inner initials `Text` is hidden from assistive tech
  (`aria-hidden` on web, `importantForAccessibility="no"` on native) so the
  avatar is announced once by its name rather than as raw initials (1.1.1,
  4.1.2).
- While `loading`, the disc is no longer a picture of anyone, so it swaps to
  `accessibilityRole="progressbar"` with a busy state (`aria-busy` on web,
  `accessibilityState={{ busy: true }}` on native) under the same accessible
  name — matching how [`Loader`](../loader/README.md) and `Spinner` announce
  themselves (4.1.2, 4.1.3). It reverts to `image` once the initials are back.
  The dot grid itself is hidden from assistive tech; a `decorative` avatar stays
  fully hidden while loading rather than announcing a busy state.
- The dot grid honours "reduce motion": the dots hold their size and only the
  brightness wave remains, so nothing moves or scales (2.3.3).
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
The `square` shape's corner radius is `size * radii.avatarRatio` (default
`0.25`, clamped to `[0, 0.5]`), so retuning that one token reshapes every
rounded-square avatar at once.
