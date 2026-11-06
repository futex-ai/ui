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
import { ControlledSelectionExample } from "./dragSelectControlledExample";
import { EmptyPageExample } from "./dragSelectEmptyPageExample";
import { MarqueeOptionsExample } from "./dragSelectMarqueeExample";
import {
  PageShellExample,
  type PageShellExampleProps,
} from "./dragSelectPageShellExample";
import { RowDataExample } from "./dragSelectRowDataExample";
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

export const PageShell: StoryObj<PageShellExampleProps> = {
  name: "Page shell",
  args: { scoped: true },
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <SharedUiThemeProvider theme={defaultSharedUiTheme}>
      <PageShellExample {...args} />
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

export const ControlledSelection: Story = {
  name: "Controlled selection",
  render: () => (
    <StorySurface>
      <ControlledSelectionExample />
    </StorySurface>
  ),
};

export const RestoredSelection: Story = {
  name: "Restored selection",
  render: () => (
    <StorySurface>
      <ControlledSelectionExample initialSelectedIds={["txn_2", "txn_4"]} />
    </StorySurface>
  ),
};

export const CustomMarquee: Story = {
  name: "Custom marquee",
  render: () => (
    <StorySurface>
      <MarqueeOptionsExample />
    </StorySurface>
  ),
};

export const RowData: Story = {
  name: "Row data",
  render: () => (
    <StorySurface>
      <RowDataExample />
    </StorySurface>
  ),
};
