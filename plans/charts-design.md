# Charts — design

The design/spec behind [`charts-component-family.md`](charts-component-family.md).
It defines the colour system, the layering, the shared data contract, and the
accessibility and interaction rules every chart in `@firna/ui/chart` obeys.

**Status:** proposed (not started).

**Method:** the colour system, form heuristic, mark specs and anti-pattern list
follow the shared data-visualization method. Every colour value below was
produced by running that method's six-checks validator against **this library's
real surfaces** — not copied and not eyeballed. The derivation is reproducible;
see [§ Colour system](#colour-system).

---

## Goal

Ship a cross-platform (React Native + React Native Web) chart family built from
this library's own primitives and `react-native-svg` — **no charting
dependency**. Charts are interactive by default: hover/scrub crosshairs,
per-mark tooltips, keyboard-navigable marks, and toggle-to-isolate legends.

## Non-goals

- **Dual-axis charts.** Two y-scales on one plot invent correlations that are
  not in the data. There is no `yAxis2` prop anywhere in the API — the shape
  makes it unrepresentable. Two measures → two charts, small multiples, or both
  indexed to a common base.
- **A charting dependency.** No `victory`, `recharts`, `d3-shape`. Scale, tick
  and path math are pure local modules (`d3` would pull a web-only DOM
  dependency chain into a React Native package).
- **Geo/choropleth, chord, ridgeline, 3-D.** Geo needs projection data this
  library has no business shipping; the others fail the method's checks.
- **A data layer.** Every chart is controlled and data-agnostic — it renders
  what it is given and emits callbacks. No fetching, no aggregation, no store.

---

## Colour system

The theme carries **no series colours today** — only `primary`, `amber` and
`rose`. Nothing multi-series can be built until that gap is closed, so the
colour system is milestone 1 and lands before any chart.

### Where it lives

A new top-level `charts` key on `SharedUiTheme`, sitting beside `colors` /
`fonts` / `radii` and merged the same way by `createSharedUiTheme`, so a brand
overrides any slot without forking a component:

```ts
export type SharedUiChartColors = {
  /** Categorical identity, slots 1..8. Assigned in order, never cycled. */
  series: readonly string[];
  /** Continuous magnitude, light → dark (13 steps, one hue). */
  sequential: readonly string[];
  /** Discrete ordered marks — funnel stages, tiers, buckets (5 steps). */
  ordinal: readonly string[];
  /** Polarity. Two poles that read as opposite + a neutral midpoint. */
  diverging: { negative: string; neutral: string; positive: string };
  /** Reserved state. Never reusable as a series colour. */
  status: { good: string; warning: string; serious: string; critical: string };
  /** Chart furniture, mapped to existing neutral tokens. */
  grid: string;
  axis: string;
  label: string;
  surface: string;
  /** "Other", and the grey of the un-emphasised series in an emphasis chart. */
  deemphasis: string;
};
```

`grid` / `axis` / `label` / `surface` / `deemphasis` default to the existing
`border` / `border2` / `muted` / `surface` / `muted` tokens, so they already
track all four shipped themes with no new values to keep in sync.

### Categorical series palette

Slot order — **`blue, green, magenta, yellow, aqua, orange, violet, red`**:

| Slot | Hue     | Light (on `#ffffff`) | Dark (on `#212522` / `#1e1c25`) |
| ---- | ------- | -------------------- | ------------------------------- |
| 1    | blue    | `#2a78d6` — 4.42:1   | `#3987e5` — 4.27 / 4.62:1       |
| 2    | green   | `#008300` — 4.95:1   | `#008300` — 3.14 / 3.40:1       |
| 3    | magenta | `#e87ba4` — 2.69:1 ‡ | `#d55181` — 3.94 / 4.27:1       |
| 4    | yellow  | `#eda100` — 2.17:1 ‡ | `#c98500` — 5.06 / 5.48:1       |
| 5    | aqua    | `#1baf7a` — 2.82:1 ‡ | `#199e70` — 4.56 / 4.94:1       |
| 6    | orange  | `#eb6834` — 3.20:1   | `#d95926` — 4.00 / 4.33:1       |
| 7    | violet  | `#4a3aa7` — 8.56:1   | `#9085e9` — 4.97 / 5.38:1       |
| 8    | red     | `#e34948` — 3.95:1   | `#e66767` — 4.81 / 5.21:1       |

Measured results, all four themes:

- **Adjacent gates** (bars, stacks, lines — only neighbours touch): worst CVD
  ΔE **9.1 light / 8.4 dark** against the ≥ 8 target; worst normal-vision ΔE
  **19.6 / 19.3** against the ≥ 15 hard floor. Passes in every mode.
- **All-pairs gates** (scatter, bubble, small multiples — any two marks can be
  neighbours): **3 slots pass cleanly everywhere** (CVD ΔE 13.0 both modes).
  **4 slots are the hard cap** — light stays clean (13.0) but dark lands at 6.9,
  inside the 6–8 floor band, so a 4-series all-pairs chart **must** ship
  secondary encoding (direct labels or marker shape). Five collapses outright
  in dark (ΔE 1.6, green ↔ aqua). The charts affected enforce this in code.
- **Contrast.** Slots 1–2 clear 3:1 on every surface, so the common 1–2 series
  chart never needs relief. ‡ marks the three light-mode slots below 3:1: those
  invoke the relief rule — visible direct labels or the table view, both of
  which this family ships by default. In dark mode all eight clear 3:1.

**How this order was chosen.** The eight hues and their steps are the method's
documented instance, used **unchanged** — zero new hex values. Only the _order_
was re-derived, which the method explicitly requires when targeting a new
system's surfaces. All 40,320 orderings were enumerated and validated against
this library's three distinct surfaces (`#ffffff`, `#212522`, `#1e1c25`);
1,684 pass the adjacent gates, 264 of those also validate **four** leading
slots all-pairs, and this order is the one among them that puts the two
highest-contrast, non-status-colliding hues in slots 1–2. It beats the
method's own reference order, which reaches all-pairs depth 3 and opens with a
slot-2 orange that sits close to status-serious.

Re-running the enumeration is a scripted, reproducible step
(`scripts/validate-chart-palette.mjs`), and `tests/unit/chartPalette.test.ts`
pins every number above so a future token edit cannot silently regress the
palette — the same guard `darkTheme.test.ts` already gives the neutral tokens.

### Sequential, ordinal, diverging, status

- **Sequential** (continuous magnitude — heat cells, choropleth-style fills):
  one hue, blue, 13 steps light→dark (100…700), listed in full in the table
  below. Dark mode reads the same steps from the dark end. Continuous encoding
  is the one place the lightest step may recede toward the surface, so it is
  **not** held to the ordinal 2:1 floor. The existing `Heatmap` keeps its
  primary-tinted ramp; this is for charts that need an absolute scale with a
  `ScaleLegend`.

  | step | hex       | step | hex       | step | hex       | step | hex       |
  | ---- | --------- | ---- | --------- | ---- | --------- | ---- | --------- |
  | 100  | `#cde2fb` | 250  | `#86b6ef` | 400  | `#3987e5` | 550  | `#1c5cab` |
  | 150  | `#b7d3f6` | 300  | `#6da7ec` | 450  | `#2a78d6` | 600  | `#184f95` |
  | 200  | `#9ec5f4` | 350  | `#5598e7` | 500  | `#256abf` | 650  | `#104281` |
  |      |           |      |           |      |           | 700  | `#0d366b` |

- **Ordinal** (discrete ordered marks — funnel stages, tiers, age bands): five
  steps, validated with the ordinal checks (monotone lightness, adjacent ΔL ≥
  0.06, light-end ≥ 2:1). Light `#86b6ef, #5598e7, #2a78d6, #1c5cab, #104281`
  (light-end 2.11:1); dark `#1c5cab, #2a78d6, #5598e7, #86b6ef, #b7d3f6`
  (light-end 2.34:1 on `#212522`, 2.54:1 on `#1e1c25`). The dark ramp
  deliberately stops at step 550 — step 600 measures 1.92:1 on the default dark
  surface and fails the floor.
- **Diverging** (polarity — above/below a baseline, Δ to target): blue ↔ red,
  warm/cool poles that read as opposite, with a **neutral grey** midpoint taken
  from each theme's `soft` token (light `#eef2ed` / juno `#F5F5F5`; dark
  `#252a25` / juno dark `#1f1d27`). Polarity is fixed: **`negative` is the red
  pole, `positive` the blue pole**, taken from slots 8 and 1 of the mode's
  series palette. Never a hue at the midpoint, and never two cool poles.
- **Status** (reserved state, never themed, never a series): `good #0ca30c`,
  `warning #fab219`, `serious #ec835a`, `critical #d03b3b`. On the light
  surface `warning` (1.83:1) and `serious` (2.64:1) sit below 3:1 **by design** —
  status always ships with an icon **and** a label, so the colour never carries
  meaning alone. On both dark surfaces all four clear 3:1.

### The two rules the API enforces

1. **Colour follows the entity, never its rank.** Slots are assigned from a
   series' stable `id`, not its array index, so hiding a series in the legend
   or filtering upstream never repaints the survivors.
2. **Never generate a ninth hue.** Past eight series the chart folds the tail
   into a `deemphasis`-coloured "Other" and emits a `devWarn`. Cycling the
   palette would produce two indistinguishable series.

---

## Architecture

Five layers, each independently testable, following the `DataGrid` pattern of
pure models under thin views.

**1 — Pure math (no React, `node --test`-able).** The bulk of the logic.

- `scale/`: `linearScale`, `bandScale`, `timeScale`, `niceTicks` (round 0 /
  1,000 / 2,000 tick selection), `clampDomain`.
- `series/`: normalize input to a canonical internal shape, `stackSeries`,
  `percentStack`, `divergingSplit`, `binValues`, `foldToOther`.
- `geometry/`: path builders — `linePath`, `monotoneCubicPath`, `areaPath`,
  `arcPath`, `pieSlices`, `roundedBarPath` (4px rounded data-end, square at the
  baseline), `waterfallSteps`, `funnelTrapezoids`.
- `chartPalette.ts`: id → slot assignment, emphasis and status overrides,
  the eight-slot cap.
- `chartLayout.ts`: measured container size → plot rect, axis bands, legend
  band. Guarantees the axis band is **inside** the frame's height so a fixed
  height never produces a nested scrollbar.

**2 — Interaction hooks.**

- `useChartHover` (web): `pointermove` over the plot → nearest x index.
- `useChartScrub` (native): press-and-drag scrub via RN core `PanResponder` —
  not the optional `react-native-gesture-handler` peer, so charts work in a bare
  install.
- `useChartKeyboard`: roving tabindex over x positions or marks, reusing the
  existing `keyboardNavigation` helpers exactly as `Heatmap` does.
- `useSeriesVisibility`: legend toggle-to-isolate, controlled + uncontrolled.

**3 — Chrome, built from this library's primitives** (`View` / `Text`, not SVG
text — real text layout, theming, and a11y roles): `ChartFrame` (measures via
`onLayout`, owns title/caption, empty state, the loading hold, and the
table-view toggle), `ChartAxis`, `ChartLegend`, `ChartTooltip` (on the existing
`Popover` portal), `ChartTableView` (on the existing `Table`), `ScaleLegend`.

**4 — Marks in SVG.** `react-native-svg` is already a **required** peer
dependency used by `Spinner`, `ProgressRing`, `Skeleton` and `AnimatedBorder`,
so this adds no dependency. SVG buys real curves, arcs and gradients identically
on both platforms.

**5 — A `Pressable` hit layer over the marks.** Absolutely-positioned,
transparent, ≥ 24px targets — never the painted pixels. This is what makes the
existing focus-ring, roving-tabindex and `testID` conventions work unchanged,
and it satisfies the "hit target bigger than the mark" rule for free. Dense
scatter gets a nearest-point layer instead of per-point rects.

### Directory

One family, one subpath export — `src/chart/` → `@firna/ui/chart`, matching
`data-grid` and `rich-text`. Files stay under ~300 lines; the pure-math
subdirectories keep that easy.

---

## Shared data contract

```ts
export type ChartSeries = {
  /** Stable identity. Drives the colour slot — never the array index. */
  id: string;
  /** Legend, tooltip and table-view label. Defaults to `id`. */
  label?: string;
  /** One value per category; `null` is a gap, not a zero. */
  data: readonly (number | null)[];
  /** Per-instance override, for emphasis and status charts. */
  color?: string;
};

export type ChartCommonProps = {
  categories: readonly string[];
  series: readonly ChartSeries[];
  title?: string;
  caption?: string;
  /** Plot height; the frame adds the axis band on top of it. */
  height?: number;
  loading?: boolean;
  emptyState?: ReactNode;
  /** Defaults to `true` when two or more series are visible. */
  showLegend?: boolean;
  hiddenSeriesIds?: readonly string[];
  onHiddenSeriesIdsChange?: (ids: string[]) => void;
  activeIndex?: number | null;
  onActiveIndexChange?: (index: number | null) => void;
  onDatumPress?: (ref: {
    seriesId: string;
    index: number;
    value: number | null;
  }) => void;
  valueFormat?: (value: number) => string;
  accessibilityLabel?: string;
  disableFocusRing?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};
```

Every chart is controlled-optional: pass `activeIndex` / `hiddenSeriesIds` to
drive it, omit them and it keeps internal state — the pattern `DataGrid` and
`SortableList` already use.

`categories` + `series` is the shape for the category-indexed charts (bar, line,
area, waterfall, dumbbell, funnel, donut). The two charts whose data is not
category-indexed — `ScatterChart` (`{ x, y, size? }` points) and the figures
(`StatTile`, `Sparkline`, `GaugeChart`, `BulletChart`) — take their own data
prop and reuse the rest of `ChartCommonProps` unchanged.

---

## Interaction

| Surface                     | Behaviour                                                                                                                                          |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web, line/area              | Vertical crosshair snaps to the nearest x; **one tooltip listing every visible series** at that x, so the pointer never has to land on a 2px line. |
| Web, bar/scatter/cell/slice | The mark is the hit target; it lifts on hover; its own tooltip shows category + value.                                                             |
| Native                      | No hover: press-and-drag **scrubs** the crosshair along the plot; a tap selects a mark.                                                            |
| Keyboard                    | The plot is a single tab stop with a roving index. Arrows move, Home/End jump to the ends, Enter activates. Focus shows exactly what hover shows.  |
| Legend                      | Press or Enter on a legend entry toggles that series; the rest keep their colours.                                                                 |
| Reduced motion              | Entry animation is opt-in and gated on the existing `useReducedMotion`.                                                                            |

**Tooltips enhance, they never gate.** Every value a tooltip shows is also
reachable through direct labels or the table view — which is why the table view
is part of `ChartFrame` rather than an optional extra.

## Accessibility

Building on the `Heatmap` precedent, which already solves most of this:

- Each chart is a labelled `role="group"`; marks carry their own accessible
  label (`"Q3, Revenue: 12,400"`), so nothing is conveyed by colour alone.
- A **table-view twin** for every chart, rendered with the existing `Table`.
- **A legend whenever two or more series are visible**, plus selective direct
  labels — never a number on every point.
- **Text never wears the series colour.** Values, labels and legend text use
  `ink` / `muted`; a coloured swatch or line-key beside the text carries the
  identity. The one exception is a label set inside a filled segment, which
  picks `onSolid` or `ink` by the fill's luminance.
- Labels that do not fit are moved outside the mark or dropped to the tooltip —
  never clipped, never `overflow: hidden`.
- A texture channel (45° / 135° hatch) for `forced-colors`, print and the
  full-CVD case. Opt-in, never decorative.
- The axe sweep already gating `npm run verify` covers every new story.

## Testing

- **Unit** (`node --test`): every pure module — scales, ticks, stacking,
  percent-stack, path geometry, layout, palette assignment, and
  `chartPalette.test.ts` pinning the validated ΔE and contrast numbers.
- **Storybook**: a story per chart family; the living spec, and what the axe
  sweep and `storybook:build` gate run against.
- **Playwright**: crosshair tracking, keyboard roving, legend isolate, tooltip
  parity between hover and focus, table-view toggle.
- **`testIDForwarding.test.ts`**: every new public component added, per the
  repo's existing convention.
