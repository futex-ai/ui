import type { Meta, StoryObj } from "@storybook/react-vite";

import { ToastProvider, darkSharedUiTheme } from "../index";
import { ModalFromPopoverExample } from "./modalFromPopoverExample";
import { ModalStackExample } from "./modalStackExample";
import {
  ConfirmModalExample,
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

export const Dark: Story = {
  name: "Dark theme",
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
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

export const ConfirmWebModal: Story = {
  name: "Confirmation modal",
  render: () => (
    <StorySurface>
      <ConfirmModalExample />
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

export const StackedWebModals: Story = {
  name: "Stacked web modals",
  render: () => (
    <StorySurface>
      <ToastProvider>
        <ModalStackExample scrollablePage />
      </ToastProvider>
    </StorySurface>
  ),
};

export const StackedAtMount: Story = {
  name: "Stacked at mount",
  render: () => (
    <StorySurface>
      <ToastProvider>
        <ModalStackExample openAtMount />
      </ToastProvider>
    </StorySurface>
  ),
};

export const DialogFromPopover: Story = {
  name: "Dialog from a popover",
  render: () => (
    <StorySurface>
      <ModalFromPopoverExample />
    </StorySurface>
  ),
};
