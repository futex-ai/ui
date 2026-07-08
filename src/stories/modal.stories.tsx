import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  ModalExample,
  ResizableSheetExample,
  StorySurface,
} from "./sharedExamples";

const meta = {
  title: "Modal/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const CenteredWebModal: Story = {
  name: "Centered web modal",
  render: () => (
    <StorySurface>
      <ModalExample placement="center" title="Invite teammate" />
    </StorySurface>
  ),
};

export const BottomSheetWebModal: Story = {
  name: "Bottom-sheet web modal",
  render: () => (
    <StorySurface>
      <ModalExample placement="bottom-sheet" title="Cookie preferences" />
    </StorySurface>
  ),
};

export const ResizableBottomSheet: Story = {
  name: "Bottom-sheet resizes to content",
  render: () => (
    <StorySurface>
      <ResizableSheetExample />
    </StorySurface>
  ),
};
