import type { Meta, StoryObj } from "@storybook/react-vite";
import { StyleSheet, Text, View } from "react-native";

import { Avatar } from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Avatar/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const UserAvatars: Story = {
  name: "User avatars",
  render: () => (
    <StorySurface>
      <View style={styles.row}>
        <Avatar accessibilityLabel="Greenhouse Studio" label="GS" />
        <Avatar accessibilityLabel="Payroll Reserve" label="PR" tone="soft" />
        <Avatar
          accessibilityLabel="Accounts Receivable"
          label="AR"
          style={styles.amberDisc}
          // Darkened from #946727 (4.22:1) to clear the 4.5:1 AA text-contrast
          // floor on the cream disc (#74511f ≈ 6.07:1).
          textColor="#74511f"
          tone="soft"
        />
        <Avatar accessibilityLabel="Vivienne Archer" label="VA" size={48} />
      </View>
    </StorySurface>
  ),
};

export const DecorativeBesideLabel: Story = {
  name: "Decorative beside a visible label",
  render: () => (
    <StorySurface>
      <View style={styles.column}>
        {/* The avatar is purely decorative here: the visible name already
            identifies the person, so `decorative` hides the disc from AT to
            avoid a duplicate announcement (1.1.1). */}
        <View style={styles.labelRow}>
          <Avatar decorative label="VA" />
          <Text>Vivienne Archer</Text>
        </View>
        <View style={styles.labelRow}>
          <Avatar decorative label="PR" tone="soft" />
          <Text>Payroll Reserve</Text>
        </View>
      </View>
    </StorySurface>
  ),
};

const SHAPE_SIZES = [24, 32, 48, 64];

export const Shapes: Story = {
  name: "Circle and rounded square",
  render: () => (
    <StorySurface>
      <View style={styles.column}>
        {/* The square corner scales with `size` (radii.avatarRatio, 0.25 by
            default), so the shape reads the same at 24px and at 64px. */}
        <View style={styles.row}>
          {SHAPE_SIZES.map((size) => (
            <Avatar
              accessibilityLabel={`Circle ${size}`}
              key={size}
              label="GS"
              size={size}
            />
          ))}
        </View>
        <View style={styles.row}>
          {SHAPE_SIZES.map((size) => (
            <Avatar
              accessibilityLabel={`Square ${size}`}
              key={size}
              label="GS"
              shape="square"
              size={size}
            />
          ))}
        </View>
        <View style={styles.row}>
          <Avatar
            accessibilityLabel="Payroll Reserve"
            label="PR"
            shape="square"
            size={48}
            tone="soft"
          />
          <Avatar
            accessibilityLabel="Accounts Receivable"
            label="AR"
            shape="square"
            size={48}
            style={styles.amberDisc}
            // Darkened from #946727 (4.22:1) to clear the 4.5:1 AA text-contrast
            // floor on the cream disc (#74511f ≈ 6.07:1).
            textColor="#74511f"
            tone="soft"
          />
        </View>
      </View>
    </StorySurface>
  ),
};

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
  },
  amberDisc: {
    backgroundColor: "#f4ecd8",
  },
  column: {
    gap: 12,
  },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
});
