# Loader

Reusable React Native and React Native Web loading indicators: `Loader`, an
indeterminate indicator with six interchangeable shapes, plus `ProgressBar` and
`ProgressRing` for work whose total is known.

## Responsibilities

- Draw an indeterminate loading indicator in any of six shapes — `ring`,
  `dot-grid`, `dots`, `bars`, `blades`, `pulse` — all sized off the shared
  `ControlSize` scale (`sm` / `md` / `lg`, `md` is the 24px default) or an
  explicit pixel size, so one can be swapped for another without the layout
  moving.
- Delegate `variant="ring"` to the existing [`Spinner`](../spinner/README.md)
  rather than reimplementing the arc, keeping one ring in the library.
- Drive every shape from a single `Animated` loop that stops on unmount and
  animates only opacity and transform, so it stays on the native driver on
  iOS/Android and renders identically on web.
- Honour the user's "reduce motion" preference by slowing the loop right down
  and dropping to a brightness-only animation, rather than freezing — a frozen
  loader reads as a hung screen.
- Expose `progressbar` semantics: a busy state and an accessible name while
  indeterminate, and an `aria-valuenow` percentage once a value is known.
- Use shared theme colors instead of consumer-local theme imports.

## Usage

```tsx
import { Loader, ProgressBar, ProgressRing } from "@firna/ui/loader";

<Loader accessibilityLabel="Loading invoices" />;
```

### Variants

`<Loader />` defaults to `ring`, so it is a drop-in for `<Spinner />`. The other
five shapes take the same props:

```tsx
<Loader variant="ring" />
<Loader variant="dot-grid" />
<Loader variant="dots" />
<Loader variant="bars" />
<Loader variant="blades" />
<Loader variant="pulse" />
```

| Variant    | Shape                                           | Default cycle |
| ---------- | ----------------------------------------------- | ------------- |
| `ring`     | An accent arc turning over a faint track        | 800ms         |
| `dot-grid` | Nine dots on a 3×3 grid, lit along the diagonal | 1200ms        |
| `dots`     | Three dots bouncing in sequence                 | 1000ms        |
| `bars`     | Four bars rising and falling like an equalizer  | 900ms         |
| `blades`   | Ten spokes brightening clockwise                | 900ms         |
| `pulse`    | Three rings expanding outward and fading        | 1600ms        |

`ring`, `dot-grid`, `blades`, and `pulse` are square. `dots` and `bars` are wider
than they are tall; every variant's **height** is the resolved `size`, so a row
of mixed loaders still lines up.

Pass `duration` to override the per-variant default.

### Sizes and color

```tsx
<Loader size="sm" variant="dots" />
<Loader size={48} variant="dot-grid" />
<Loader color="#fff" size="sm" variant="dots" />
```

The accent defaults to the theme `primary`. `trackColor` applies to `ring` only —
it is the fainter full-circle track behind the arc — and defaults to `border2`.

### Progress

`ProgressBar` is a full-width track. Pass `value` (a 0–1 fraction, clamped) for
determinate progress; omit it and a segment sweeps across the track instead,
which is the right choice whenever the total work is unknown.

```tsx
<ProgressBar accessibilityLabel="Uploading" value={0.42} />
<ProgressBar accessibilityLabel="Syncing" />
```

`ProgressRing` is the circular, determinate counterpart to the spinner ring. It
shares the spinner's geometry, so a screen can swap an indeterminate spinner for
a progress ring of the same `size` without anything moving. The arc starts at 12
o'clock and fills clockwise.

```tsx
<ProgressRing accessibilityLabel="Storage used" size="lg" value={0.6} />
```

Both publish the percentage through `aria-valuenow` on ARIA's default 0–100
range, so screen readers announce "42%" rather than "0.42". An indeterminate
`ProgressBar` publishes a busy state and no value, which is what ARIA specifies
for unknown progress.

**Gotcha:** react-native-web does **not** translate `accessibilityValue` into
the ARIA range attributes. Setting it alone leaves a web screen reader with a
`progressbar` carrying no value at all. Both meters therefore emit the RN
payload _and_ the literal `aria-value*` DOM props, built together in
`progressValue.ts` so they cannot drift apart. Any new determinate control in
this library needs the same pair.

## Theming

Loaders read colors from `SharedUiThemeProvider`. The animated elements use
`colors.primary` and the tracks use `colors.border2`; both can be overridden per
instance with `color` and `trackColor`.

## Motion

Every shape runs off one linear 0 → 1 `Animated` loop. Per-element stagger comes
from interpolating that single driver rather than from N parallel loops, so
elements cannot drift apart, only one animation is scheduled, and the curves
stay limited to opacity and transform — which is what keeps the loader on the
native driver on iOS and Android.

The curve builders are pure functions so their behaviour is unit-tested
directly:

- `buildWaveRange` — a travelling highlight that peaks at a phase and eases back
  down half a cycle away, wrapping seamlessly. Used for dot brightness and scale,
  bar height, and blade brightness.
- `buildSawtoothRange` — a one-way ramp that restarts each cycle, offset per
  element. Used for the ripple's expanding rings, which hide the reset by fading
  to nothing at the rim.
- `buildDotBounceRange` — three explicit, non-overlapping rise-and-fall windows
  followed by a resting pause. Used by the `dots` variant so only one dot can be
  lifted at a time, even when the JavaScript animation resumes after a delayed
  frame.

Under reduced motion the loop keeps running at 2400ms and each shape animates
brightness alone: dots hold their size, bars hold full height, ripple rings sit
at fixed radii, and the spinner ring fades instead of turning. `blades` never
moves in the first place, so it is the safest variant wherever motion is a
concern.

## Key code

- `Loader.tsx` — the public component, the ring delegation, and the shape switch
- `loaderWave.ts` / `loaderWaveMath.ts` — the shared animation driver and curves
- `loaderDotsMath.ts` — the exclusive bounce windows for the three-dot variant
- `loaderGeometry.ts` — per-shape pixel geometry derived from the box size
- `loaderStyles.ts` — per-variant durations, size resolution, container styles
- `ProgressBar.tsx` / `ProgressRing.tsx` — the determinate counterparts
