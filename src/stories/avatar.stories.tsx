import type { Meta, StoryObj } from "@storybook/react-vite";
import { StyleSheet, View } from "react-native";

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
        <Avatar accessibilityLabel="Vivienne Archer" label="VA" size={48} />
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
});
