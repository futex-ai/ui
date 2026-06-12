import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { View } from "react-native";

import { DateField, DateRangeField, type DateRange } from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Date/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const SingleDateField: Story = {
  name: "Single date field",
  render: () => (
    <StorySurface>
      <SingleDateExample />
    </StorySurface>
  ),
};

export const DateRange_: Story = {
  name: "Date range field",
  render: () => (
    <StorySurface>
      <DateRangeExample />
    </StorySurface>
  ),
};

function SingleDateExample() {
  const [value, setValue] = useState("2026-03-31");
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <DateField
        hint="Pick a day, type it as 31 Mar 2026, or clear it with the ✕."
        label="Year ends"
        onChange={setValue}
        value={value}
      />
    </View>
  );
}

function DateRangeExample() {
  const [value, setValue] = useState<DateRange>({
    end: "2026-03-31",
    start: "2025-04-01",
  });
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <DateRangeField
        hint="Both endpoints are independent calendars."
        label="Current period"
        onChange={setValue}
        value={value}
      />
    </View>
  );
}
