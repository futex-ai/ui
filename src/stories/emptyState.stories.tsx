import type { Meta, StoryObj } from "@storybook/react-vite";

import { darkSharedUiTheme } from "../index";
import { EmptyPageExample, EmptyPanelExample } from "./emptyStateExamples";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Empty state/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/** A page empty state centres in its area, with a body and an action. */
export const Page: Story = {
  name: "Page",
  render: () => (
    <StorySurface>
      <EmptyPageExample />
    </StorySurface>
  ),
};

/** Panel empty states are smaller and sit at the top of their panel. */
export const Panel: Story = {
  name: "Panel",
  render: () => (
    <StorySurface>
      <EmptyPanelExample />
    </StorySurface>
  ),
};

export const Dark: Story = {
  name: "Dark theme",
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
      <EmptyPageExample />
    </StorySurface>
  ),
};
