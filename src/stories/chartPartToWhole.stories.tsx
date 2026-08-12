import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { View } from "react-native";

import {
  BulletChart,
  DonutChart,
  FunnelChart,
  GaugeChart,
  MatrixHeatmap,
  compactNumber,
  darkSharedUiTheme,
  defaultSharedUiTheme,
} from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Chart/PartToWhole",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: ReactNode }) {
  return (
    <StorySurface>
      <View style={{ maxWidth: 520, width: "100%" }}>{children}</View>
    </StorySurface>
  );
}

const SPEND = [
  { id: "hosting", label: "Hosting", value: 4200 },
  { id: "salaries", label: "Salaries", value: 18400 },
  { id: "tooling", label: "Tooling", value: 2100 },
  { id: "marketing", label: "Marketing", value: 6800 },
];

const money = (v: number) => `$${compactNumber(v)}`;

/** Part-to-whole at a glance, with the total in the middle. */
export const Donut: Story = {
  render: () => (
    <Frame>
      <DonutChart
        accessibilityLabel="Spend by category"
        centerLabel="per month"
        data={SPEND}
        title="Spend by category"
        valueFormat={money}
      />
    </Frame>
  ),
};

/** `innerRadiusRatio={0}` gives a pie. Still capped at six slices. */
export const Pie: Story = {
  render: () => (
    <Frame>
      <DonutChart
        accessibilityLabel="Spend by category"
        data={SPEND}
        innerRadiusRatio={0}
        title="Spend by category"
        valueFormat={money}
      />
    </Frame>
  ),
};

/** One ratio against its limit; the track is a lighter step of the same ramp. */
export const Gauge: Story = {
  render: () => (
    <Frame>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <GaugeChart
          accessibilityLabel="Storage used"
          title="Storage"
          value={68}
        />
        <GaugeChart
          accessibilityLabel="Error budget consumed"
          bands={[
            { upTo: 0.5, color: defaultSharedUiTheme.charts.status.good },
            { upTo: 0.8, color: defaultSharedUiTheme.charts.status.warning },
            { upTo: 1, color: defaultSharedUiTheme.charts.status.critical },
          ]}
          title="Error budget"
          value={91}
        />
      </View>
    </Frame>
  ),
};

/**
 * Value against target over graded bands — the "are we on track" question in
 * the space of a table row, where a gauge would cost a whole card each.
 */
export const Bullet: Story = {
  render: () => (
    <Frame>
      <BulletChart
        accessibilityLabel="Quarterly targets"
        rows={[
          {
            id: "rev",
            label: "Revenue",
            value: 82,
            target: 90,
            bands: [50, 75, 100],
          },
          {
            id: "new",
            label: "New accounts",
            value: 64,
            target: 50,
            bands: [40, 70, 100],
          },
          {
            id: "nps",
            label: "NPS",
            value: 38,
            target: 45,
            bands: [30, 60, 100],
          },
        ]}
        valueFormat={(v) => String(v)}
      />
    </Frame>
  ),
};

/** Stages on the ordinal ramp: swapping two would change the meaning. */
export const Funnel: Story = {
  render: () => (
    <Frame>
      <FunnelChart
        accessibilityLabel="Signup funnel"
        data={[
          { id: "visits", label: "Visits", value: 24000 },
          { id: "signup", label: "Signed up", value: 8600 },
          { id: "activated", label: "Activated", value: 4100 },
          { id: "paid", label: "Paid", value: 1250 },
        ]}
        title="Signup funnel"
        valueFormat={compactNumber}
      />
    </Frame>
  ),
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const HOURS = ["08", "10", "12", "14", "16", "18"];
const ACTIVITY = WEEKDAYS.map((_, r) =>
  HOURS.map((_, c) => (r === 4 && c > 3 ? null : 10 + ((r * 7 + c * 13) % 90))),
);

/** Categories × categories × value — the consumer for the sequential ramp. */
export const Matrix: Story = {
  render: () => (
    <Frame>
      <MatrixHeatmap
        accessibilityLabel="Activity by weekday and hour"
        columns={HOURS}
        rows={WEEKDAYS}
        title="Activity by weekday and hour"
        values={ACTIVITY}
      />
    </Frame>
  ),
};

/** The same forms on a dark surface. */
export const Dark: Story = {
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
      <View style={{ gap: 20, maxWidth: 520, width: "100%" }}>
        <DonutChart
          accessibilityLabel="Spend by category"
          centerLabel="per month"
          data={SPEND}
          title="Spend by category"
          valueFormat={money}
        />
        <MatrixHeatmap
          accessibilityLabel="Activity by weekday and hour"
          columns={HOURS}
          rows={WEEKDAYS}
          title="Activity"
          values={ACTIVITY}
        />
      </View>
    </StorySurface>
  ),
};
