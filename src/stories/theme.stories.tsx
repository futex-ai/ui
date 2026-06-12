import type { Meta, StoryObj } from "@storybook/react-vite";

import { defaultSharedUiTheme, junoSharedUiTheme } from "../index";
import { StorySurface, ThemeSwatch } from "./sharedExamples";

const meta = {
  title: "Theme/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const DefaultAccountingTheme: Story = {
  name: "Default accounting theme",
  render: () => (
    <StorySurface theme={defaultSharedUiTheme}>
      <ThemeSwatch label="Accounting default" />
    </StorySurface>
  ),
};

export const AlternatePrimaryTheme: Story = {
  name: "Alternate primary theme",
  render: () => (
    <StorySurface theme={junoSharedUiTheme}>
      <ThemeSwatch label="Juno primary" />
    </StorySurface>
  ),
};
