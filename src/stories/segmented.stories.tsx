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
