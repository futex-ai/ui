import type { Meta, StoryObj } from "@storybook/react-vite";
import { ShieldQuestionMark } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";

import { SegmentedControl } from "../index";
import { StorySurface } from "./sharedExamples";

const basisOptions = [
  { label: "Accrual", value: "accrual" },
  { label: "Cash", value: "cash" },
];

const scopeOptions = [
  { label: "All accounts", value: "all" },
  { label: "Active", value: "active" },
];

const reportOptions = [
  { label: "Profit & loss", value: "pl" },
  { label: "Balance sheet", value: "bs" },
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

const dateModeOptions = [
  { label: "Auto", value: "auto" },
  { accessibilityLabel: "Custom start date", label: "Custom", value: "start" },
  { accessibilityLabel: "Custom end date", label: "Custom", value: "end" },
];

const meta = {
  title: "Segmented/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const ProfitLossSegmentedControl: Story = {
  name: "Profit & loss segmented control",
  render: () => (
    <StorySurface>
      <ProfitLossSegmentedExample />
    </StorySurface>
  ),
};

export const AnimatedTabs: Story = {
  name: "Animated tab switch",
  render: () => (
    <StorySurface>
      <AnimatedTabsExample />
    </StorySurface>
  ),
};

export const Sizes: Story = {
  name: "Sizes",
  render: () => (
    <StorySurface>
      <SizesExample />
    </StorySurface>
  ),
};

export const Sizing: Story = {
  name: "Sizing",
  render: () => (
    <StorySurface>
      <SizingExample />
    </StorySurface>
  ),
};

export const States: Story = {
  name: "Label, required, error & hint",
  render: () => (
    <StorySurface>
      <StatesExample />
    </StorySurface>
  ),
};

export const DuplicateLabels: Story = {
  name: "Duplicate segment labels",
  render: () => (
    <StorySurface>
      <DuplicateLabelsExample />
    </StorySurface>
  ),
};

export const LabelInfoSegmented: Story = {
  name: "Label info tooltip",
  render: () => (
    <StorySurface>
      <LabelInfoExample />
    </StorySurface>
  ),
};

function LabelInfoExample() {
  const [basis, setBasis] = useState("accrual");
  const [scope, setScope] = useState("all");
  return (
    <View style={{ gap: 18, minWidth: 320 }}>
      <SegmentedControl
        // The ⓘ after the label opens a tooltip with the detail, so the
        // always-read `hint` stays free for short, everyday guidance.
        hint="Most businesses report on an accruals basis."
        label="Accounting basis"
        labelInfo="Accrual accounting records income and expenses when they are earned or incurred; cash accounting records them only when money actually moves."
        onChange={setBasis}
        options={basisOptions}
        value={basis}
      />
      <SegmentedControl
        // `labelInfoIcon` swaps the default ⓘ glyph and `labelInfoLabel` names
        // the button when the default reads awkwardly.
        label="Report scope"
        labelInfo="“All accounts” includes archived ledgers; “Active” limits the report to accounts with movement in the period."
        labelInfoIcon={ShieldQuestionMark}
        labelInfoLabel="What each scope covers"
        onChange={setScope}
        options={scopeOptions}
        value={scope}
      />
    </View>
  );
}

function DuplicateLabelsExample() {
  const [mode, setMode] = useState("auto");
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <SegmentedControl
        accessibilityLabel="Date mode"
        onChange={setMode}
        options={dateModeOptions}
        value={mode}
      />
    </View>
  );
}

function StatesExample() {
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

function AnimatedTabsExample() {
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

function SizingExample() {
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

function SizesExample() {
  const [small, setSmall] = useState("pl");
  const [medium, setMedium] = useState("pl");
  const [large, setLarge] = useState("pl");
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
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

function ProfitLossSegmentedExample() {
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
