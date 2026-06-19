# Spinner

Reusable React Native and React Native Web indeterminate loading indicator: a
ring whose accent arc rotates continuously over a fainter track.

## Responsibilities

- Render a circular ring sized by the shared `ControlSize` scale (`sm` / `md` /
  `lg`, `md` is the 24px default) or by an explicit pixel diameter, with the
  stroke thickness scaled from the diameter.
- Spin the ring continuously through React Native's `Animated` API so the same
  component animates on native and web, and stop the loop on unmount.
- Expose `progressbar` semantics with a busy accessibility state and an
  accessible name (defaults to "Loading").
- Use shared theme colors for the accent arc and ring track instead of
  consumer-local theme imports.
- Keep only the inner ring rotating so the labelled container has a stable box
  for layout and assistive technology.

## Usage

Use `Spinner` while content is loading; the surrounding layout owns the visible
"Loading…" copy when one is needed:

```tsx
import { Spinner } from "@firna/ui/spinner";

<Spinner accessibilityLabel="Loading invoices" />;
```

### Sizes

`size` takes the shared `ControlSize` (`sm` / `md` / `lg`; `md` is the default
24px ring) or an explicit pixel diameter for arbitrary placements such as inside
a button. The ring thickness scales with the diameter.

```tsx
<Spinner size="sm" />
<Spinner size="lg" />
<Spinner size={48} />
```

### Color

The accent arc uses the theme `primary` and the track uses `border2` by default.
Pass `color` and `trackColor` to match a different surface — for example a white
arc on a filled primary button.

```tsx
<Spinner color="#fff" trackColor="rgba(255, 255, 255, 0.35)" />
```

## Theming

Spinners read colors from `SharedUiThemeProvider`. The accent arc uses
`colors.primary` and the ring track uses `colors.border2`; both can be
overridden per instance with the `color` and `trackColor` props.
