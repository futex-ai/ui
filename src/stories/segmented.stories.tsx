import type { Meta, StoryObj } from "@storybook/react-vite";

import { darkSharedUiTheme } from "../index";
import {
  AnimatedTabsExample,
  ProfitLossSegmentedExample,
  SizesExample,
  SizingExample,
  StatesExample,
} from "./segmentedExamples";
import {
  DuplicateLabelsExample,
  LabelInfoExample,
  WithIconsExample,
} from "./segmentedLabelExamples";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Segmented/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const ProfitLossSegmentedControl: Story = {
  name: "Profit & loss segmented control",
  render: () => (
    <StorySurface>
      <ProfitLossSegmentedExample />
    </StorySurface>
  ),
};

export const Dark: Story = {
  name: "Dark theme",
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
      <ProfitLossSegmentedExample />
    </StorySurface>
  ),
};

export const AnimatedTabs: Story = {
  name: "Animated tab switch",
  render: () => (
    <StorySurface>
      <AnimatedTabsExample />
    </StorySurface>
  ),
};

export const Sizes: Story = {
  name: "Sizes",
  render: () => (
    <StorySurface>
      <SizesExample />
    </StorySurface>
  ),
};

export const Sizing: Story = {
  name: "Sizing",
  render: () => (
    <StorySurface>
      <SizingExample />
    </StorySurface>
  ),
};

export const States: Story = {
  name: "Label, required, error & hint",
  render: () => (
    <StorySurface>
      <StatesExample />
    </StorySurface>
  ),
};

export const DuplicateLabels: Story = {
  name: "Duplicate segment labels",
  render: () => (
    <StorySurface>
      <DuplicateLabelsExample />
    </StorySurface>
  ),
};

export const LabelInfoSegmented: Story = {
  name: "Label info tooltip",
  render: () => (
    <StorySurface>
      <LabelInfoExample />
    </StorySurface>
  ),
};

export const WithIcons: Story = {
  name: "Per-option icons",
  render: () => (
    <StorySurface>
      <WithIconsExample />
    </StorySurface>
  ),
};
