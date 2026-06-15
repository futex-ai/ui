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

export const ClearableDateField: Story = {
  name: "Clearable single date field",
  render: () => (
    <StorySurface>
      <ClearableDateExample />
    </StorySurface>
  ),
};

export const DateFieldSizes: Story = {
  name: "Date field sizes",
  render: () => (
    <StorySurface>
      <DateFieldSizesExample />
    </StorySurface>
  ),
};

export const BoundedDateField: Story = {
  name: "Bounded single date field",
  render: () => (
    <StorySurface>
      <BoundedDateExample />
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

export const WheelDateField: Story = {
  name: "Wheel date field",
  render: () => (
    <StorySurface>
      <WheelDateExample />
    </StorySurface>
  ),
};

export const BoundedWheelDateField: Story = {
  name: "Bounded wheel date field",
  render: () => (
    <StorySurface>
      <BoundedWheelDateExample />
    </StorySurface>
  ),
};

export const WheelDateRange: Story = {
  name: "Wheel date range field",
  render: () => (
    <StorySurface>
      <WheelDateRangeExample />
    </StorySurface>
  ),
};

export const ClearableWheelDateField: Story = {
  name: "Clearable wheel date field",
  render: () => (
    <StorySurface>
      <ClearableWheelDateExample />
    </StorySurface>
  ),
};

function SingleDateExample() {
  const [value, setValue] = useState("2026-03-31");
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <DateField
        hint="Pick a day or type it as 31 Mar 2026."
        label="Year ends"
        onChange={setValue}
        value={value}
      />
    </View>
  );
}

function DateFieldSizesExample() {
  const [small, setSmall] = useState("2026-03-31");
  const [medium, setMedium] = useState("2026-03-31");
  const [large, setLarge] = useState("2026-03-31");
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <DateField label="Small" onChange={setSmall} size="sm" value={small} />
      <DateField label="Medium" onChange={setMedium} size="md" value={medium} />
      <DateField label="Large" onChange={setLarge} size="lg" value={large} />
    </View>
  );
}

function ClearableDateExample() {
  const [value, setValue] = useState("2026-03-31");
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <DateField
        clearable
        hint="With clearable, a ✕ appears once a value is set."
        label="Year ends"
        onChange={setValue}
        value={value}
      />
    </View>
  );
}

function BoundedDateExample() {
  const [value, setValue] = useState("2026-03-31");
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <DateField
        hint="Click the title to pick a year; only 2024–2027 are selectable."
        label="Year ends"
        max="2027-12-31"
        min="2024-01-01"
        onChange={setValue}
        value={value}
      />
    </View>
  );
}

function WheelDateExample() {
  const [value, setValue] = useState("2026-03-31");
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <DateField
        hint="Tap to open the spinning day/month/year wheel."
        label="Year ends"
        onChange={setValue}
        value={value}
        variant="wheel"
      />
    </View>
  );
}

function BoundedWheelDateExample() {
  const [value, setValue] = useState("2026-03-15");
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <DateField
        hint="Only Mar 2026 is selectable; out-of-range spins snap back."
        label="Delivery date"
        max="2026-03-20"
        min="2026-03-10"
        onChange={setValue}
        value={value}
        variant="wheel"
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

function ClearableWheelDateExample() {
  const [value, setValue] = useState("2026-03-31");
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <DateField
        clearable
        hint="Wheel variant with a ✕ that clears the value."
        label="Year ends"
        onChange={setValue}
        value={value}
        variant="wheel"
      />
    </View>
  );
}

function WheelDateRangeExample() {
  const [value, setValue] = useState<DateRange>({
    end: "2026-03-31",
    start: "2025-04-01",
  });
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <DateRangeField
        hint="Each endpoint opens its own spinning wheel."
        label="Current period"
        onChange={setValue}
        value={value}
        variant="wheel"
      />
    </View>
  );
}
