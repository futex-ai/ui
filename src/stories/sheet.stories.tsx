import type { Meta, StoryObj } from "@storybook/react-vite";

import { darkSharedUiTheme } from "../index";
import { SheetExample, StorySurface } from "./sharedExamples";
import { SheetTextInputExample } from "./sheetTextInputExample";

const meta = {
  title: "Sheet/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The `Sheet` primitive. On web it renders through the modal frame's
 * `bottom-sheet` placement (this story) — a DOM-portal dialog pinned to the
 * bottom with a grip, header, and scrollable body; on native it is the
 * gorhom-backed bottom sheet. The controlled `open`/`onClose` API and the
 * `({ close, maxHeight }) => node` body are identical on both platforms.
 */
export const BottomSheet: Story = {
  name: "Bottom sheet",
  render: () => (
    <StorySurface>
      <SheetExample />
    </StorySurface>
  ),
};

export const Dark: Story = {
  name: "Dark theme",
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
      <SheetExample />
    </StorySurface>
  ),
};

/**
 * A sheet that edits text. `SheetTextInput` keeps the native sheet above the
 * keyboard. The sheet is named by `label` while its visible `title` differs,
 * and its `dismissLabel` shows as visible text on web too.
 */
export const TextInput: Story = {
  name: "Text input",
  render: () => (
    <StorySurface>
      <SheetTextInputExample />
    </StorySurface>
  ),
};
