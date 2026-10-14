import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  SharedUiThemeProvider,
  darkSharedUiTheme,
  defaultSharedUiTheme,
} from "../index";
import {
  DisabledDuringDragExample,
  LargerMinimumDragExample,
  LedgerRowsExample,
  PageContentAreaExample,
} from "./dragSelectExamples";
import { NestedProvidersExample } from "./dragSelectNestedExample";
import { EmptyPageExample } from "./dragSelectEmptyPageExample";
import { PageShellExample } from "./dragSelectPageShellExample";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Drag Select/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const LedgerRows: Story = {
  name: "Ledger rows",
  render: () => (
    <StorySurface>
      <LedgerRowsExample />
    </StorySurface>
  ),
};

export const Dark: Story = {
  name: "Dark theme",
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
      <LedgerRowsExample />
    </StorySurface>
  ),
};

export const PageContentArea: Story = {
  name: "Page content area",
  render: () => (
    <StorySurface>
      <PageContentAreaExample />
    </StorySurface>
  ),
};

export const LargerMinimumDrag: Story = {
  name: "Larger minimum drag",
  render: () => (
    <StorySurface>
      <LargerMinimumDragExample />
    </StorySurface>
  ),
};

export const DisabledDuringDrag: Story = {
  name: "Disabled during drag",
  render: () => (
    <StorySurface>
      <DisabledDuringDragExample />
    </StorySurface>
  ),
};

export const PageShell: Story = {
  name: "Page shell",
  parameters: { layout: "fullscreen" },
  render: () => (
    <SharedUiThemeProvider theme={defaultSharedUiTheme}>
      <PageShellExample />
    </SharedUiThemeProvider>
  ),
};

export const EmptyPage: Story = {
  name: "Empty page",
  render: () => (
    <StorySurface>
      <EmptyPageExample />
    </StorySurface>
  ),
};

export const NestedProviders: Story = {
  name: "Nested providers",
  render: () => (
    <StorySurface>
      <NestedProvidersExample />
    </StorySurface>
  ),
};
