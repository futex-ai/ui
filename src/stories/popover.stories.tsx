import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  ControlledPopoverExample,
  PopoverExample,
  StorySurface,
} from "./sharedExamples";

const meta = {
  title: "Popover/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const ContentPopover: Story = {
  name: "Content popover",
  render: () => (
    <StorySurface>
      <PopoverExample />
    </StorySurface>
  ),
};

export const ControlledPopover: Story = {
  name: "Controlled popover",
  render: () => (
    <StorySurface>
      <ControlledPopoverExample />
    </StorySurface>
  ),
};
