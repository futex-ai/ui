# Charts component family

A new `@firna/ui/chart` family: interactive, cross-platform charts built from
this library's own primitives and `react-native-svg`, with **no charting
dependency**. Design and colour derivation live in
[`charts-design.md`](charts-design.md); this file is the build order.

**Status:** proposed (not started).

**Scope:** foundations + the everyday charts + the round-out set. The
specialist tail (candlestick, box plot, gantt, treemap, sankey, radar) is
documented as a backlog in [M9](#m9--backlog-tier-3-not-built) and not built.

**What exists already:** `Heatmap` (calendar grid), `ProgressBar` /
`ProgressRing` (meters), `Table` (the table-view twin), `Popover` (the tooltip
portal), `keyboardNavigation` (roving tabindex), `useReducedMotion`. This plan
reuses all of them rather than reimplementing.

---

## Milestones

Each milestone ends in a working, shippable library with a rendering Storybook
story and `npm run verify` green. Tick items off here as they land; append newly
discovered TODOs under the relevant milestone.

### M1 — Chart colour system

The theme gains validated series/sequential/ordinal/diverging/status scales.
Ships on its own: a pure token addition, no chart yet, nothing breaking.

- [ ] `theme.tsx`: add the `charts` key and `SharedUiChartColors` type; merge it
      in `createSharedUiTheme` alongside `colors`/`fonts`/`radii`.
- [ ] Populate `charts` for all four shipped themes (default + juno, light +
      dark). `grid`/`axis`/`label`/`surface`/`deemphasis` derive from the
      existing `border`/`border2`/`muted`/`surface`/`muted` tokens.
- [ ] `src/chart/chartPalette.ts`: `seriesColor(id, order)` assigning slots from
      a stable id (never the array index), emphasis and status overrides, and
      `foldToOther` past eight series with a `devWarn`.
- [ ] `scripts/validate-chart-palette.mjs`: re-runs the six checks against all
      three real surfaces (`#ffffff`, `#212522`, `#1e1c25`), plus the ordinal
      checks and the all-pairs cap. Reproduces the derivation, not just the result.
- [ ] `tests/unit/chartPalette.test.ts`: pin the measured numbers — adjacent CVD
      ΔE 9.1 light / 8.4 dark, normal-vision 19.6 / 19.3, the 3-clean / 4-capped
      all-pairs depth, and every documented contrast ratio. Mirrors
      `darkTheme.test.ts`.
- [ ] Story `Chart/Palette`: the eight slots, both ramps, the diverging pair and
      the status scale, in light and dark.
- [ ] Gate: `npm run test`, `npm run typecheck`, `npm run storybook:build` pass.

### M2 — Foundations: scales, frame, axes, legend, tooltip, table view

Everything a chart needs except the marks. Ends with a framed, axed, empty plot
rendering in Storybook.

- [ ] `src/chart/` + `index.ts` barrel; add the `./chart` subpath export to
      `package.json` and `src/index.ts`.
- [ ] `scale/`: `linearScale`, `bandScale`, `timeScale`, `niceTicks`,
      `clampDomain` — pure, unit-tested.
- [ ] `series/`: canonical normalize, `stackSeries`, `percentStack`,
      `divergingSplit`, `foldToOther` — `null` is a gap, never a zero.
- [ ] `chartLayout.ts`: measured size → plot rect + axis/legend bands. The axis
      band is **inside** the frame height, so a fixed height never nests a scrollbar.
- [ ] `ChartFrame.tsx`: `onLayout` measurement, title/caption, empty state,
      the loading hold (previous render at reduced opacity — no skeleton flash),
      and the table-view toggle.
- [ ] `ChartAxis.tsx`: hairline **solid** grid and baseline (never dashed),
      `tabular-nums` ticks in `label` ink.
- [ ] `ChartLegend.tsx`: rect key for bars/areas, line key for lines;
      toggle-to-isolate; keyboard operable.
- [ ] `ChartTooltip.tsx`: on the existing `Popover` portal; value leads, series
      name follows; line keys, not boxes; names inserted as text, never markup.
- [ ] `ChartTableView.tsx`: the WCAG-clean twin, on the existing `Table`.
- [ ] Unit tests: `chartScale.test.ts`, `chartSeries.test.ts`,
      `chartLayout.test.ts` (empty data, single point, all-null series,
      negative domains, zero-width container).
- [ ] Story `Chart/Foundations`; axe clean.

### M3 — BarChart

Columns and bars: grouped, stacked, 100% stacked, and diverging about a baseline.

- [ ] `BarChart.tsx` + `barGeometry.ts`: `orientation`, `grouped` / `stacked` /
      `percent` / `diverging` modes.
- [ ] Mark specs: bars capped at **24px** thick, **4px rounded data-end, square
      at the baseline**, a **2px surface gap** between touching bars and between
      every stacked segment. No borders drawn around marks.
- [ ] Hit layer: per-bar `Pressable` (≥24px), hover lift, per-mark tooltip.
- [ ] Keyboard: roving index across bars; Enter fires `onDatumPress`.
- [ ] Direct labels **measured before placement** — inside only when they fit
      with padding, otherwise outside the bar end, otherwise the tooltip. Never clipped.
- [ ] Unit tests for stacking, percent-stacking, diverging split and label fit.
- [ ] Stories: `Grouped`, `Stacked`, `Percent`, `Diverging`, `Horizontal`.
- [ ] Playwright: hover tooltip, keyboard roving, legend isolate; axe clean.

### M4 — LineChart + AreaChart

Trend over time, with the crosshair interaction that makes multi-series
readable.

- [ ] `LineChart.tsx`: multi-series, **2px** stroke with round join/cap,
      straight or monotone-cubic curve, ≥8px markers with a **2px surface ring**,
      `null`-aware gaps, reference/threshold lines.
- [ ] `AreaChart.tsx`: single, stacked and 100% stacked; fill at **~10%
      opacity** with the band edge drawn as a line.
- [ ] `useChartHover` (web): crosshair snapping to the nearest x; **one tooltip
      listing every visible series** at that x.
- [ ] `useChartScrub` (native): `PanResponder` press-and-drag scrub — RN core,
      not the optional gesture-handler peer.
- [ ] Keyboard: roving over x positions; focus shows exactly what hover shows.
- [ ] Selective direct end-labels with collision handling — leader lines or fall
      back to the legend; never stacked labels.
- [ ] Unit tests: path geometry, monotone-cubic monotonicity, gap handling,
      nearest-index lookup.
- [ ] Stories: `Line`, `MultiSeries`, `Area`, `StackedArea`, `WithThreshold`.
- [ ] Playwright: crosshair tracks the pointer, focus parity, native scrub smoke.

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

### M6 — Part-to-whole and progress

- [ ] `DonutChart.tsx`: arc geometry, ≤6 slices with a `devWarn` past that,
      optional centre total, 2px surface gaps between slices.
- [ ] `GaugeChart.tsx`: radial meter; the unfilled track is a lighter step of
      the **same** ramp so state reads across the whole arc.
- [ ] `BulletChart.tsx`: value vs target vs qualitative bands.
- [ ] `FunnelChart.tsx`: on the **ordinal** ramp (stage order is meaning), with
      stage-to-stage conversion in the tooltip and table view.
- [ ] `ScaleLegend.tsx`: the sequential/diverging gradient key with end labels.
- [ ] Unit tests: arc/slice math, gauge band selection, funnel conversion.
- [ ] Stories for each; axe clean.

### M7 — Comparison and distribution

- [ ] `ScatterChart.tsx` (+ bubble sizing): a **nearest-point hit layer** rather
      than per-point rects, so an 8px dot is not a pinpoint target.
- [ ] Enforce the all-pairs cap in code: past **4 series** on scatter/bubble,
      `devWarn` and recommend faceting; require secondary encoding (marker shape
      or direct labels) at 4 — see the design doc's measured dark-mode 6.9 ΔE.
- [ ] `WaterfallChart.tsx`: deltas bridging to a total, on the diverging pair.
- [ ] `DumbbellChart.tsx`: before → after per item, one hue in two shades.
- [ ] Unit tests: nearest-point lookup, waterfall running totals, bubble area
      scaling (area, never radius).
- [ ] Stories for each; axe clean.

### M8 — Small multiples, emphasis, texture, polish

- [ ] `ChartGrid.tsx`: the small-multiples layout with shared scales across facets.
- [ ] Emphasis mode on every chart: one series in its slot colour, the rest in
      `deemphasis` — the honest answer to "make this clearer".
- [ ] Texture channel: 45° / 135° hatch for `forced-colors`, print and full CVD.
      Opt-in, ordered on value scales, never decorative.
- [ ] Optional entry animation, gated on `useReducedMotion`.
- [ ] `src/chart/README.md` to the house standard; update the root `README.md`.
- [ ] Add every new public component to `tests/unit/testIDForwarding.test.ts`;
      extend `scripts/package-smoke-stubs.mjs` for any new peer surface.
- [ ] Full anti-pattern review of every shipped story (no dual axis, no rainbow
      ramp, no value-ramp on nominal categories, no number on every point, no
      clipped labels, no per-chart filter rows).
- [ ] Gate: `npm run verify` green end to end.

### M9 — Backlog (Tier 3, not built)

Documented so the boundary is explicit, not forgotten: candlestick / OHLC, box
plot, gantt / timeline, treemap, sankey, radar, step line, histogram binning
helper. Each needs its own plan file if it is picked up.

**Deliberately excluded** (see the design doc): dual-axis anything, 3-D,
choropleth/geo, chord, ridgeline.

---

## Risks

- **Palette drift.** Mitigated by `chartPalette.test.ts` pinning every measured
  number and by the re-runnable derivation script.
- **File-size creep.** A chart family is large; the pure-math subdirectories
  (`scale/`, `series/`, `geometry/`) exist to keep files under ~300 lines.
- **Native interaction parity.** Hover has no native equivalent; the scrub
  gesture is the substitute and needs a real on-device pass, which — like
  `DataGrid`'s M7 — is the one item that cannot be gated in CI.
- **SVG text.** Avoided entirely: all text is RN `Text` in the chrome layer, so
  font tokens, a11y roles and RTL keep working.
