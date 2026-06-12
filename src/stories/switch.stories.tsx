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

function PrivacyToggleExample() {
  const [enabled, setEnabled] = useState(true);
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.label}>Analytics cookies</Text>
        <Text style={styles.description}>Share product usage signals</Text>
      </View>
      <Switch
        accessibilityLabel="Analytics cookies"
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
    color: "#737b75",
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
});
