import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Rect } from "react-native-svg";

import {
  darkSharedUiTheme,
  bandScale,
  ChartAxisLabels,
  ChartFrame,
  ChartGridLines,
  ChartTableView,
  linearScale,
  niceTicks,
  normalizeSeries,
  useSharedUiTheme,
  type AxisTick,
  type ChartLayout,
  type ChartStyles,
} from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Chart/Foundations",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const CATEGORIES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const SERIES = [
  {
    id: "revenue",
    label: "Revenue",
    data: [1200, 1900, 1500, 2400, 2100, 3200],
  },
];

/**
 * A minimal mark layer, here only to show the frame doing its job — the real
 * bar geometry (24px cap, 4px rounded data-end, 2px surface gaps) lands with
 * `BarChart`.
 */
function DemoBars({
  layout,
  styles,
  values,
}: {
  layout: ChartLayout;
  styles: ChartStyles;
  values: readonly number[];
}) {
  const theme = useSharedUiTheme();
  const { plot } = layout;
  const { ticks, domain } = niceTicks(0, Math.max(...values), 4);
  const y = linearScale(domain, [plot.height, 0]);
  const band = bandScale(values.length, [0, plot.width]);

  const valueTicks: AxisTick[] = ticks.map((tick) => ({
    position: y.scale(tick),
    label: String(tick),
  }));
  const categoryTicks: AxisTick[] = CATEGORIES.map((label, index) => ({
    position: band.center(index),
    label,
  }));

  return (
    <>
      <ChartGridLines baseline={y.scale(0)} plot={plot} ticks={valueTicks} />
      <Svg
        height={plot.height}
        style={{ left: plot.x, position: "absolute", top: plot.y }}
        width={plot.width}
      >
        {values.map((value, index) => {
          const top = y.scale(value);
          return (
            <Rect
              fill={theme.charts.series[0]}
              height={Math.max(0, plot.height - top)}
              key={index}
              rx={4}
              width={Math.min(24, band.bandwidth)}
              x={band.start(index) + Math.max(0, (band.bandwidth - 24) / 2)}
              y={top}
            />
          );
        })}
      </Svg>
      <ChartAxisLabels
        axis="y"
        rect={layout.yAxis}
        styles={styles}
        ticks={valueTicks}
      />
      <ChartAxisLabels
        axis="x"
        rect={layout.xAxis}
        slotWidth={Math.max(24, band.step)}
        styles={styles}
        ticks={categoryTicks}
      />
    </>
  );
}

function FramedExample({
  isEmpty = false,
  loading = false,
}: {
  isEmpty?: boolean;
  loading?: boolean;
}) {
  const normalized = normalizeSeries(SERIES, CATEGORIES.length);
  return (
    <View style={{ maxWidth: 520, width: "100%" }}>
      <ChartFrame
        accessibilityLabel="Revenue by month"
        caption="The frame owns measurement, the axis band, and the table twin."
        height={260}
        isEmpty={isEmpty}
        loading={loading}
        tableView={
          <ChartTableView
            accessibilityLabel="Revenue by month, as a table"
            categories={CATEGORIES}
            categoryLabel="Month"
            series={normalized}
            valueFormat={(v) => `$${v.toLocaleString("en-US")}`}
          />
        }
        title="Revenue by month"
      >
        {(layout, styles) => (
          <DemoBars layout={layout} styles={styles} values={SERIES[0].data} />
        )}
      </ChartFrame>
    </View>
  );
}

/** The frame with gridlines, both axis bands, and the data-table toggle. */
export const Framed: Story = {
  render: () => (
    <StorySurface>
      <FramedExample />
    </StorySurface>
  ),
};

/** Nothing to draw: the frame keeps its height and shows the empty state. */
export const Empty: Story = {
  render: () => (
    <StorySurface>
      <FramedExample isEmpty />
    </StorySurface>
  ),
};

/**
 * Refetch holds the previous render at reduced opacity — no skeleton, no
 * layout jump, and the reader keeps their place while the numbers refresh.
 */
export const LoadingHold: Story = {
  render: () => {
    function Toggle() {
      const [loading, setLoading] = useState(true);
      return (
        <View style={{ gap: 12, maxWidth: 520, width: "100%" }}>
          <Pressable onPress={() => setLoading((v) => !v)}>
            <Text>{loading ? "Finish loading" : "Start loading"}</Text>
          </Pressable>
          <FramedExample loading={loading} />
        </View>
      );
    }
    return (
      <StorySurface>
        <Toggle />
      </StorySurface>
    );
  },
};

/** The same frame on a dark surface, marks and furniture re-derived. */
export const Dark: Story = {
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
      <FramedExample />
    </StorySurface>
  ),
};
