import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Text, View } from "react-native";

import { Heatmap, darkSharedUiTheme, type HeatmapDatum } from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Heatmap/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/** Deterministic per-day values across `[startYear-01-01, year-12-31]`. */
function yearValues(year: number): HeatmapDatum[] {
  const out: HeatmapDatum[] = [];
  for (let offset = 0; offset < 366; offset += 1) {
    const date = new Date(year, 0, 1 + offset);
    if (date.getFullYear() !== year) {
      break;
    }
    const iso = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
    const value = (offset * 7) % 17;
    if (value > 0) {
      out.push({ date: iso, value });
    }
  }
  return out;
}

const data2024 = yearValues(2024);

export const HeatmapYear: Story = {
  name: "Full year",
  render: () => (
    <StorySurface>
      <Heatmap
        accessibilityLabel="Activity in 2024"
        endDate="2024-12-31"
        startDate="2024-01-01"
        values={data2024}
      />
    </StorySurface>
  ),
};

/**
 * The default ramp `[primarySoft, primaryBorder, primary, primaryDeep]` needs
 * no dark-specific code: on a dark preset those tokens run dark → light, so
 * "more intense = brighter" — the correct dark reading.
 */
export const Dark: Story = {
  name: "Dark theme",
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
      <Heatmap
        accessibilityLabel="Activity in 2024"
        endDate="2024-12-31"
        startDate="2024-01-01"
        values={data2024}
      />
    </StorySurface>
  ),
};

export const HeatmapCustom: Story = {
  name: "Custom colors and Monday start",
  render: () => (
    <StorySurface>
      <Heatmap
        accessibilityLabel="Activity in 2024, Monday-first"
        cellGap={4}
        cellRadius={3}
        cellSize={15}
        colors={["#dbeafe", "#93c5fd", "#3b82f6", "#1d4ed8"]}
        emptyColor="#eef2f7"
        endDate="2024-12-31"
        legendLessLabel="Quiet"
        legendMoreLabel="Busy"
        scrollable
        startDate="2024-01-01"
        values={data2024}
        weekStart={1}
      />
    </StorySurface>
  ),
};

export const HeatmapInteractive: Story = {
  name: "Interactive cells",
  render: () => (
    <StorySurface>
      <HeatmapInteractiveExample />
    </StorySurface>
  ),
};

function HeatmapInteractiveExample() {
  const [selected, setSelected] = useState("None selected");
  return (
    <View style={{ gap: 12 }}>
      {/* Tab moves into the grid once (a single roving tab stop); Arrow keys
          move the focused cell, Home/End jump within a week, and PageUp/PageDown
          jump across weeks. Enter or Space activates the focused cell. */}
      <Heatmap
        accessibilityLabel="Daily activity, January to March 2024"
        endDate="2024-03-31"
        onCellPress={(cell) =>
          setSelected(`Selected: ${cell.date} (${cell.value ?? "no data"})`)
        }
        startDate="2024-01-01"
        values={[
          { date: "2024-01-15", value: 8 },
          { date: "2024-02-02", value: 3 },
          { date: "2024-03-20", value: 14 },
        ]}
      />
      <Text>{selected}</Text>
    </View>
  );
}
