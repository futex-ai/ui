import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { View } from "react-native";

import { darkSharedUiTheme, BarChart, compactNumber } from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Chart/BarChart",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const REVENUE = [
  { id: "direct", label: "Direct", data: [12000, 15400, 14200, 19800] },
  { id: "partner", label: "Partner", data: [8200, 9100, 11800, 12400] },
  { id: "online", label: "Online", data: [4100, 6800, 7200, 9600] },
];

const money = (value: number) => `$${compactNumber(value)}`;

function Frame({ children }: { children: ReactNode }) {
  return (
    <StorySurface>
      <View style={{ maxWidth: 560, width: "100%" }}>{children}</View>
    </StorySurface>
  );
}

/** Several series side by side — the default when the series are the subject. */
export const Grouped: Story = {
  render: () => (
    <Frame>
      <BarChart
        accessibilityLabel="Revenue by channel and quarter"
        categories={QUARTERS}
        caption="Hover or focus a quarter to read every channel at once."
        series={REVENUE}
        title="Revenue by channel"
        valueFormat={money}
      />
    </Frame>
  ),
};

/** Part-to-whole, with a 2px surface gap separating every segment. */
export const Stacked: Story = {
  render: () => (
    <Frame>
      <BarChart
        accessibilityLabel="Revenue by channel and quarter, stacked"
        categories={QUARTERS}
        mode="stacked"
        series={REVENUE}
        title="Total revenue"
        valueFormat={money}
      />
    </Frame>
  ),
};

/** Share of total, where the mix matters more than the magnitude. */
export const Percent: Story = {
  render: () => (
    <Frame>
      <BarChart
        accessibilityLabel="Revenue mix by quarter"
        categories={QUARTERS}
        mode="percent"
        series={REVENUE}
        title="Revenue mix"
        valueFormat={money}
      />
    </Frame>
  ),
};

/**
 * Above and below a baseline. Values keep their identity colour; the sign is
 * carried by which side of the zero rule the bar sits on.
 */
export const Diverging: Story = {
  render: () => (
    <Frame>
      <BarChart
        accessibilityLabel="Net change by month"
        categories={MONTHS}
        mode="diverging"
        series={[
          {
            id: "net",
            label: "Net change",
            data: [420, -180, 260, -90, 610, -140],
          },
        ]}
        title="Net change"
      />
    </Frame>
  ),
};

/** Horizontal bars, the right choice when category names are long. */
export const Horizontal: Story = {
  render: () => (
    <Frame>
      <BarChart
        accessibilityLabel="Requests by endpoint"
        categories={[
          "/api/search",
          "/api/checkout",
          "/api/profile",
          "/api/settings",
        ]}
        orientation="horizontal"
        series={[
          {
            id: "requests",
            label: "Requests",
            data: [48200, 31400, 22800, 9100],
          },
        ]}
        title="Requests by endpoint"
        valueFormat={compactNumber}
      />
    </Frame>
  ),
};

/**
 * One series is the point and the rest are context. Often the honest answer to
 * "make this chart clearer" — eight identities bury a single story.
 */
export const Emphasis: Story = {
  render: () => (
    <Frame>
      <BarChart
        accessibilityLabel="Revenue by channel, online emphasised"
        categories={QUARTERS}
        emphasisId="online"
        series={REVENUE}
        title="Online is the story"
        valueFormat={money}
      />
    </Frame>
  ),
};

/** The same chart on a dark surface, series steps re-derived for it. */
export const Dark: Story = {
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
      <View style={{ maxWidth: 560, width: "100%" }}>
        <BarChart
          accessibilityLabel="Revenue by channel and quarter"
          categories={QUARTERS}
          series={REVENUE}
          title="Revenue by channel"
          valueFormat={money}
        />
      </View>
    </StorySurface>
  ),
};
