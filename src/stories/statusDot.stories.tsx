import type { Meta, StoryObj } from "@storybook/react-vite";
import { StyleSheet, View } from "react-native";

import { Badge, StatusDot, Text } from "../index";
import { darkSharedUiTheme } from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Status dot/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const tones = ["neutral", "primary", "warning", "danger"] as const;
const toneLabel = {
  neutral: "Draft",
  primary: "Active",
  warning: "Pending",
  danger: "Failed",
} as const;

export const Tones: Story = {
  name: "Tones",
  render: () => (
    <StorySurface>
      <View style={styles.stack}>
        {tones.map((tone) => (
          <View key={tone} style={styles.row}>
            <StatusDot tone={tone} />
            <Text>{toneLabel[tone]}</Text>
          </View>
        ))}
      </View>
    </StorySurface>
  ),
};

export const Pulsing: Story = {
  name: "Pulsing",
  render: () => (
    <StorySurface>
      <View style={styles.stack}>
        <View style={styles.row}>
          <StatusDot pulse tone="primary" />
          <Text>Running</Text>
        </View>
        <View style={styles.row}>
          <StatusDot tone="neutral" />
          <Text>Queued</Text>
        </View>
      </View>
    </StorySurface>
  ),
};

export const Sizes: Story = {
  name: "Sizes",
  render: () => (
    <StorySurface>
      <View style={styles.row}>
        <StatusDot size="sm" testID="statusDotSm" tone="primary" />
        <StatusDot size="md" testID="statusDotMd" tone="primary" />
        <StatusDot size="lg" testID="statusDotLg" tone="primary" />
      </View>
    </StorySurface>
  ),
};

export const InsideBadge: Story = {
  name: "Inside a badge",
  render: () => (
    <StorySurface>
      <View style={styles.row}>
        <Badge dot pulse tone="primary">
          Running
        </Badge>
        <Badge dot tone="neutral">
          Queued
        </Badge>
        <Badge dot tone="danger">
          Failed
        </Badge>
      </View>
    </StorySurface>
  ),
};

export const Dark: Story = {
  name: "Dark theme",
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
      <View style={styles.stack}>
        {tones.map((tone) => (
          <View key={tone} style={styles.row}>
            <StatusDot tone={tone} />
            <Text>{toneLabel[tone]}</Text>
          </View>
        ))}
      </View>
    </StorySurface>
  ),
};

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  stack: {
    gap: 12,
  },
});
