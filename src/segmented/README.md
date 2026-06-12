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
  value={report}
  variant="pill"
/>;
```

Use `sizing="content"` with `wrap` when the control is a row of filter pills
that may need to flow onto another line.

## Theming

Segmented controls read colors, fonts, and radii from
`SharedUiThemeProvider`. The default theme matches the accounting source
component and selected states use the active theme primary family.
