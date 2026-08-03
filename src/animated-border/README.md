# AnimatedBorder

Reusable React Native and React Native Web "comet trail" border: a moving accent
that traces the rounded-rectangle perimeter of the element it frames. It is the
active-tool-icon border from the Juno app generalised into a standalone
primitive.

## Responsibilities

- Trace a rounded rectangle sized by `width` / `height` (or a square `size`) and
  `borderRadius` so the trail follows the same corner radius as the element it
  frames, or fully round the box when `shape="circle"` (a true circle for a
  square box, an elongated stadium/"pill" for a non-square one).
- Draw the trail as stacked `react-native-svg` rects with animated
  `strokeDashoffset` — a bright, short head leading a fan of progressively
  fainter, longer tail segments — so the motion follows the real path on native
  and web alike, unlike a CSS gradient border (which cannot bend around a
  corner) or a single rotated dash (which only reads as motion on a circle).
- Run the loop through React Native's `Animated` API and stop it on unmount. The
  loop is JS-driven (`useNativeDriver: false`) because an SVG attribute cannot
  run on the native driver.
- Wrap `children` and overlay the border over them, or render the border on its
  own (no children) for the caller to position.
- Stay out of the accessibility tree — the border is decorative, hidden with
  `aria-hidden` on web and `accessibilityElementsHidden` /
  `importantForAccessibility` on native — and let pointer events pass through to
  the content underneath.
- Settle into a static outline when the user prefers reduced motion.
- Use the shared theme `primary` for the trail color instead of a consumer-local
  theme import, and accept either one color or a `[from, to]` pair — a pair is
  stroked with an SVG gradient so a border can carry a brand pair rather than a
  single accent.

## Usage

Wrap the element you want to highlight, passing its size and corner radius so the
trail lines up with its edge:

```tsx
import { AnimatedBorder } from "@firna/ui/animated-border";

<AnimatedBorder size={24} borderRadius={7}>
  <ToolIconBadge group="http" />
</AnimatedBorder>;
```

### Standalone overlay

Omit `children` to render just the border, then position it yourself over an
existing box (for example with an absolute style):

```tsx
<View style={{ position: "relative" }}>
  <Card />
  <AnimatedBorder
    width={320}
    height={180}
    borderRadius={14}
    style={{ position: "absolute", left: 0, top: 0 }}
  />
</View>
```

### Circles and pills

To frame a circular avatar/icon or a pill, pass `shape="circle"`. It fully
rounds the box and ignores `borderRadius`, so you never compute `size / 2`:

```tsx
<AnimatedBorder shape="circle" size={40}>
  <Avatar size={40} name="Ada" />
</AnimatedBorder>
```

Because React Native `borderRadius` only ever makes circles and stadiums (never
ellipses), "fully rounded" matches the framed element in both cases: a **square**
box traces a true circle, and a **non-square** box traces an elongated
stadium/"pill" whose straight edges and semicircular caps follow the whole
outline — not a small circle floating in the middle.

```tsx
<AnimatedBorder shape="circle" width={160} height={44}>
  <PillButton>Generating…</PillButton>
</AnimatedBorder>
```

### Non-square boxes

`width` and `height` are independent, so the trail traces wide pills and tall
cards as readily as square badges. The perimeter (and therefore the trail
spacing) is computed from the real rounded-rect path.

```tsx
<AnimatedBorder width={200} height={44} borderRadius={22} />
```

### Tuning the trail

```tsx
<AnimatedBorder
  size={24}
  borderRadius={7}
  color="#a84f45"
  borderWidth={1.5}
  duration={1200}
  trailCount={10}
  trailSpacing={4}
/>
```

- `color` — trail color: one color, or a `[from, to]` pair drawn as a gradient
  (see below); defaults to the theme `primary`.
- `borderWidth` — stroke thickness in px (default `1.2`).
- `duration` — milliseconds for one full lap (default `1600`).
- `trailCount` — number of fading tail segments behind the head (default `8`).
- `trailSpacing` — perimeter gap in px between segments (default `3`).

### Two-color gradient

Pass a `[from, to]` pair to stroke the trail with a gradient instead of a flat
color — enough to say _whose_ work is running, not just that something is:

```tsx
// Slack-branded: cyan through magenta and back.
<AnimatedBorder borderRadius={7} color={["#36c5f0", "#e01e5a"]} size={24}>
  <ToolIconBadge group="slack" />
</AnimatedBorder>
```

The gradient sweeps **across the box** (`from → to → from`, left to right), so
the dashes change hue as they travel rather than each carrying a fixed color.
`from` sits at both ends deliberately: the left and right sides of the border
then read the same, with the second color through the middle. A one-way ramp
would leave the two sides mismatched.

When only one color is available, repeat it — a pair of the same color renders
exactly like passing that color on its own, so callers never need to branch:

```tsx
const brand = app.colors ?? [theme.colors.primary, theme.colors.primary];

<AnimatedBorder color={brand} shape="circle" size={40}>
  <AppIcon app={app} />
</AnimatedBorder>;
```

The gradient applies in reduced-motion mode too: the static outline it settles
into is stroked with the same pair.

## Theming

The trail reads `colors.primary` from `SharedUiThemeProvider` by default; pass
`color` to override it per instance, as a single color or a `[from, to]` pair.
