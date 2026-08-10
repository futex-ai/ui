import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { View } from "react-native";

import {
  HistogramChart,
  ScatterChart,
  WaterfallChart,
  compactNumber,
  darkSharedUiTheme,
} from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Chart/Comparison",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: ReactNode }) {
  return (
    <StorySurface>
      <View style={{ maxWidth: 560, width: "100%" }}>{children}</View>
    </StorySurface>
  );
}

/** Deterministic sample points, so stories stay stable across runs. */
function cloud(seed: number, count: number, drift: number) {
  return Array.from({ length: count }, (_, i) => {
    const x = ((seed * 37 + i * 53) % 100) + 1;
    const y = x * drift + ((seed * 17 + i * 29) % 40);
    return { x, y, size: ((seed * 11 + i * 7) % 90) + 10 };
  });
}

/** Two measures against each other. Three series separate cleanly everywhere. */
export const Scatter: Story = {
  render: () => (
    <Frame>
      <ScatterChart
        accessibilityLabel="Latency against throughput by region"
        series={[
          { id: "eu", label: "EU", points: cloud(1, 18, 1.2) },
          { id: "us", label: "US", points: cloud(2, 18, 0.8) },
          { id: "apac", label: "APAC", points: cloud(3, 18, 1.6) },
        ]}
        title="Latency vs throughput"
        xLabel="throughput"
        yLabel="latency"
      />
    </Frame>
  ),
};

/**
 * A fourth series is the hard cap for an all-pairs form, and it needs
 * secondary encoding — so every series also takes a distinct marker shape.
 */
export const ScatterAtTheCap: Story = {
  render: () => (
    <Frame>
      <ScatterChart
        accessibilityLabel="Latency against throughput, four regions"
        series={[
          { id: "eu", label: "EU", points: cloud(1, 12, 1.2) },
          { id: "us", label: "US", points: cloud(2, 12, 0.8) },
          { id: "apac", label: "APAC", points: cloud(3, 12, 1.6) },
          { id: "sa", label: "SA", points: cloud(4, 12, 1.0) },
        ]}
        title="Four regions (shape carries identity too)"
      />
    </Frame>
  ),
};

/** Magnitude as bubble **area** — never radius, which would overstate it. */
export const Bubble: Story = {
  render: () => (
    <Frame>
      <ScatterChart
        accessibilityLabel="Accounts by usage and spend, sized by seats"
        bubble
        series={[
          { id: "accounts", label: "Accounts", points: cloud(5, 22, 1.1) },
        ]}
        title="Accounts (size = seats)"
        xLabel="usage"
        yLabel="spend"
      />
    </Frame>
  ),
};

const LATENCIES = Array.from(
  { length: 120 },
  (_, i) => 40 + ((i * 37) % 60) + ((i * 13) % 25),
);

/** How a measure is spread — the question a bar chart of totals cannot answer. */
export const Histogram: Story = {
  render: () => (
    <Frame>
      <HistogramChart
        accessibilityLabel="Distribution of response times"
        title="Response time distribution"
        values={LATENCIES}
      />
    </Frame>
  ),
};

/** Where a number came from. Sign takes the diverging pair, not identity hues. */
export const Waterfall: Story = {
  render: () => (
    <Frame>
      <WaterfallChart
        accessibilityLabel="Revenue bridge"
        data={[
          { id: "open", label: "Opening", value: 42000 },
          { id: "new", label: "New", value: 12400 },
          { id: "expand", label: "Expansion", value: 5200 },
          { id: "churn", label: "Churn", value: -8100 },
          { id: "contract", label: "Contraction", value: -2600 },
          { id: "close", label: "Closing", value: 0, isTotal: true },
        ]}
        title="Revenue bridge"
        valueFormat={(v) => `$${compactNumber(v)}`}
      />
    </Frame>
  ),
};

/** The same forms on a dark surface. */
export const Dark: Story = {
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
      <View style={{ gap: 20, maxWidth: 560, width: "100%" }}>
        <ScatterChart
          accessibilityLabel="Latency against throughput by region"
          series={[
            { id: "eu", label: "EU", points: cloud(1, 14, 1.2) },
            { id: "us", label: "US", points: cloud(2, 14, 0.8) },
          ]}
          title="Latency vs throughput"
        />
        <WaterfallChart
          accessibilityLabel="Revenue bridge"
          data={[
            { id: "open", label: "Opening", value: 42000 },
            { id: "new", label: "New", value: 12400 },
            { id: "churn", label: "Churn", value: -8100 },
            { id: "close", label: "Closing", value: 0, isTotal: true },
          ]}
          title="Revenue bridge"
          valueFormat={(v) => `$${compactNumber(v)}`}
        />
      </View>
    </StorySurface>
  ),
};
