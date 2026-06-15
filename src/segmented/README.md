# Segmented Controls

Reusable React Native and React Native Web single-select controls for compact
one-of-N choices. This component is copied from the accounting app's segmented
control patterns, including the report-style pill tabs and source-filter pills
used around Profit & loss reporting.

## Responsibilities

- Render one selected option from a small set of choices.
- Expose `radiogroup` and `radio` semantics with checked and disabled state.
- Support outline cells for filter pills and pill-track tabs for report-style
  segmented controls.
- Size the control with the shared `ControlSize` scale (`sm` / `md` / `lg`),
  scaling the segment padding, the label type scale, and the track gaps.
- Use shared theme colors, fonts, and radii instead of consumer-local theme
  imports.
- Keep equal-width and content-sized segment layouts available to consumers.

## Usage

Use `SegmentedControl` for compact selectors where all options should stay
visible:

```tsx
import { SegmentedControl } from "@futex/ui/segmented";

<SegmentedControl
  label="Report"
  onChange={setReport}
  options={[
    { label: "Profit & loss", value: "pl" },
    { label: "Balance sheet", value: "bs" },
  ]}
  sizing="content"
  value={report}
  variant="pill"
/>;
```

Pair `variant="pill"` with `sizing="content"` for the report-style tab track,
where each tab hugs its label and the track sits flush to the start. Use
`sizing="content"` with `wrap` when the control is a row of filter pills that may
need to flow onto another line. Leave `sizing` as the default `"equal"` to share
width evenly across segments.

> `sizing` is the **width** strategy (equal vs content-hugging); `size` is the
> **density** (`sm` / `md` / `lg`). They are independent.

### Sizes

`size` takes the shared `ControlSize` (`sm` / `md` / `lg`); `md` is the default
and matches the original accounting control. It scales the segment padding, the
label type scale, and the gaps between segments, so a segmented control reads at
the same density as the inputs and buttons beside it.

```tsx
<SegmentedControl
  label="Report"
  onChange={setReport}
  options={reportOptions}
  size="sm"
  value={report}
/>
```

## Theming

Segmented controls read colors, fonts, and radii from
`SharedUiThemeProvider`. The default theme matches the accounting source
component and selected states use the active theme primary family.
