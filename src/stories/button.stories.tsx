import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pencil, Plus, Settings, Trash2 } from "../primitives/icons";
import { View } from "../primitives/reactNative";

import { Button, darkSharedUiTheme } from "../index";
import {
  BusyExample,
  InteractiveExample,
  MenuTriggerExample,
  PressLifecycleExample,
  RolesAndStatesExample,
  TapTargetExample,
} from "./buttonExamples";
import {
  CustomIconNodeExample,
  IconShapesExample,
  InlineExample,
  LabelAndSlotsExample,
  OnMediaExample,
} from "./buttonLayoutExamples";
import { noop, row, styles } from "./buttonStoryParts";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Button/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Tones: Story = {
  name: "Tones",
  render: () =>
    row(
      <>
        <Button onPress={noop} tone="primary">
          Primary
        </Button>
        <Button onPress={noop}>Secondary</Button>
        <Button onPress={noop} tone="ghost">
          Ghost
        </Button>
        <Button onPress={noop} tone="plain">
          Plain
        </Button>
        <Button onPress={noop} tone="danger">
          Danger
        </Button>
      </>,
    ),
};

export const Dark: Story = {
  name: "Dark theme",
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
      <View style={styles.row}>
        <Button onPress={noop} tone="primary">
          Primary
        </Button>
        <Button onPress={noop}>Secondary</Button>
        <Button onPress={noop} tone="ghost">
          Ghost
        </Button>
        <Button onPress={noop} tone="plain">
          Plain
        </Button>
        <Button onPress={noop} tone="danger">
          Danger
        </Button>
      </View>
    </StorySurface>
  ),
};

export const Sizes: Story = {
  name: "Sizes",
  render: () =>
    row(
      <>
        <Button onPress={noop} size="xs" tone="primary">
          Extra small
        </Button>
        <Button onPress={noop} size="sm" tone="primary">
          Small
        </Button>
        <Button onPress={noop} size="md" tone="primary">
          Medium
        </Button>
        <Button onPress={noop} size="lg" tone="primary">
          Large
        </Button>
      </>,
    ),
};

export const Inline: Story = {
  name: "Inline (in text)",
  render: () => <InlineExample />,
};

export const WithIcons: Story = {
  name: "With icons",
  render: () =>
    row(
      <>
        <Button icon={Plus} onPress={noop} tone="primary">
          Add account
        </Button>
        <Button icon={Trash2} onPress={noop} tone="danger">
          Delete
        </Button>
      </>,
    ),
};

export const IconOnly: Story = {
  name: "Icon only",
  render: () =>
    row(
      <>
        {/* An icon-only button has no visible text, so `accessibilityLabel` is
            required (and type-enforced) to give it an accessible name
            (WCAG 2.1 — 1.1.1 / 4.1.2). */}
        <Button
          accessibilityLabel="Settings"
          icon={Settings}
          onPress={noop}
          tone="ghost"
        />
        <Button accessibilityLabel="Edit" icon={Pencil} onPress={noop} />
        <Button
          accessibilityLabel="Delete"
          icon={Trash2}
          onPress={noop}
          tone="danger"
        />
      </>,
    ),
};

export const IconShapes: Story = {
  name: "Icon-only shapes",
  render: () => <IconShapesExample />,
};

export const CustomIconNode: Story = {
  name: "Custom icon node",
  render: () => <CustomIconNodeExample />,
};

export const Busy: Story = {
  name: "Busy",
  render: () => <BusyExample />,
};

export const BlockAndDisabled: Story = {
  name: "Block and disabled",
  render: () => (
    <StorySurface>
      <View style={styles.stack}>
        <Button block onPress={noop} tone="primary">
          Block primary
        </Button>
        <Button block disabled onPress={noop}>
          Disabled
        </Button>
      </View>
    </StorySurface>
  ),
};

export const RolesAndStates: Story = {
  name: "Roles and states",
  render: () => (
    <StorySurface>
      <RolesAndStatesExample />
    </StorySurface>
  ),
};

export const Interactive: Story = {
  name: "Interactive",
  render: () => (
    <StorySurface>
      <InteractiveExample />
    </StorySurface>
  ),
};

export const OnMedia: Story = {
  name: "On media",
  render: () => <OnMediaExample />,
};

export const PressLifecycle: Story = {
  name: "Press lifecycle",
  render: () => <PressLifecycleExample />,
};

export const TapTarget: Story = {
  name: "Tap target",
  render: () => <TapTargetExample />,
};

export const LabelAndSlots: Story = {
  name: "Label and slots",
  render: () => <LabelAndSlotsExample />,
};

export const MenuTrigger: Story = {
  name: "Menu trigger",
  render: () => <MenuTriggerExample />,
};
