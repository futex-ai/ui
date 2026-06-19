import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Switch } from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Switch/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const PrivacyToggle: Story = {
  name: "Privacy toggle",
  render: () => (
    <StorySurface>
      <PrivacyToggleExample />
    </StorySurface>
  ),
};

export const Sizes: Story = {
  name: "Sizes",
  render: () => (
    <StorySurface>
      <SizesExample />
    </StorySurface>
  ),
};

function SizesExample() {
  const [small, setSmall] = useState(true);
  const [medium, setMedium] = useState(true);
  const [large, setLarge] = useState(true);
  return (
    <View style={styles.sizes}>
      <Switch
        accessibilityLabel="Small switch"
        onValueChange={setSmall}
        size="sm"
        value={small}
      />
      <Switch
        accessibilityLabel="Medium switch"
        onValueChange={setMedium}
        size="md"
        value={medium}
      />
      <Switch
        accessibilityLabel="Large switch"
        onValueChange={setLarge}
        size="lg"
        value={large}
      />
    </View>
  );
}

function PrivacyToggleExample() {
  const [enabled, setEnabled] = useState(true);
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text nativeID="analytics-cookies-label" style={styles.label}>
          Analytics cookies
        </Text>
        <Text style={styles.description}>Share product usage signals</Text>
      </View>
      {/* Associate the visible row label as the switch's name so the
          accessible name matches the visible text (2.5.3 Label in Name). */}
      <Switch
        aria-labelledby="analytics-cookies-label"
        onValueChange={setEnabled}
        value={enabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  description: {
    color: "#69706a",
    fontSize: 12,
    lineHeight: 18,
  },
  label: {
    color: "#1c1f1d",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19.5,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    minWidth: 300,
  },
  sizes: {
    alignItems: "center",
    flexDirection: "row",
    gap: 20,
    minWidth: 300,
  },
});
