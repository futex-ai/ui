import type { Meta, StoryObj } from "@storybook/react-vite";
import { StyleSheet, Text, View } from "react-native";

import { SkeletonBar, SkeletonCircle, SkeletonGroup } from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Skeleton/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primitives: Story = {
  name: "Primitives",
  render: () => (
    <StorySurface>
      <View style={styles.stack}>
        <Text style={styles.label}>Bars</Text>
        <View style={styles.bars}>
          <SkeletonBar width="40%" />
          <SkeletonBar width="80%" />
          <SkeletonBar width="60%" />
        </View>
        <Text style={styles.label}>Circle</Text>
        <SkeletonCircle diameter={48} />
      </View>
    </StorySurface>
  ),
};

/**
 * A list-row shape composed from a {@link SkeletonGroup}: an avatar circle, a
 * flexing title / description column, and a trailing chip — all breathing in
 * unison off the group's shared pulse.
 */
export const ComposedRow: Story = {
  name: "Composed row",
  render: () => (
    <StorySurface>
      <View style={styles.card}>
        <SkeletonGroup gap={12}>
          <SkeletonCircle diameter={40} />
          <SkeletonGroup direction="column" gap={6} style={styles.fill}>
            <SkeletonBar height={14} width="50%" />
            <SkeletonBar height={11} width="80%" />
          </SkeletonGroup>
          <SkeletonBar height={12} radius="pill" width={56} />
        </SkeletonGroup>
      </View>
    </StorySurface>
  ),
};

/** A card placeholder: a heading bar over a few flexing lines of body text. */
export const ComposedCard: Story = {
  name: "Composed card",
  render: () => (
    <StorySurface>
      <View style={styles.card}>
        <SkeletonGroup direction="column" gap={12}>
          <SkeletonBar height={18} radius="md" width="55%" />
          <SkeletonBar height={12} />
          <SkeletonBar height={12} />
          <SkeletonBar height={12} width="70%" />
        </SkeletonGroup>
      </View>
    </StorySurface>
  ),
};

const styles = StyleSheet.create({
  bars: {
    gap: 10,
    width: 280,
  },
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#e5e8e0",
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    width: 360,
  },
  fill: { flex: 1 },
  label: {
    color: "#3e4540",
    fontSize: 13,
    fontWeight: "600",
  },
  stack: {
    gap: 14,
  },
});
