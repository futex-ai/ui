import type { Meta, StoryObj } from "@storybook/react-vite";
import { StyleSheet, Text, View } from "react-native";

import { Spinner, darkSharedUiTheme } from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Spinner/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const LoadingStates: Story = {
  name: "Loading states",
  render: () => (
    <StorySurface>
      <View style={styles.row}>
        <Spinner />
        <Text style={styles.label}>Loading invoices…</Text>
      </View>
    </StorySurface>
  ),
};

export const Dark: Story = {
  name: "Dark theme",
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
      <View style={styles.row}>
        <Spinner />
        <Text style={[styles.label, { color: darkSharedUiTheme.colors.ink2 }]}>
          Loading invoices…
        </Text>
      </View>
    </StorySurface>
  ),
};

export const Sizes: Story = {
  name: "Sizes",
  render: () => (
    <StorySurface>
      <View style={styles.sizes}>
        <Spinner accessibilityLabel="Small spinner" size="sm" />
        <Spinner accessibilityLabel="Medium spinner" size="md" />
        <Spinner accessibilityLabel="Large spinner" size="lg" />
        <Spinner accessibilityLabel="Extra large spinner" size={48} />
      </View>
    </StorySurface>
  ),
};

export const OnColoredSurface: Story = {
  name: "On a colored surface",
  render: () => (
    <StorySurface>
      <View style={styles.button}>
        <Spinner
          accessibilityLabel="Saving"
          color="#fff"
          size="sm"
          trackColor="rgba(255, 255, 255, 0.35)"
        />
        <Text style={styles.buttonText}>Saving…</Text>
      </View>
    </StorySurface>
  ),
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: "#2f5945",
    borderRadius: 8,
    flexDirection: "row",
    gap: 10,
    height: 40,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  label: {
    color: "#3e4540",
    fontSize: 13,
    fontWeight: "600",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minWidth: 240,
  },
  sizes: {
    alignItems: "center",
    flexDirection: "row",
    gap: 24,
  },
});
