# Charts component family

A new `@firna/ui/chart` family: interactive, cross-platform charts built from
this library's own primitives and `react-native-svg`, with **no charting
dependency**. Design and colour derivation live in
[`charts-design.md`](charts-design.md); this file is the build order.

**Status:** in progress — M1–M4 delivered, `npm run verify` green. Revised
once after an adversarial review.

**Scope:** foundations + the everyday charts + the round-out set. The
specialist tail (candlestick, box plot, gantt, treemap, sankey, radar, combo) is
documented as a backlog in [M9](#m9--backlog-not-built) and not built.

**What exists already:** `Heatmap` (calendar grid — kept as-is, not retrofitted),
`ProgressBar` / `ProgressRing` (meters), `Table` (the table-view twin),
`announcer` (the live region for scrub/crosshair), `keyboardNavigation` (roving
tabindex), `useReducedMotion`. This plan reuses all of them rather than
reimplementing. **`Popover` is deliberately not reused** — see the design doc's
[§ The tooltip is not a Popover](charts-design.md#the-tooltip-is-not-a-popover).

**Per-milestone definition of done.** Every milestone that ships a public
component also, in the same milestone: writes/updates `src/chart/README.md`,
adds its components to `tests/unit/testIDForwarding.test.ts`, and leaves
`npm run verify` green. These are not deferred to a polish pass.

---

## Milestones

Each milestone ends in a working, shippable library with a rendering Storybook
story. Tick items off here as they land; append newly discovered TODOs under the
relevant milestone.

### M1 — Chart colour system

The theme gains validated series/sequential/ordinal/diverging/status scales.
Ships on its own: a token addition, no chart yet.

- [x] `theme.tsx`: add the `charts` key and `SharedUiChartColors` type; merge it
      in `createSharedUiTheme` alongside `colors`/`fonts`/`radii`.
- [x] Populate `charts` for all four shipped themes (default + juno, light +
      dark). `grid`/`axis`/`label`/`surface`/`deemphasis` derive from the
      existing `border`/`border2`/`muted`/`surface`/`muted` tokens.
- [x] Note the **typed breaking change**: `SharedUiTheme` gains a required key,
      so raw theme literals need `createSharedUiTheme`. Recorded in the commit
      footer rather than `CHANGELOG.md` — release-please generates that file, so
      a hand-written entry would be overwritten at the next release.
- [x] `src/chart/chartPalette.ts`: `seriesColor(id, order)` assigning slots from
      a stable id (never the array index), emphasis and status overrides, and the
      per-form eight-slot cap (fold for stacks, `devWarn`-only for line/grouped/scatter).
- [x] `scripts/validate-chart-palette.mjs`: re-runs the six checks against all
      three real surfaces (`#ffffff`, `#212522`, `#1e1c25`), plus the ordinal
      checks and the all-pairs cap. Reproduces the derivation, not just the result.
- [x] `tests/unit/chartPalette.test.ts`: pin the measured numbers — adjacent CVD
      ΔE 9.1 light / 8.4 dark, normal-vision 19.6 / 19.3, the 3-clean / 4-capped
      all-pairs depth, and every documented contrast ratio. Mirrors
      `darkTheme.test.ts`.
- [x] Story `Chart/Palette`: the eight slots, both ramps, the diverging pair and
      the status scale, in light and dark.
- [x] Gate: `npm run verify` green. (The first attempt could not finish —
      the machine's data volume was at 100% and Playwright ran out of space
      recording traces. Re-ran green once space was freed.)

### M2 — Foundations: scales, layout, frame, axes

The measuring, scaling and framing layer. Ends with a framed, axed, empty plot
rendering in Storybook. Legend and tooltip are deliberately **not** here — they
are built alongside their first real consumer in M3/M4 rather than speculatively.

- [x] `src/chart/` + `index.ts` barrel; add the `./chart` subpath export to
      `package.json` and `src/index.ts`.
- [x] **Update `tests/unit/packageExports.test.ts`** — it `deepEqual`s the exact
      exports-key list, so the suite fails without this.
- [x] `scale/`: `linearScale`, `bandScale`, `timeScale`, `niceTicks`,
      `niceTimeTicks`, `clampDomain` — pure, unit-tested.
- [x] `series/`: canonical normalize, `stackSeries`, `percentStack`,
      `divergingSplit`, `binValues`, `foldToOther` — `null` is a gap, never a zero.
- [x] `chartLayout.ts`: measured size → plot rect. **`height` is the total frame
      height**; layout subtracts the axis/legend/title bands from it.
- [x] `ChartFrame.tsx`: `onLayout` measurement, title/caption, empty state, the
      loading hold (previous render at reduced opacity — no skeleton flash), the
      table-view toggle, and the **first-render hold** (chrome renders at the
      declared height; marks held at opacity 0 until measured; `defaultWidth`
      for SSR and tests).
- [x] `ChartAxis.tsx`: hairline **solid** grid and baseline (never dashed),
      `tabular-nums` ticks in `label` ink; band, time and linear tick rendering.
- [x] `ChartTableView.tsx`: the WCAG-clean twin, on the existing `Table`.
- [x] Unit tests: `chartScale.test.ts`, `chartSeries.test.ts`,
      `chartLayout.test.ts` (empty data, single point, all-null series, negative
      domains, zero-width container, irregular time domains).
- [x] Story `Chart/Foundations` (framed / empty / loading-hold / dark); axe clean.
- [x] `src/chart/README.md` + `testIDForwarding.test.ts` entries (per-milestone DoD).
- [x] Added `Line`/`G`/`Polygon`/`ClipPath` to `scripts/package-smoke-stubs.mjs` —
      the stubbed `react-native-svg` lacked `Line`, so the built package failed
      to import. Found by `test:package`.
- [x] Gate: `npm run verify` green (765 unit tests, 228 browser tests).

### M3 — BarChart (+ legend, + tooltip)

Columns and bars: grouped, stacked, 100% stacked, and diverging about a
baseline. The legend and tooltip land here, against a real consumer.

- [x] `BarChart.tsx` + `barGeometry.ts`: `orientation`, `grouped` / `stacked` /
      `percent` / `diverging` modes.
- [x] Mark specs: bars capped at **24px** thick, **4px rounded data-end, square
      at the baseline**, a **2px surface gap** between touching bars and between
      every stacked segment. No borders drawn around marks.
- [x] `ChartLegend.tsx` + `useSeriesVisibility.ts`: rect key for bars/areas,
      line key for lines; toggle-to-isolate; keyboard operable; controlled +
      uncontrolled. **Shown whenever `series.length >= 2`** — never unmounted
      mid-isolate.
- [x] `ChartTooltip.tsx`: an absolutely-positioned, `pointerEvents="none"`,
      `aria-hidden` view inside `ChartFrame`, clamped to the plot rect. **Not**
      a `Popover`. Value leads, series name follows; line keys, not boxes; names
      inserted as text, never markup.
- [x] Hit layer: per-bar `Pressable` while the band affords a 24px target,
      switching to a nearest-x layer past that density threshold.
- [x] Keyboard: roving index across bars; Enter fires `onDatumPress`; coarse
      stops past the density threshold.
- [x] Direct labels **measured before placement** — inside only when they fit
      with padding, otherwise outside the bar end, otherwise the tooltip. Never clipped.
- [x] Unit tests for stacking, percent-stacking, diverging split, label fit, and
      the density threshold switch.
- [x] Stories: `Grouped`, `Stacked`, `Percent`, `Diverging`, `Horizontal`.
- [x] Playwright (`tests/browser/chart.spec.ts`, 9 tests): hover tooltip,
      keyboard roving + clamping, legend isolate keeping survivor hues, the
      legend surviving isolate-to-one, table twin, empty frame; axe clean.
- [x] `src/chart/chartAria.ts` — **RNW emits neither `aria-checked` for
      `role="switch"` nor `aria-expanded` for a disclosure button** from
      `accessibilityState`. Both are now spread as literal props, the same
      route `progressValue.ts` takes for `aria-value*`. Found by the new
      browser tests.
- [x] Legend structure is `list > listitem > switch`; a switch directly
      inside a list fails axe's `aria-required-children`. Found by the sweep.
- [x] Gate: `npm run verify` green (783 unit tests, 237 browser tests).

### M4 — LineChart + AreaChart

Trend over time, with the crosshair interaction that makes multi-series
readable.

- [x] `LineChart.tsx`: multi-series, **2px** stroke with round join/cap,
      `curve="linear" | "monotone" | "step"`, ≥8px markers with a **2px surface
      ring**, `null`-aware gaps, reference/threshold lines.
- [x] `AreaChart.tsx`: single, stacked and 100% stacked; fill at **~10%
      opacity** with the band edge drawn as a line.
- [x] `useChartHover` (web): crosshair snapping to the nearest x; **one tooltip
      listing every visible series** at that x.
- [x] `useChartScrub` (native): `PanResponder` claiming the responder only from
      `onMoveShouldSetPanResponderCapture` after a horizontal-dominant ~8px move,
      so taps reach the marks and vertical drags reach an enclosing `ScrollView`.
- [x] Keyboard + SR: the focused x-stop's accessible label **enumerates every
      visible series** at that x; movement announces through `announcer`,
      debounced.
- [x] Selective direct end-labels with collision handling — leader lines or fall
      back to the legend; never stacked labels.
- [x] Unit tests: path geometry, monotone-cubic monotonicity, step paths, gap
      handling, nearest-index lookup, irregular time spacing.
- [x] Stories: `Line`, `MultiSeries`, `Area`, `StackedArea`, `Stepped`,
      `TimeAxis`, `WithThreshold`.
- [x] Playwright (web): crosshair reads every series, focus parity with hover,
      gaps break the stroke, an irregular time axis spaces by date not index,
      stacked-area bands. **Native scrub stays a manual on-device item.**
- [x] `PanResponder` added to `scripts/package-smoke-stubs.mjs` — the stub
      lacked it, so the built package failed to import. Found by `test:package`.
- [x] Gate: `npm run verify` green (800 unit tests, 242 browser tests).

### M5 — Sparkline + StatTile

The "it isn't a chart" forms — the honest answer to most single-number requests.

- [ ] `Sparkline.tsx`: line / bar / win-loss, no axes, no legend, inline sizing.
- [ ] `StatTile.tsx`: `label` · `value` (auto-compact 1,284 / 12.9K / $4.2M,
      **proportional** figures, never `tabular-nums`) · `delta` (signed, vs a
      named period, coloured by direction × whether up is good) · optional
      sparkline in `deemphasis` with the current period in the accent.
- [ ] `StatTileRow.tsx`: the KPI row layout.
- [ ] Unit tests: compact formatting, delta direction/goodness, tile contract.
- [ ] Stories: `Sparkline`, `StatTile`, `KpiRow`; axe clean.

### M6 — Part-to-whole, progress, and the sequential scale

- [ ] `DonutChart.tsx`: arc geometry, ≤6 slices with a `devWarn` past that,
      optional centre total, 2px surface gaps between slices.
- [ ] `GaugeChart.tsx`: radial meter; the unfilled track is a lighter step of
      the **same** ramp so state reads across the whole arc.
- [ ] `BulletChart.tsx`: value vs target vs qualitative bands.
- [ ] `FunnelChart.tsx`: on the **ordinal** ramp (stage order is meaning), with
      stage-to-stage conversion in the tooltip and table view.
- [ ] `MatrixHeatmap.tsx`: categories × categories × value on the **sequential**
      ramp — cohort retention, weekday × hour activity. This is the consumer
      that justifies M1's sequential ramp; distinct from the calendar `Heatmap`.
- [ ] `ScaleLegend.tsx`: the sequential/diverging gradient key with end labels.
- [ ] Unit tests: arc/slice math, gauge band selection, funnel conversion,
      matrix binning to ramp steps.
- [ ] Stories for each; axe clean.

### M7 — Comparison and distribution

- [ ] `ScatterChart.tsx` (+ bubble sizing): a **nearest-point hit layer** rather
      than per-point rects. Document that this trades per-point accessible
      labels for usable hit targets, so scatter's SR story is table-view-first.
- [ ] Enforce the all-pairs cap in code: past **4 series** on scatter/bubble,
      `devWarn` and recommend faceting; require secondary encoding (marker shape
      or direct labels) at 4 — see the design doc's measured dark-mode 6.9 ΔE.
- [ ] `HistogramChart.tsx`: on `binValues` — the distribution answer the family
      otherwise lacks.
- [ ] `WaterfallChart.tsx`: deltas bridging to a total, on the diverging pair.
- [ ] Unit tests: nearest-point lookup, binning edge cases (empty, single value,
      all-equal), waterfall running totals, bubble area scaling (area, never radius).
- [ ] Stories for each; axe clean.

### M8 — Small multiples, emphasis, texture, polish

- [ ] `ChartGrid.tsx`: the small-multiples layout with shared scales across facets.
- [ ] Emphasis mode on every chart: one series in its slot colour, the rest in
      `deemphasis` — the honest answer to "make this clearer".
- [ ] Texture channel: 45° / 135° hatch for `forced-colors`, print and full CVD.
      Opt-in, ordered on value scales, never decorative.
- [ ] Optional entry animation, gated on `useReducedMotion`.
- [ ] Update the root `README.md`; final `src/chart/README.md` pass.
- [ ] Extend `scripts/package-smoke-stubs.mjs` for any new peer surface.
- [ ] Full anti-pattern review of every shipped story (no dual axis, no rainbow
      ramp, no value-ramp on nominal categories, no number on every point, no
      clipped labels, no per-chart filter rows).
- [ ] Manual on-device native pass: scrub, tap-select, `ScrollView` coexistence.
- [ ] Gate: `npm run verify` green end to end.

### M9 — Backlog (not built)

Documented so the boundary is explicit, not forgotten:

- **Combo (shared-axis bar + line)** — not dual-axis, and genuinely common. The
  mark-layer seam in M3/M4 exists so this is additive.
- **DumbbellChart** (before → after per item) — moved out of core as too niche
  to earn a milestone slot.
- Candlestick / OHLC, box plot, gantt / timeline, treemap, sankey, radar.

Each needs its own plan file if it is picked up.

**Deliberately excluded** (see the design doc): dual-axis anything, 3-D,
choropleth/geo, chord, ridgeline.

---

## Risks

- **Palette drift.** Mitigated by `chartPalette.test.ts` pinning every measured
  number and by the re-runnable derivation script.
- **Native responder conflicts.** The scrub gesture, the mark `Pressable`s and
  an enclosing `ScrollView` all compete for the responder. The negotiation is
  specified in the design doc, but this is the class of bug that ate `DataGrid`
  M7 and it can only be settled on a device.
- **File-size creep.** A chart family is large; the pure-math subdirectories
  (`scale/`, `series/`, `geometry/`) exist to keep files under ~300 lines.
- **Density.** Hit targets and keyboard stops both degrade past a threshold; the
  fallbacks are specified, but the thresholds themselves need real-data tuning.
- **SVG text.** Avoided entirely: all text is RN `Text` in the chrome layer, so
  font tokens, a11y roles and RTL keep working.
