import type { Meta, StoryObj } from "@storybook/react-vite";
import { View } from "../primitives/reactNative";

import { darkSharedUiTheme, type SharedUiTheme } from "../index";
import {
  AutoGrowingExample,
  InlineEditorExample,
  SeamlessEditorExample,
  TextareaExample,
} from "./inputEditorExamples";
import {
  BareExample,
  ClearableExample,
  FieldSizesExample,
  LabelInfoExample,
  LabelledExample,
  PasswordExample,
  ValidatedExample,
  WithIconsExample,
} from "./inputFieldExamples";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Input/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const surface = (node: React.ReactNode, theme?: SharedUiTheme) => (
  <StorySurface theme={theme}>
    <View style={{ gap: 14, minWidth: 320 }}>{node}</View>
  </StorySurface>
);

export const LabelledField: Story = {
  name: "Labelled field",
  render: () => surface(<LabelledExample />),
};

export const Dark: Story = {
  name: "Dark theme",
  render: () => surface(<LabelledExample />, darkSharedUiTheme),
};

export const ValidatedField: Story = {
  name: "Validated field",
  render: () => surface(<ValidatedExample />),
};

export const WithIcons: Story = {
  name: "Prefix and suffix icons",
  render: () => surface(<WithIconsExample />),
};

export const ClearableField: Story = {
  name: "Clearable field",
  render: () => surface(<ClearableExample />),
};

export const TextareaField: Story = {
  name: "Textarea field",
  render: () => surface(<TextareaExample />),
};

export const AutoGrowingTextarea: Story = {
  name: "Auto-growing textarea",
  render: () => surface(<AutoGrowingExample />),
};

export const PasswordField: Story = {
  name: "Password with show/hide",
  render: () => surface(<PasswordExample />),
};

export const LabelInfoField: Story = {
  name: "Label info tooltip",
  render: () => surface(<LabelInfoExample />),
};

export const BareField: Story = {
  name: "Bare field (no label)",
  render: () => surface(<BareExample />),
};

export const InlineEditor: Story = {
  name: "Plain inline editor",
  render: () => surface(<InlineEditorExample />),
};

export const SeamlessEditor: Story = {
  name: "Seamless (invisible) editor",
  render: () => surface(<SeamlessEditorExample />),
};

export const FieldSizes: Story = {
  name: "Field sizes",
  render: () => surface(<FieldSizesExample />),
};
