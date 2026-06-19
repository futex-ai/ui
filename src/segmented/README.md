# Segmented Controls

Reusable React Native and React Native Web single-select controls for compact
one-of-N choices. This component is copied from the accounting app's segmented
control patterns, including the report-style pill tabs and source-filter pills
used around Profit & loss reporting.

## Responsibilities

- Render one selected option from a small set of choices.
- Expose `radiogroup` and `radio` semantics with checked and disabled state.
- Default to pill-track tabs for report-style segmented controls, with an
  opt-in `variant="outline"` for rows of separate filter-pill cells.
- Size the control with the shared `ControlSize` scale (`sm` / `md` / `lg`),
  scaling the segment padding, the label type scale, and the track gaps.
- Use shared theme colors, fonts, and radii instead of consumer-local theme
  imports.
- Keep equal-width and content-sized segment layouts available to consumers.

## Usage

Use `SegmentedControl` for compact selectors where all options should stay
visible. `variant` defaults to `"pill"` — a tab-like track with the selected
option raised as a surface, the right fit for report-style switches:

```tsx
import { SegmentedControl } from "@firna/ui/segmented";

<SegmentedControl
  label="Report"
  onChange={setReport}
  options={[
    { label: "Profit & loss", value: "pl" },
    { label: "Balance sheet", value: "bs" },
  ]}
  value={report}
/>;
```

Pass `variant="outline"` for rows of separate bordered filter-pill cells:

```tsx
<SegmentedControl
  accessibilityLabel="Income source"
  onChange={setSource}
  options={sourceOptions}
  value={source}
  variant="outline"
  wrap
/>;
```

`sizing` defaults to `"content"`, so each segment hugs its label and the track
sits flush to the start — the right fit for both the default pill tabs and for
rows of filter pills (pair with `wrap` when they may flow onto another line).
Pass `sizing="equal"` to share width evenly across segments, e.g. for a
full-width two-up toggle.

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

## Accessibility

The control follows the WAI-ARIA radio-group pattern:

- The group is a single Tab stop. The selected option carries `tabIndex 0`; the
  others are `-1` (roving tabindex). Tab moves into the group at the selected
  option and out to the next control.
- `ArrowLeft` / `ArrowRight` (plus `Home` / `End`) move a roving focus between
  enabled options and select the focused option as focus lands on it. Disabled
  options are skipped.
- Name the group with `accessibilityLabel`, or a visible `label` (which becomes
  the accessible name when no `accessibilityLabel` is given).
- `error` / `hint` text is associated with the group via `aria-describedby`
  (`error` wins when both are present), and `error` sets `aria-invalid`.
- Focus is shown with a geometry-bearing ring (works on the borderless pill,
  inset so the rounded track does not clip it).

## Theming

Segmented controls read colors, fonts, and radii from
`SharedUiThemeProvider`. The default theme matches the accounting source
component and selected states use the active theme primary family.
