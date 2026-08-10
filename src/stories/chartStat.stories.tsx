import type { Meta, StoryObj } from "@storybook/react-vite";
import { View } from "react-native";

import { darkSharedUiTheme, Sparkline, StatTile, StatTileRow } from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Chart/StatTile",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const TREND = [12, 15, 14, 18, 17, 21, 24, 22, 27, 31, 29, 34];
const DOWNTREND = [42, 40, 38, 39, 35, 33, 31, 30, 28, 26, 24, 21];

/** Label, value, delta, trend — the figure contract. */
export const Basic: Story = {
  render: () => (
    <StorySurface>
      <StatTile
        delta={{ value: 0.124, percent: true, period: "vs last month" }}
        label="Revenue"
        trend={TREND}
        value={42_100}
        valueFormat={(v) => `$${(v / 1000).toFixed(1)}K`}
      />
    </StorySurface>
  ),
};

/**
 * Colour is direction × whether up is good. Churn falling is a win, so this
 * delta is green despite being negative — colouring by sign alone would paint
 * a rising error rate green.
 */
export const DownIsGood: Story = {
  render: () => (
    <StorySurface>
      <StatTileRow>
        <StatTile
          delta={{ value: -0.31, percent: true, period: "vs last month" }}
          deltaDirection="down-is-good"
          label="Churn"
          trend={DOWNTREND}
          value={0.021}
          valueFormat={(v) => `${(v * 100).toFixed(1)}%`}
        />
        <StatTile
          delta={{ value: 0.18, percent: true, period: "vs last month" }}
          deltaDirection="down-is-good"
          label="Error rate"
          value={0.004}
          valueFormat={(v) => `${(v * 100).toFixed(2)}%`}
        />
      </StatTileRow>
    </StorySurface>
  ),
};

/** A KPI row — several headline numbers reading as one band. */
export const KpiRow: Story = {
  render: () => (
    <StorySurface>
      <StatTileRow>
        <StatTile
          delta={{ value: 0.124, percent: true, period: "vs last month" }}
          label="Revenue"
          trend={TREND}
          value={42_100}
          valueFormat={(v) => `$${(v / 1000).toFixed(1)}K`}
        />
        <StatTile
          delta={{ value: 320, period: "vs last month" }}
          label="Active users"
          trend={TREND}
          value={12_940}
        />
        <StatTile
          delta={{ value: 0, percent: true, period: "vs last month" }}
          label="Plans"
          value={4}
        />
      </StatTileRow>
    </StorySurface>
  ),
};

/** The three sparkline variants, standalone. */
export const Sparklines: Story = {
  render: () => (
    <StorySurface>
      <View style={{ gap: 16 }}>
        <Sparkline accessibilityLabel="Revenue trend, rising" data={TREND} />
        <Sparkline
          accessibilityLabel="Revenue by month"
          data={TREND}
          variant="bar"
        />
        <Sparkline
          accessibilityLabel="Win-loss streak"
          data={[1, 1, -1, 1, -1, -1, 1, 1, 1, -1, 1, 1]}
          variant="win-loss"
        />
      </View>
    </StorySurface>
  ),
};

/** The same tiles on a dark surface. */
export const Dark: Story = {
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
      <StatTileRow>
        <StatTile
          delta={{ value: 0.124, percent: true, period: "vs last month" }}
          label="Revenue"
          trend={TREND}
          value={42_100}
          valueFormat={(v) => `$${(v / 1000).toFixed(1)}K`}
        />
        <StatTile
          delta={{ value: -0.08, percent: true, period: "vs last month" }}
          label="Sessions"
          trend={DOWNTREND}
          value={8_420}
        />
      </StatTileRow>
    </StorySurface>
  ),
};
