import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AnimatedBorder } from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "AnimatedBorder/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

// A small rounded badge to frame, standing in for an app's tool icon or avatar.
function Badge({
  borderRadius = 7,
  children,
  size = 24,
}: {
  borderRadius?: number;
  children: ReactNode;
  size?: number;
}) {
  return (
    <View style={[styles.badge, { borderRadius, height: size, width: size }]}>
      <Text style={styles.badgeLabel}>{children}</Text>
    </View>
  );
}

export const ActiveIcon: Story = {
  name: "Active icon",
  render: () => (
    <StorySurface>
      <View style={styles.row}>
        <Badge>G</Badge>
        <AnimatedBorder borderRadius={7} size={24}>
          <Badge>G</Badge>
        </AnimatedBorder>
        <Text style={styles.caption}>idle → active</Text>
      </View>
    </StorySurface>
  ),
};

export const Sizes: Story = {
  name: "Sizes and radii",
  render: () => (
    <StorySurface>
      <View style={styles.row}>
        <AnimatedBorder borderRadius={6} size={20}>
          <Badge borderRadius={6} size={20}>
            S
          </Badge>
        </AnimatedBorder>
        <AnimatedBorder borderRadius={7} size={24}>
          <Badge borderRadius={7} size={24}>
            M
          </Badge>
        </AnimatedBorder>
        <AnimatedBorder borderRadius={10} size={36}>
          <Badge borderRadius={10} size={36}>
            L
          </Badge>
        </AnimatedBorder>
      </View>
    </StorySurface>
  ),
};

export const NonSquare: Story = {
  name: "Non-square boxes",
  render: () => (
    <StorySurface>
      <View style={styles.column}>
        <AnimatedBorder borderRadius={22} height={44} width={200}>
          <View style={[styles.pill, { borderRadius: 22 }]}>
            <Text style={styles.pillLabel}>Generating…</Text>
          </View>
        </AnimatedBorder>
        <AnimatedBorder borderRadius={14} height={120} width={200}>
          <View style={[styles.card, { borderRadius: 14 }]}>
            <Text style={styles.cardLabel}>Working on it</Text>
          </View>
        </AnimatedBorder>
      </View>
    </StorySurface>
  ),
};

export const Tuned: Story = {
  name: "Color and trail tuning",
  render: () => (
    <StorySurface>
      <View style={styles.row}>
        <AnimatedBorder borderRadius={7} color="#a84f45" size={24}>
          <Badge>!</Badge>
        </AnimatedBorder>
        <AnimatedBorder
          borderRadius={7}
          borderWidth={1.5}
          color="#946727"
          duration={1100}
          size={24}
          trailCount={10}
          trailSpacing={4}
        >
          <Badge>★</Badge>
        </AnimatedBorder>
      </View>
    </StorySurface>
  ),
};

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    backgroundColor: "#e3eee6",
    borderColor: "rgba(20, 18, 38, 0.08)",
    borderWidth: 1,
    justifyContent: "center",
  },
  badgeLabel: {
    color: "#2f5945",
    fontSize: 12,
    fontWeight: "700",
  },
  caption: {
    color: "#69706a",
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    alignItems: "center",
    backgroundColor: "#eef2ed",
    height: 120,
    justifyContent: "center",
    width: 200,
  },
  cardLabel: {
    color: "#3e4540",
    fontSize: 13,
    fontWeight: "600",
  },
  column: {
    alignItems: "flex-start",
    flexDirection: "column",
    gap: 24,
  },
  pill: {
    alignItems: "center",
    backgroundColor: "#e3eee6",
    height: 44,
    justifyContent: "center",
    width: 200,
  },
  pillLabel: {
    color: "#2f5945",
    fontSize: 13,
    fontWeight: "700",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 24,
  },
});
