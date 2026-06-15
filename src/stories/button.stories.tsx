import type { Meta, StoryObj } from "@storybook/react-vite";
import { Check, Plus, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Button/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const noop = () => undefined;

const row = (node: React.ReactNode) => (
  <StorySurface>
    <View style={styles.row}>{node}</View>
  </StorySurface>
);

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
        <Button onPress={noop} tone="danger">
          Danger
        </Button>
      </>,
    ),
};

export const Sizes: Story = {
  name: "Sizes",
  render: () =>
    row(
      <>
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

export const Interactive: Story = {
  name: "Interactive",
  render: () => (
    <StorySurface>
      <InteractiveExample />
    </StorySurface>
  ),
};

function InteractiveExample() {
  const [saved, setSaved] = useState(false);
  return (
    <View style={styles.stack}>
      <Button
        icon={saved ? Check : undefined}
        onPress={() => setSaved(true)}
        tone="primary"
      >
        {saved ? "Saved" : "Save"}
      </Button>
      <Button disabled onPress={() => setSaved(true)}>
        Unavailable
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    minWidth: 320,
  },
  stack: {
    gap: 12,
    minWidth: 320,
  },
});
