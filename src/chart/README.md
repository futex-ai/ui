# Chart

Cross-platform React Native and React Native Web charts, built from this
library's own primitives and `react-native-svg` — **no charting dependency**.
Marks are painted in SVG; every piece of chrome (titles, axis labels, legend,
tooltip, table view) is real `View`/`Text`, so font tokens, theming, assistive
technology and RTL keep working.

Design and the colour derivation live in
[`plans/charts-design.md`](../../plans/charts-design.md).

## Responsibilities

- Turn a measured container into a plot rect, with the axis and legend bands
  subtracted from the **total** height so a fixed-height card never grows a
  nested scrollbar.
- Map data to pixels through pure, unit-tested scales (`linear`, `time`,
  `band`) and land axis ticks on numbers people read fluently.
- Shape series without inventing data: `null` is a gap, never a zero.
- Assign colours by series **identity**, so hiding one never repaints the rest.
- Ship an accessible table twin for every chart, so a tooltip enhances rather
  than gates.

## Status

Milestones 1 and 2 of the family have landed: the colour system and the
foundations (scales, series maths, layout, frame, axes, table view). The chart
components themselves — `BarChart`, `LineChart`, `AreaChart`, `Sparkline`,
`StatTile` and the rest — are M3 onward in
[`plans/charts-component-family.md`](../../plans/charts-component-family.md).

## Quick start

```tsx
import {
  ChartFrame,
  ChartGrid,
  ChartTableView,
  bandScale,
  linearScale,
  niceTicks,
  normalizeSeries,
} from "@firna/ui/chart";

const categories = ["Jan", "Feb", "Mar"];
const series = normalizeSeries(
  [{ id: "revenue", label: "Revenue", data: [1200, 1900, 1500] }],
  categories.length,
);

<ChartFrame
  accessibilityLabel="Revenue by month"
  height={260}
  tableView={<ChartTableView categories={categories} series={series} />}
  title="Revenue by month"
>
  {(layout, styles) => <YourMarks layout={layout} styles={styles} />}
</ChartFrame>;
```

`ChartFrame` measures itself and hands `children` the resolved layout. `height`
is the **total** frame height; the axis, legend and title bands are subtracted
from it to produce `layout.plot`.

## Colours

Every colour comes from `theme.charts` (see the root README's _Chart colors_
section). Assign them through `assignSeriesColors`, never by array index:

```tsx
const { colorById } = assignSeriesColors(series, theme.charts);
```

Slots follow a series' position in the **full** list, so hiding one through a
legend keeps every other series on its own hue. Past eight series the palette
never cycles — the tail either folds into a summed "Other" (stacked forms only,
via `foldToOther`) or recedes into the de-emphasis grey.

## Interaction and accessibility

- **`null` is a gap.** A missing measurement and a measured zero are different
  facts; the maths never conflates them.
- **Tooltips never gate a value.** Every number a tooltip shows is also in the
  mark's accessible label and in the table view.
- **Density has limits, and they are enforced rather than assumed.**
  `usesPerMarkHitTargets` switches a chart to a nearest-x hit layer once bands
  fall below a 24px target, and `rovingStopIndices` caps keyboard stops so a
  thousand-point series does not produce a thousand tab stops.
- **First render does not jump.** The frame paints its chrome at the declared
  height immediately and holds the marks at opacity 0 until the container
  reports a width. Pass `defaultWidth` for SSR and tests.
- **Refetch holds the frame** at reduced opacity rather than flashing a
  skeleton.

## Key code

- `chartPalette.ts` — identity-stable colour assignment, emphasis, status, caps.
- `scale/linear.ts`, `scale/band.ts`, `scale/ticks.ts` — the pure scale maths.
- `series/stack.ts` — normalize, stack, percent-stack, diverge, bin, fold.
- `chartLayout.ts` — the plot rect, and the density thresholds.
- `ChartFrame.tsx` — measurement, empty state, loading hold, table toggle.
- `ChartAxis.tsx` — hairline solid gridlines and tick labels.
- `ChartTableView.tsx` — the accessible twin, on the shared `Table`.
