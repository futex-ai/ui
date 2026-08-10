# Charts — design

The design/spec behind [`charts-component-family.md`](charts-component-family.md).
It defines the colour system, the layering, the shared data contract, and the
accessibility and interaction rules every chart in `@firna/ui/chart` obeys.

**Status:** proposed (not started). Revised once after an adversarial review;
[§ Resolved review findings](#resolved-review-findings) records what changed.

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
  indexed to a common base. Note this is **not** a ban on shared-axis combo
  charts (bars + a trend line on one scale); see [§ Composition](#composition).
- **A charting dependency.** No `victory`, `recharts`, `d3-shape`. The goal is
  to keep the dependency surface at zero for a package that already asks
  consumers for eight peers — not a claim that those libraries are unsound.
- **Geo/choropleth, chord, ridgeline, 3-D.** Geo needs projection data this
  library has no business shipping; the others fail the method's checks.
- **A data layer.** Every chart is controlled and data-agnostic — it renders
  what it is given and emits callbacks. No fetching, no aggregation, no store.
  The one deliberate exception is documented in [§ Past eight series](#past-eight-series).

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
  /** Reserved state. Never assigned as a series colour by the palette. */
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

**Status is reserved, not immutable.** "Reserved" means the palette never hands
a status colour out as a series identity — it does not mean a brand cannot
retheme it. Like every other token, `charts.status` is overridable through
`createSharedUiTheme`.

**This is a typed breaking change, deliberately.** Adding a required `charts`
key to `SharedUiTheme` breaks any consumer that builds a theme object as a raw
literal instead of calling `createSharedUiTheme`. That mirrors how `colors`
already works (required on the resolved theme, `Partial` on the overrides), so
the supported path is unaffected — but it ships with a release note, not
silently.

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
  secondary encoding (marker shape or direct labels). Five collapses outright
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
1,684 pass the adjacent gates, and 264 of those also validate **four** leading
slots under the harder all-pairs test — one more than the method's own
reference order manages. Of those 264, **24** put two hues clearing 3:1 on
every surface in slots 1–2, which is what keeps the overwhelmingly common one-
and two-series chart free of the relief rule; **4** of those 24 tie at the best
worst-case adjacent CVD (ΔE 8.4):

```
blue,   green,  magenta, yellow, aqua, orange, violet, red   ← chosen
green,  blue,   magenta, yellow, aqua, orange, violet, red
green,  violet, magenta, yellow, aqua, orange, blue,   red
violet, green,  magenta, yellow, aqua, orange, blue,   red
```

The tiebreak among those four is slot 1: blue holds the most even contrast
across all three surfaces (4.42 / 4.27 / 4.62), where green dips to 3.14 in
dark and violet is Juno's own brand hue. Nothing separates them on the gates.

**The trade it makes, stated plainly.** Slot 2 green `#008300` sits in the same
hue family as `status.good` `#0ca30c` — below the method's own ΔE 15 series
floor. That is a real collision, and it is unavoidable: only `blue` and
`violet` are both status-free _and_ ≥3:1 on all three surfaces, and blue↔violet
collapses to ΔE 1.9 under deuteranopia in dark mode, so they can never be
adjacent. **No ordering exists with both leading slots status-free and
high-contrast.** The choice was therefore between a status-adjacent slot 2 and
a sub-3:1 slot 2, and contrast won, because a status annotation only collides
when both appear in one view, whereas low contrast degrades every chart that
uses the slot. The mitigation is the method's standard one: status always ships
with an icon **and** a label, so it never reads as a bare coloured mark. Brands
that routinely pair series with status annotations should override
`charts.series` with one of the 40 validated orderings whose leading two slots
are status-free (e.g. `blue, magenta, yellow, green, violet, orange, aqua,
red`) and accept the relief rule on slot 2 instead.

**Brand adjacency.** Slot 7 violet `#4a3aa7` / `#9085e9` sits near Juno's
`primary` `#6F5BD0`, and slot 2 green near the default theme's sage `primary`
`#4f7864`. A series can therefore read as the brand accent in a dense view.
This is cosmetic rather than a correctness failure — series marks and brand
chrome rarely abut — but it is the first thing to reorder if a surface looks
muddy.

Re-running the enumeration is a scripted, reproducible step
(`scripts/validate-chart-palette.mjs`), and `tests/unit/chartPalette.test.ts`
pins every number above so a future token edit cannot silently regress the
palette — the same guard `darkTheme.test.ts` already gives the neutral tokens.

### Sequential, ordinal, diverging, status

- **Sequential** (continuous magnitude): one hue, blue, 13 steps light→dark
  (100…700), tabled below. Dark mode reads the same steps from the dark end.
  Continuous encoding is the one place the lightest step may recede toward the
  surface, so it is **not** held to the ordinal 2:1 floor. Its consumer is
  `MatrixHeatmap` + `ScaleLegend`; the existing calendar `Heatmap` keeps its
  own primary-tinted ramp and is not retrofitted.

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
- **Status** (reserved state, never assigned as a series): `good #0ca30c`,
  `warning #fab219`, `serious #ec835a`, `critical #d03b3b`. On the light
  surface `warning` (1.83:1) and `serious` (2.64:1) sit below 3:1 **by design** —
  status always ships with an icon **and** a label, so the colour never carries
  meaning alone. On both dark surfaces all four clear 3:1.

### Colour follows the entity

Slots are assigned from a series' stable `id`, not its array index, so hiding a
series in the legend or filtering upstream never repaints the survivors.

### Past eight series

Never generate a ninth hue — a cycled palette produces two indistinguishable
series. The behaviour past eight is **per chart type**, because folding a tail
into "Other" is an aggregation and is only honest for some forms:

| Form                              | Behaviour past 8 series                                                                                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stacked bar, stacked/percent area | Fold the tail into a summed `deemphasis` "Other" series. This is the one sanctioned aggregation, and it is documented as such.                                                             |
| Line, grouped bar, scatter        | **No summing** — a summed "Other" line can dwarf every real series and means nothing for grouped bars. Render the tail in `deemphasis` without merging, and `devWarn` recommending facets. |

---

## Architecture

Five layers, each independently testable, following the `DataGrid` pattern of
pure models under thin views.

**1 — Pure math (no React, `node --test`-able).** The bulk of the logic.

- `scale/`: `linearScale`, `bandScale`, `timeScale`, `niceTicks` (round 0 /
  1,000 / 2,000 tick selection), `niceTimeTicks`, `clampDomain`.
- `series/`: normalize input to a canonical internal shape, `stackSeries`,
  `percentStack`, `divergingSplit`, `binValues`, `foldToOther`.
- `geometry/`: path builders — `linePath`, `monotoneCubicPath`, `stepPath`,
  `areaPath`, `arcPath`, `pieSlices`, `roundedBarPath` (4px rounded data-end,
  square at the baseline), `waterfallSteps`, `funnelTrapezoids`.
- `chartPalette.ts`: id → slot assignment, emphasis and status overrides, the
  eight-slot cap.
- `chartLayout.ts`: measured container size → plot rect, axis bands, legend
  band.

**2 — Interaction hooks.**

- `useChartHover` (web): `pointermove` over the plot → nearest x index.
- `useChartScrub` (native): press-and-drag scrub via RN core `PanResponder` —
  not the optional `react-native-gesture-handler` peer, so charts work in a
  bare install. See [§ Responder negotiation](#responder-negotiation).
- `useChartKeyboard`: roving tabindex over x positions or marks, reusing the
  existing `keyboardNavigation` helpers exactly as `Heatmap` does.
- `useSeriesVisibility`: legend toggle-to-isolate, controlled + uncontrolled.

**3 — Chrome, built from this library's primitives** (`View` / `Text`, not SVG
text — real text layout, theming, and a11y roles): `ChartFrame` (measures via
`onLayout`, owns title/caption, empty state, the loading hold, and the
table-view toggle), `ChartAxis`, `ChartLegend`, `ChartTooltip`,
`ChartTableView` (on the existing `Table`), `ScaleLegend`.

**4 — Marks in SVG.** `react-native-svg` is already a **required** peer
dependency used by `Spinner`, `ProgressRing`, `Skeleton` and `AnimatedBorder`,
so this adds no dependency. SVG buys real curves, arcs and gradients identically
on both platforms.

**5 — A `Pressable` hit layer over the marks.** Absolutely-positioned,
transparent targets — never the painted pixels. This is what makes the existing
focus-ring, roving-tabindex and `testID` conventions work unchanged. Target
sizing and its density limits are specified in [§ Density](#density).

### The tooltip is not a Popover

`ChartTooltip` is a plain absolutely-positioned `View` inside `ChartFrame`,
`pointerEvents="none"`, clamped to the plot rect. It is **not** built on
`Popover`, despite Popover being this library's tooltip primitive:

- On **native**, `Popover` renders through `DropdownPortal`, which is a
  transparent full-screen `Modal` with a scrim `Pressable` that swallows outside
  taps plus `accessibilityViewIsModal` on the surface. Opening it mid-scrub
  would steal every subsequent touch from the scrub `PanResponder` — the native
  interaction would simply stop working.
- On **web**, `Popover` requires a `trigger` render prop and anchors to a
  measured wrapper via `useDropdownAnchor` (`measureInWindow` behind a
  `setTimeout(0)`). A crosshair tooltip re-anchors on every pointer move, so
  this would mean per-index remounts and measure churn.

Charts are not inside `overflow: hidden` containers, so no portal is needed at
all. `Popover` remains the right tool elsewhere (e.g. a legend overflow menu).

### Composition

Marks are rendered by internal layer components over a shared frame/scale, so a
shared-axis combo (volume bars + trend line) is a layering question, not a
rewrite. v1 exposes only the monolithic chart components; the seam exists so
adding combo support later is additive rather than a breaking decomposition.

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
  /** Band labels, or numeric/epoch positions when `xScale` is not "band". */
  categories: readonly (string | number)[];
  /** Defaults to "band". "time" and "linear" space x by value, not evenly. */
  xScale?: "band" | "time" | "linear";
  series: readonly ChartSeries[];
  title?: string;
  caption?: string;
  /** Total frame height, inclusive of the axis, legend and title bands. */
  height?: number;
  /** Width for SSR and tests, before `onLayout` reports the real one. */
  defaultWidth?: number;
  loading?: boolean;
  emptyState?: ReactNode;
  /** Defaults to `true` when `series.length >= 2`. */
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
area, waterfall, funnel, matrix heatmap). `ScatterChart` (`{ x, y, size? }`
points) and the figures (`StatTile`, `Sparkline`, `GaugeChart`, `BulletChart`)
take their own data prop and reuse the rest of `ChartCommonProps` unchanged.

**`height` is the total frame height.** `chartLayout` subtracts the axis, legend
and title bands to derive the plot rect. Sizing the plot instead would make the
frame's real height unpredictable to surrounding layout — which is exactly what
produces the nested-scrollbar anti-pattern.

**A time axis is in v1 deliberately.** Irregular series — missed days, mixed
granularity — are the most common real line-chart input, and band spacing
renders them wrong. Retrofitting `xScale` after the charts ship would touch
every props type, geometry path, hover snap and keyboard model.

**`showLegend` keys off `series.length`, not visible count.** Keying off visible
series would unmount the legend once isolate leaves one series showing, removing
the only control that can un-hide the rest and dropping keyboard focus on an
unmounted entry.

---

## Interaction

| Surface                     | Behaviour                                                                                                                                          |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web, line/area              | Vertical crosshair snaps to the nearest x; **one tooltip listing every visible series** at that x, so the pointer never has to land on a 2px line. |
| Web, bar/scatter/cell/slice | The mark is the hit target; it lifts on hover; its own tooltip shows category + value.                                                             |
| Native                      | No hover: press-and-drag **scrubs** the crosshair along the plot; a tap selects a mark.                                                            |
| Keyboard                    | The plot is a single tab stop with a roving index. Arrows move, Home/End jump to the ends, Enter activates.                                        |
| Legend                      | Press or Enter on a legend entry toggles that series; the rest keep their colours.                                                                 |
| Reduced motion              | Entry animation is opt-in and gated on the existing `useReducedMotion`.                                                                            |

### Responder negotiation

On native the per-mark `Pressable`s claim the responder on touch-start, so the
scrub gesture must take it deliberately rather than by accident:

- The scrub claims the responder only from `onMoveShouldSetPanResponderCapture`
  after a **horizontal-dominant** move past a small threshold (~8px). A tap, or
  a vertical-dominant drag, never reaches it.
- Vertical-dominant drags are left to an enclosing `ScrollView`, so a chart
  inside a scrolling dashboard still scrolls normally.
- Taps fall through to the mark `Pressable`s, which stay the selection channel.

### Density

The "hit target bigger than the mark" rule is not automatic — it has limits that
the components enforce rather than assume:

- **Bars.** Per-bar `Pressable`s are used while the band is wide enough for a
  24px target. Past that threshold the chart switches to a nearest-x hit layer
  (one target per x position, like the crosshair), instead of stacking
  overlapping Pressables where the last sibling silently wins.
- **Keyboard.** Roving focus over every x position is unusable past a few dozen
  stops. Past a threshold the roving model switches to coarse stops with
  PageUp/PageDown-style jumps, rather than emitting a focus stop per point.
- **Scatter.** Dense scatter uses a nearest-point layer, which means it has no
  per-point `Pressable` and therefore **no per-point accessible label**. Its
  screen-reader story is table-view-first, and that is stated in its README
  rather than left implicit.

---

## Accessibility

Building on the `Heatmap` precedent, which already solves most of this:

- Each chart is a labelled `role="group"`; marks carry their own accessible
  label (`"Q3, Revenue: 12,400"`), so nothing is conveyed by colour alone.
- **Tooltips are decorative and `aria-hidden`.** A portaled, never-focused
  tooltip is not announced by screen readers — `aria-controls` does not make
  content readable. So the tooltip is never the only carrier of a value:
  - On per-mark charts, the mark's own accessible label carries it.
  - On crosshair charts, **the focused x-stop's accessible label enumerates
    every visible series at that x** — the same content the tooltip shows.
  - Crosshair and scrub movement announce through the existing
    `src/announcer.ts` live region, debounced.
- A **table-view twin** for every chart, rendered with the existing `Table`.
- **A legend whenever two or more series are provided**, plus selective direct
  labels — never a number on every point.
- **Text never wears the series colour.** Values, labels and legend text use
  `ink` / `muted`; a coloured swatch or line-key beside the text carries the
  identity. The one exception is a label set inside a filled segment, which
  picks `onSolid` or `ink` by the fill's luminance.
- Labels that do not fit are moved outside the mark or dropped to the tooltip —
  never clipped, never `overflow: hidden`.
- A texture channel (45° / 135° hatch) for `forced-colors`, print and the
  full-CVD case. Opt-in, never decorative.
- The axe sweep already gating `npm run verify` auto-discovers every story from
  Storybook's `index.json`, so new chart stories are covered with no list to
  maintain.

### First render

`onLayout` reports width only after the first layout pass, and under RNW SSR not
until hydration. So `ChartFrame` renders its chrome (frame, title, axis band) at
the declared `height` immediately and holds the **marks** at opacity 0 — mounted,
not unmounted — until the first measurement lands. `defaultWidth` supplies a
width for SSR and unit tests. This is the same "hold the frame, never jump"
discipline as the `loading` behaviour.

---

## Testing

- **Unit** (`node --test`): every pure module — scales (band, time, linear),
  ticks, stacking, percent-stack, binning, path geometry, layout, palette
  assignment, and `chartPalette.test.ts` pinning the validated ΔE and contrast
  numbers.
- **Storybook**: a story per chart family; the living spec, and what the axe
  sweep and `storybook:build` gate run against.
- **Playwright**: crosshair tracking, keyboard roving, legend isolate, tooltip
  content duplicated in mark labels, table-view toggle. Playwright drives the
  **web** Storybook build only — native scrub is a manual on-device item, not a
  CI gate.
- **`testIDForwarding.test.ts`** and **`packageExports.test.ts`**: updated in the
  milestone that ships the component, not deferred.

---

## Resolved review findings

An adversarial review of the first draft produced sixteen findings. All were
accepted; the material ones and their resolutions:

1. **Tooltip on `Popover` would break native scrub** — verified against
   `DropdownPortal.tsx`. Replaced with an in-frame, `pointerEvents="none"` view.
2. **Tooltips are not announced** — the a11y section now specifies mark labels,
   x-stop enumeration and the `announcer` live region.
3. **`timeScale` was unreachable** through a `string[]` contract — `xScale` and
   a widened `categories` are now in v1.
4. **Slot-2 green collides with `status.good`** — the "non-status-colliding"
   claim was false and is removed; the real trade is now documented, along with
   the proof that no better ordering exists.
5. **`height` was defined two ways** — it is the total frame height.
6. **`showLegend` could strand the user** after isolate — keyed off provided
   series.
7. **`foldToOther` contradicted the no-aggregation non-goal** — folding is now
   per-form and named as the one sanctioned exception.
8. **Sequential ramp and `ScaleLegend` had no consumer** — `MatrixHeatmap` added.
9. **Density, responder negotiation and first-render measurement** were unspecified
   — each now has its own section.
