# Heatmap

Reusable React Native and React Native Web calendar heatmap — a GitHub-style
contribution grid that lays a date range out as columns of weeks, fills each day
with an intensity color drawn from a per-date value, and labels the months along
the top. It works identically on web and native and renders only themed `View`s
and `Text`, so there is no SVG or platform branching.

## Responsibilities

- Lay an inclusive ISO `YYYY-MM-DD` date range out as column-major weeks (one
  column per week, one row per weekday), padding the leading and trailing weeks
  so the grid stays rectangular.
- Place month labels above the column where each month's in-range days begin.
- Map each day's value to an ordered intensity ramp through ascending
  lower-bound thresholds, deriving even bands from the data's max value by
  default or honoring explicit thresholds for an absolute scale.
- Drive every dimension (cell size, gap, corner radius), the color ramp, the
  empty color, the week start, and the month / weekday / legend chrome from
  props, with sensible defaults.
- Use shared theme tokens for the default ramp, the empty cell, and the label
  colors instead of consumer-local theme imports.
- Keep each in-range day individually labelled for assistive technology, and
  make cells pressable when an `onCellPress` handler is supplied.

## Usage

```tsx
import { Heatmap } from "@firna/ui/heatmap";

<Heatmap
  endDate="2024-12-31"
  startDate="2024-01-01"
  values={[
    { date: "2024-03-04", value: 5 },
    { date: "2024-03-05", value: 12 },
  ]}
/>;
```

`startDate` and `endDate` are inclusive ISO `YYYY-MM-DD` bounds. `values` is a
sparse list of per-date numbers — dates with no entry (or a non-positive value)
render in `emptyColor`. The component derives the color scale from the largest
in-range value, so the same data reads correctly whether the busiest day saw 3
events or 300.

### Customizing

```tsx
<Heatmap
  cellGap={4}
  cellRadius={3}
  cellSize={16}
  colors={["#dbeafe", "#93c5fd", "#3b82f6", "#1d4ed8"]}
  emptyColor="#f1f5f9"
  endDate="2024-12-31"
  legendMoreLabel="Busy"
  legendLessLabel="Quiet"
  onCellPress={(cell) => console.log(cell.date, cell.value)}
  scrollable
  startDate="2024-01-01"
  thresholds={[1, 5, 10, 20]}
  values={data}
  weekStart={1}
/>
```

- `colors` is the intensity ramp from lowest to highest; `emptyColor` fills
  days with no activity. Both default to shared theme tokens (the primary color
  family and `soft`), so the heatmap matches the active theme — including the
  Juno preset — out of the box.
- `thresholds` are ascending lower bounds: a value `>= thresholds[i]` reaches
  `colors[i]`. Omit them for a relative scale derived from the data, or pass
  them for a fixed, absolute scale.
- `weekStart` chooses the top row (`0` Sunday, the default, or `1` Monday).
- `showMonthLabels`, `showWeekdayLabels`, and `showLegend` (all `true` by
  default) toggle the surrounding chrome; `legendLessLabel` / `legendMoreLabel`
  relabel the legend ends.
- `scrollable` wraps the grid in a horizontal scroll view while keeping the
  weekday gutter fixed, for long ranges in narrow containers.

### Interaction and accessibility

Supplying `onCellPress` turns every in-range cell into a focusable button that
reports the pressed {@link HeatmapCell} (`date`, `value`, and ramp `level`).
Each in-range cell carries its own accessible label — `"4 Mar 2024: 5"` by
default — which `cellAccessibilityLabel` can override. Padding cells outside the
range are hidden from assistive technology.

## Theming

The default ramp is `[primarySoft, primaryBorder, primary, primaryDeep]` over a
`soft` empty cell, and the labels use the muted text token — all read from
`SharedUiThemeProvider`. Pass `colors` / `emptyColor` to opt out per instance.

## Pure helpers

The layout and color math are exported as pure, unit-tested helpers for
consumers that need to build custom chrome: `buildHeatmapWeeks` and
`monthLabelColumns` (grid layout) and `resolveThresholds`, `levelForValue`, and
`colorForValue` (value-to-color mapping).
