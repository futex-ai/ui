import type { Meta, StoryObj } from "@storybook/react-vite";

import { darkSharedUiTheme } from "../index";
import { CalendarBottomEdgeFlipExample } from "./dateEdgePlacementExample";
import {
  BoundedDateExample,
  CalendarLayeringExample,
  ClearableDateExample,
  DateFieldSizesExample,
  DateRangeExample,
  LabelInfoDateExample,
  SingleDateExample,
  ValidatedDateExample,
} from "./dateFieldExamples";
import {
  BoundedWheelDateExample,
  ClearableWheelDateExample,
  WheelDateExample,
  WheelDateRangeExample,
} from "./dateWheelExamples";
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

export const Dark: Story = {
  name: "Dark theme",
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
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

export const ValidatedDateField: Story = {
  name: "Validated single date field",
  render: () => (
    <StorySurface>
      <ValidatedDateExample />
    </StorySurface>
  ),
};

export const LabelInfoDateField: Story = {
  name: "Label info tooltip",
  render: () => (
    <StorySurface>
      <LabelInfoDateExample />
    </StorySurface>
  ),
};

export const CalendarLayering: Story = {
  name: "Calendar layering",
  render: () => (
    <StorySurface>
      <CalendarLayeringExample />
    </StorySurface>
  ),
};

export const CalendarBottomEdgeFlip: Story = {
  name: "Placement · flips above the bottom edge",
  parameters: { layout: "fullscreen" },
  render: () => <CalendarBottomEdgeFlipExample />,
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
