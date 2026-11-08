/** Layout, motion, size, and state examples for the Segmented stories. */
import { Columns2, Table } from "../primitives/icons";
import { useState } from "react";
import { View } from "../primitives/reactNative";

import { SegmentedControl, StatusDot } from "../index";

const reportOptions = [
  { label: "Profit & loss", value: "pl" },
  { label: "Balance sheet", value: "bs" },
];

// Icon-only options: lucide icons, and a custom node smaller than an icon.
const layoutOptions = [
  { icon: Columns2, label: "Board", value: "board" },
  { icon: Table, label: "Table", value: "table" },
];

const statusOptions = [
  {
    iconNode: <StatusDot size="xs" tone="primary" />,
    label: "Live",
    value: "live",
  },
  {
    iconNode: <StatusDot size="xs" tone="neutral" />,
    label: "Paused",
    value: "paused",
  },
];

const sourceOptions = [
  { label: "Combined", value: "combined" },
  { label: "Consulting", value: "consulting" },
  { label: "Retail", value: "retail" },
];

const periodOptions = [
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { disabled: true, label: "Yearly", value: "yearly" },
];

const viewOptions = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Quarter", value: "quarter" },
];

export function StatesExample() {
  const [period, setPeriod] = useState("monthly");
  const [basis, setBasis] = useState("pl");
  return (
    <View style={{ gap: 18, minWidth: 320 }}>
      <SegmentedControl
        hint="Yearly reporting opens after close."
        label="Reporting period"
        onChange={setPeriod}
        options={periodOptions}
        required
        value={period}
      />
      <SegmentedControl
        error="Choose a statement to continue."
        label="Statement"
        onChange={setBasis}
        options={reportOptions}
        value={basis}
      />
    </View>
  );
}

export function AnimatedTabsExample() {
  const [view, setView] = useState("day");
  const [equalView, setEqualView] = useState("day");
  const [staticView, setStaticView] = useState("day");
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <SegmentedControl
        accessibilityLabel="Calendar view"
        label="Content — the raised tab glides and resizes to each label"
        onChange={setView}
        options={viewOptions}
        value={view}
      />
      <SegmentedControl
        accessibilityLabel="Calendar view, equal width"
        label="Equal — the tab glides across same-width segments"
        onChange={setEqualView}
        options={viewOptions}
        sizing="equal"
        value={equalView}
      />
      <SegmentedControl
        accessibilityLabel="Static calendar view"
        animated={false}
        label="animated={false} — the tab snaps into place, no slide"
        onChange={setStaticView}
        options={viewOptions}
        value={staticView}
      />
    </View>
  );
}

export function SizingExample() {
  const [content, setContent] = useState("pl");
  const [equal, setEqual] = useState("pl");
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <SegmentedControl
        accessibilityLabel="Content sizing (default)"
        label="Content (default) — segments hug their labels"
        onChange={setContent}
        options={reportOptions}
        value={content}
      />
      <SegmentedControl
        accessibilityLabel="Equal sizing"
        label="Equal — segments share width evenly"
        onChange={setEqual}
        options={reportOptions}
        sizing="equal"
        value={equal}
      />
    </View>
  );
}

export function SizesExample() {
  const [extraSmall, setExtraSmall] = useState("pl");
  const [extraSmallOutline, setExtraSmallOutline] = useState("pl");
  const [denseLayout, setDenseLayout] = useState("board");
  const [denseStatus, setDenseStatus] = useState("live");
  const [small, setSmall] = useState("pl");
  const [medium, setMedium] = useState("pl");
  const [large, setLarge] = useState("pl");
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      {/* The dense size: a 26px pill track, or 26px outline cells. */}
      <SegmentedControl
        accessibilityLabel="Extra small report"
        onChange={setExtraSmall}
        options={reportOptions}
        size="xs"
        value={extraSmall}
      />
      <SegmentedControl
        accessibilityLabel="Extra small outline report"
        onChange={setExtraSmallOutline}
        options={reportOptions}
        size="xs"
        value={extraSmallOutline}
        variant="outline"
      />
      {/* Icon-only dense segments keep the same lines, whatever they show. */}
      <SegmentedControl
        accessibilityLabel="Extra small icon layout"
        iconOnly
        onChange={setDenseLayout}
        options={layoutOptions}
        size="xs"
        value={denseLayout}
      />
      <SegmentedControl
        accessibilityLabel="Extra small icon status"
        iconOnly
        onChange={setDenseStatus}
        options={statusOptions}
        size="xs"
        value={denseStatus}
        variant="outline"
      />
      <SegmentedControl
        accessibilityLabel="Small report"
        onChange={setSmall}
        options={reportOptions}
        size="sm"
        value={small}
      />
      <SegmentedControl
        accessibilityLabel="Medium report"
        onChange={setMedium}
        options={reportOptions}
        size="md"
        value={medium}
      />
      <SegmentedControl
        accessibilityLabel="Large report"
        onChange={setLarge}
        options={reportOptions}
        size="lg"
        value={large}
      />
    </View>
  );
}

export function ProfitLossSegmentedExample() {
  const [report, setReport] = useState("pl");
  const [source, setSource] = useState("combined");
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <SegmentedControl
        accessibilityLabel="Report"
        onChange={setReport}
        options={reportOptions}
        sizing="content"
        value={report}
      />
      <SegmentedControl
        accessibilityLabel="Income source"
        onChange={setSource}
        options={sourceOptions}
        sizing="content"
        value={source}
        variant="outline"
        wrap
      />
    </View>
  );
}
