import type { Meta, StoryObj } from "@storybook/react-native";

import {
  DrawnSheetExample,
  InlineMenuExample,
  TouchResponsiveMenuExample,
} from "./menuNativeExamples";

const meta: Meta = { title: "Popover/Native menus" };

export default meta;

type Story = StoryObj;

/** Native `InlineMenu` always opens the phone menu sheet. */
export const InlineMenuSheetOnPress: Story = {
  render: () => <InlineMenuExample />,
};

/** `InlineMenuSheet` draws the sheet in place, with no modal behaviour. */
export const DrawnSheet: Story = { render: () => <DrawnSheetExample /> };

/** `ResponsiveMenu` with `size` opens the menu sheet on a touch surface. */
export const TouchResponsiveMenu: Story = {
  render: () => <TouchResponsiveMenuExample />,
};
