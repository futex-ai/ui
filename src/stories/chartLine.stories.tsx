import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { View } from "react-native";

import {
  darkSharedUiTheme,
  AreaChart,
  LineChart,
  compactNumber,
} from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Chart/LineChart",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

const TRAFFIC = [
  {
    id: "web",
    label: "Web",
    data: [3200, 3800, 4100, 3900, 4800, 5200, 5600, 6100],
  },
  {
    id: "mobile",
    label: "Mobile",
    data: [1800, 2100, 2600, 3100, 3400, 4200, 4900, 5400],
  },
  {
    id: "api",
    label: "API",
    data: [900, 1100, 1000, 1400, 1600, 1500, 2100, 2400],
  },
];

function Frame({ children }: { children: ReactNode }) {
  return (
    <StorySurface>
      <View style={{ maxWidth: 560, width: "100%" }}>{children}</View>
    </StorySurface>
  );
}

/** Multi-series trend. Hover anywhere to get every series at that x. */
export const MultiSeries: Story = {
  render: () => (
    <Frame>
      <LineChart
        accessibilityLabel="Sessions by platform"
        categories={MONTHS}
        caption="The crosshair snaps to the nearest month — aim at a date, not at a 2px line."
        series={TRAFFIC}
        title="Sessions by platform"
        valueFormat={compactNumber}
      />
    </Frame>
  ),
};

/** A single series with a soft fill under it. */
export const SingleWithArea: Story = {
  render: () => (
    <Frame>
      <LineChart
        accessibilityLabel="Web sessions"
        area
        categories={MONTHS}
        series={[TRAFFIC[0]]}
        title="Web sessions"
        valueFormat={compactNumber}
      />
    </Frame>
  ),
};

/**
 * A monotone curve smooths the line without overshooting — it can never invent
 * a peak higher than any measurement or dip below a flat run.
 */
export const Monotone: Story = {
  render: () => (
    <Frame>
      <LineChart
        accessibilityLabel="Web sessions, smoothed"
        area
        categories={MONTHS}
        curve="monotone"
        series={[TRAFFIC[0]]}
        title="Smoothed"
        valueFormat={compactNumber}
      />
    </Frame>
  ),
};

/** A stepped line: a value that changes at a moment rather than drifting. */
export const Stepped: Story = {
  render: () => (
    <Frame>
      <LineChart
        accessibilityLabel="Plan price over time"
        categories={MONTHS}
        curve="step"
        series={[
          {
            id: "price",
            label: "Price",
            data: [19, 19, 19, 29, 29, 29, 39, 39],
          },
        ]}
        title="Plan price"
        valueFormat={(v) => `$${v}`}
      />
    </Frame>
  ),
};

/** Gaps are gaps: a missing measurement breaks the line rather than being drawn through. */
export const WithGaps: Story = {
  render: () => (
    <Frame>
      <LineChart
        accessibilityLabel="Sensor readings with an outage"
        categories={MONTHS}
        series={[
          {
            id: "sensor",
            label: "Sensor",
            data: [12, 15, null, null, 22, 19, 24, 26],
          },
        ]}
        title="Readings, with an outage"
      />
    </Frame>
  ),
};

/** A target line the series is read against. */
export const WithThreshold: Story = {
  render: () => (
    <Frame>
      <LineChart
        accessibilityLabel="Response time against the target"
        categories={MONTHS}
        referenceLines={[{ value: 300, label: "Target" }]}
        series={[
          {
            id: "p95",
            label: "p95 latency",
            data: [220, 260, 310, 280, 340, 290, 250, 240],
          },
        ]}
        title="p95 latency vs target"
        valueFormat={(v) => `${v}ms`}
      />
    </Frame>
  ),
};

/**
 * An irregular time axis: the gap between March and August is real, so the
 * spacing shows it instead of compressing every point into an equal slot.
 */
export const TimeAxis: Story = {
  render: () => (
    <Frame>
      <LineChart
        accessibilityLabel="Irregular readings over time"
        categories={[
          "2026-01-01",
          "2026-01-08",
          "2026-02-01",
          "2026-03-01",
          "2026-08-01",
        ]}
        series={[
          { id: "signups", label: "Signups", data: [120, 180, 240, 260, 640] },
        ]}
        title="Signups (irregular sampling)"
        xScale="time"
      />
    </Frame>
  ),
};

/** Composition over time, stacked. */
export const StackedArea: Story = {
  render: () => (
    <Frame>
      <AreaChart
        accessibilityLabel="Sessions by platform, stacked"
        categories={MONTHS}
        series={TRAFFIC}
        title="Total sessions"
        valueFormat={compactNumber}
      />
    </Frame>
  ),
};

/** The mix, where share matters more than magnitude. */
export const PercentArea: Story = {
  render: () => (
    <Frame>
      <AreaChart
        accessibilityLabel="Platform mix over time"
        categories={MONTHS}
        mode="percent"
        series={TRAFFIC}
        title="Platform mix"
        valueFormat={compactNumber}
      />
    </Frame>
  ),
};

/** The same line chart on a dark surface. */
export const Dark: Story = {
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
      <View style={{ maxWidth: 560, width: "100%" }}>
        <LineChart
          accessibilityLabel="Sessions by platform"
          categories={MONTHS}
          series={TRAFFIC}
          title="Sessions by platform"
          valueFormat={compactNumber}
        />
      </View>
    </StorySurface>
  ),
};
