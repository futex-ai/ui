import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AnimatedBorder, darkSharedUiTheme } from "../index";
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

export const Dark: Story = {
  name: "Dark theme",
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
      <View style={styles.row}>
        <Badge>G</Badge>
        <AnimatedBorder borderRadius={7} size={24}>
          <Badge>G</Badge>
        </AnimatedBorder>
        <Text
          style={[styles.caption, { color: darkSharedUiTheme.colors.muted }]}
        >
          idle → active
        </Text>
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

// A round avatar to frame, standing in for a circular profile photo.
function AvatarDisc({
  children,
  size = 40,
}: {
  children: ReactNode;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.disc,
        { borderRadius: size / 2, height: size, width: size },
      ]}
    >
      <Text style={styles.discLabel}>{children}</Text>
    </View>
  );
}

export const Circles: Story = {
  name: "Circle and pill shape",
  render: () => (
    <StorySurface>
      <View style={styles.row}>
        {/* `shape="circle"` fully rounds the box — a true circle for a square,
            with no need to pass a matching `borderRadius`. */}
        <AnimatedBorder shape="circle" size={28}>
          <AvatarDisc size={28}>A</AvatarDisc>
        </AnimatedBorder>
        <AnimatedBorder shape="circle" size={40}>
          <AvatarDisc size={40}>B</AvatarDisc>
        </AnimatedBorder>
        <AnimatedBorder shape="circle" color="#946727" size={56}>
          <AvatarDisc size={56}>C</AvatarDisc>
        </AnimatedBorder>
        {/* In a non-square box `shape="circle"` traces the elongated stadium
            ("pill") — the trail follows the whole rounded outline. */}
        <AnimatedBorder height={40} shape="circle" width={72}>
          <View style={[styles.wideDisc, { borderRadius: 20 }]}>
            <Text style={styles.discLabel}>pill</Text>
          </View>
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

export const Gradient: Story = {
  name: "Two-color gradient",
  render: () => (
    <StorySurface>
      <View style={styles.column}>
        <View style={styles.row}>
          {/* A connected app's brand pair. The sweep runs from → to → from
              across the box, so both sides read the first color and the second
              runs through the middle. */}
          <AnimatedBorder
            borderRadius={7}
            color={["#36c5f0", "#e01e5a"]}
            size={24}
          >
            <Badge>S</Badge>
          </AnimatedBorder>
          <AnimatedBorder
            borderRadius={10}
            color={["#7b5cff", "#22c8a8"]}
            size={36}
          >
            <Badge borderRadius={10} size={36}>
              N
            </Badge>
          </AnimatedBorder>
          {/* Only one brand color to hand? Repeat it — a pair of the same color
              renders exactly like passing that color on its own, so a caller
              never has to branch. */}
          <AnimatedBorder
            borderRadius={7}
            color={["#a84f45", "#a84f45"]}
            size={24}
          >
            <Badge>1</Badge>
          </AnimatedBorder>
          <Text style={styles.caption}>pair → gradient, repeat → solid</Text>
        </View>
        <AnimatedBorder
          borderRadius={22}
          color={["#36c5f0", "#e01e5a"]}
          height={44}
          width={200}
        >
          <View style={[styles.pill, { borderRadius: 22 }]}>
            <Text style={styles.pillLabel}>Running…</Text>
          </View>
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
  disc: {
    alignItems: "center",
    backgroundColor: "#e3eee6",
    borderColor: "rgba(20, 18, 38, 0.08)",
    borderWidth: 1,
    justifyContent: "center",
  },
  discLabel: {
    color: "#2f5945",
    fontSize: 12,
    fontWeight: "700",
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
  wideDisc: {
    alignItems: "center",
    backgroundColor: "#eef2ed",
    height: 40,
    justifyContent: "center",
    width: 72,
  },
});
