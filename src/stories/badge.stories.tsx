import type { Meta, StoryObj } from "@storybook/react-vite";
import { StyleSheet, View } from "react-native";

import { Badge } from "../index";
import { junoSharedUiTheme } from "../index";
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
