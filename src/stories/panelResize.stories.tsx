import type { Meta, StoryObj } from "@storybook/react-vite";

import { HandleStatesExample, PanelsExample } from "./panelResizeExamples";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Panel resize/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A project list and a changes panel around the main column. Drag a handle,
 * or focus it and use Left, Right, Home, and End. The layout owns the widths,
 * keeps 240px for the main column through the bounds it gives each handle,
 * and stores a width once at the end of each change.
 */
export const Panels: Story = {
  name: "Panels",
  render: () => (
    <StorySurface>
      <PanelsExample />
    </StorySurface>
  ),
};

/**
 * The handle at rest, under the pointer, during a drag, and with keyboard
 * focus, drawn with the line and grip styles as static HTML shows them, and a
 * handle whose keyboard focus shows nothing.
 */
export const HandleStates: Story = {
  name: "Handle states",
  render: () => (
    <StorySurface>
      <HandleStatesExample />
    </StorySurface>
  ),
};
