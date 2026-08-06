import type { Meta, StoryObj } from "@storybook/react-vite";
import { StyleSheet, View } from "react-native";

import { Badge } from "../index";
import { darkSharedUiTheme, junoSharedUiTheme } from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Badge/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const tones = ["neutral", "primary", "warning", "danger"] as const;
const toneLabel = {
  neutral: "Draft",
  primary: "Active",
  warning: "Pending",
  danger: "Overdue",
} as const;

export const Tones: Story = {
  name: "Tones (soft)",
  render: () => (
    <StorySurface>
      <View style={styles.row}>
        {tones.map((tone) => (
          <Badge key={tone} tone={tone}>
            {toneLabel[tone]}
          </Badge>
        ))}
      </View>
    </StorySurface>
  ),
};

export const Variants: Story = {
  name: "Soft & solid variants",
  render: () => (
    <StorySurface>
      <View style={styles.stack}>
        <View style={styles.row}>
          {tones.map((tone) => (
            <Badge key={tone} tone={tone} variant="soft">
              {toneLabel[tone]}
            </Badge>
          ))}
        </View>
        <View style={styles.row}>
          {tones.map((tone) => (
            <Badge key={tone} tone={tone} variant="solid">
              {toneLabel[tone]}
            </Badge>
          ))}
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
        <Badge size="sm" tone="primary">
          Active
        </Badge>
        <Badge size="md" tone="primary">
          Active
        </Badge>
        <Badge size="lg" tone="primary">
          Active
        </Badge>
      </View>
    </StorySurface>
  ),
};

export const OutlineVariant: Story = {
  name: "Outline variant",
  render: () => (
    <StorySurface>
      <View style={styles.row}>
        {tones.map((tone) => (
          <Badge key={tone} tone={tone} variant="outline">
            {toneLabel[tone]}
          </Badge>
        ))}
      </View>
    </StorySurface>
  ),
};

export const StatusDots: Story = {
  name: "Status dots",
  render: () => (
    <StorySurface>
      <View style={styles.stack}>
        <View style={styles.row}>
          {tones.map((tone) => (
            <Badge dot key={tone} tone={tone}>
              {toneLabel[tone]}
            </Badge>
          ))}
        </View>
        <View style={styles.row}>
          {tones.map((tone) => (
            <Badge dot key={tone} tone={tone} variant="outline">
              {toneLabel[tone]}
            </Badge>
          ))}
        </View>
      </View>
    </StorySurface>
  ),
};

export const PulsingDot: Story = {
  name: "Pulsing dot",
  render: () => (
    <StorySurface>
      <View style={styles.row}>
        <Badge dot pulse tone="primary">
          Running
        </Badge>
        <Badge dot pulse tone="warning" variant="outline">
          Syncing
        </Badge>
        <Badge dot tone="neutral">
          Queued
        </Badge>
      </View>
    </StorySurface>
  ),
};

// A caller-owned per-option palette (statuses the semantic tones do not cover),
// each rendered from an explicit soft fill + deep text + matching dot.
const customStatuses = [
  { dot: "#2563EB", fill: "#EAF1FF", label: "Design", text: "#1D4ED8" },
  { dot: "#7C3AED", fill: "#F1EAFE", label: "Research", text: "#6D28D9" },
  { dot: "#0D9488", fill: "#E3F6F3", label: "QA", text: "#0F766E" },
];

export const CustomPalette: Story = {
  name: "Custom colors",
  render: () => (
    <StorySurface>
      <View style={styles.row}>
        {customStatuses.map((status) => (
          <Badge
            color={status.fill}
            dot
            dotColor={status.dot}
            key={status.label}
            textColor={status.text}
          >
            {status.label}
          </Badge>
        ))}
      </View>
    </StorySurface>
  ),
};

export const Dark: Story = {
  name: "Dark theme",
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
      <View style={styles.stack}>
        <View style={styles.row}>
          {tones.map((tone) => (
            <Badge key={tone} tone={tone} variant="soft">
              {toneLabel[tone]}
            </Badge>
          ))}
        </View>
        <View style={styles.row}>
          {tones.map((tone) => (
            <Badge key={tone} tone={tone} variant="solid">
              {toneLabel[tone]}
            </Badge>
          ))}
        </View>
      </View>
    </StorySurface>
  ),
};

export const JunoTheme: Story = {
  name: "Juno theme",
  render: () => (
    <StorySurface theme={junoSharedUiTheme}>
      <View style={styles.stack}>
        <View style={styles.row}>
          {tones.map((tone) => (
            <Badge key={tone} tone={tone} variant="soft">
              {toneLabel[tone]}
            </Badge>
          ))}
        </View>
        <View style={styles.row}>
          {tones.map((tone) => (
            <Badge key={tone} tone={tone} variant="solid">
              {toneLabel[tone]}
            </Badge>
          ))}
        </View>
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
