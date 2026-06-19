import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { View } from "react-native";

import { SegmentedControl } from "../index";
import { StorySurface } from "./sharedExamples";

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
        variant="pill"
      />
      <SegmentedControl
        accessibilityLabel="Income source"
        onChange={setSource}
        options={sourceOptions}
        sizing="content"
        value={source}
        wrap
      />
    </View>
  );
}
