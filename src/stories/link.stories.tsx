import type { Meta, StoryObj } from "@storybook/react-vite";

import { darkSharedUiTheme } from "../index";
import {
  LinkBesideButtonsExample,
  LinkButtonsExample,
  LinkTabsExample,
  LinkTouchExample,
} from "./linkExamples";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Link/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Link buttons in every tone, the dense `xs` size, the current page, an
 * icon-only link, and links that open a new tab.
 */
export const LinkButtons: Story = {
  name: "Link buttons",
  render: () => (
    <StorySurface>
      <LinkButtonsExample />
    </StorySurface>
  ),
};

/** Each link button beside the button of the same tone and size. */
export const BesideButtons: Story = {
  name: "Beside buttons",
  render: () => (
    <StorySurface>
      <LinkBesideButtonsExample />
    </StorySurface>
  ),
};

/**
 * Link tabs: a dense row that scrolls in a narrow column, with a count and the
 * current page, restyled monospace labels with a new-tab tab, and the default
 * size.
 */
export const Tabs: Story = {
  name: "Link tabs",
  render: () => (
    <StorySurface>
      <LinkTabsExample />
    </StorySurface>
  ),
};

/** Link buttons and a filled tab bar on a touch surface, as on a phone. */
export const TouchSurfaceLinks: Story = {
  name: "Touch surface",
  render: () => (
    <StorySurface>
      <LinkTouchExample />
    </StorySurface>
  ),
};

export const Dark: Story = {
  name: "Dark theme",
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
      <LinkButtonsExample />
    </StorySurface>
  ),
};
