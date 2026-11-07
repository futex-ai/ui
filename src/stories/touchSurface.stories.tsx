import type { Meta, StoryObj } from "@storybook/react-vite";

import { StorySurface } from "./sharedExamples";
import { TouchControlsExample, TouchRowsExample } from "./touchSurfaceExamples";

const meta = {
  title: "Touch surface/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Buttons, fields, a selector, a date field, segments, a switch, and chip
 * multi-selects inside a touch surface. Each target is at least 44 by 44px.
 */
export const Controls: Story = {
  name: "Controls",
  render: () => (
    <StorySurface>
      <TouchControlsExample />
    </StorySurface>
  ),
};

/** List rows inside a touch surface: 44px single-line rows. */
export const Rows: Story = {
  name: "Rows",
  render: () => (
    <StorySurface>
      <TouchRowsExample />
    </StorySurface>
  ),
};
