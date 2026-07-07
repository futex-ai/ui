import type { Meta, StoryObj } from "@storybook/react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { WebModalFrame } from "@firna/ui/modal";

/**
 * Starts closed so the Storybook UI (navigation + addon controls) stays visible.
 * The native `Modal` is a full-screen overlay, so opening it covers the Storybook
 * chrome until dismissed — tap the trigger to preview, then close to return.
 */
function SheetDemo({ placement }: { placement: "bottom-sheet" | "center" }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.container}>
      <Pressable onPress={() => setOpen(true)} style={styles.openButton}>
        <Text style={styles.openButtonText}>Open {placement}</Text>
      </Pressable>
      <WebModalFrame
        footer={
          <Pressable onPress={() => setOpen(false)} style={styles.trigger}>
            <Text style={styles.triggerText}>Done</Text>
          </Pressable>
        }
        onClose={() => setOpen(false)}
        placement={placement}
        subtitle="Rendered natively via @firna/ui on iOS/Android"
        title="Native modal"
        visible={open}
      >
        <Text>
          Dismiss with the backdrop, the close button, or the Android back
          button. Swipe-to-dismiss is the planned Phase 2 follow-up.
        </Text>
      </WebModalFrame>
    </View>
  );
}

const meta: Meta<typeof SheetDemo> = {
  title: "Modal/Native sheet",
  component: SheetDemo,
  args: { placement: "bottom-sheet" },
  argTypes: {
    placement: {
      control: { type: "radio" },
      options: ["bottom-sheet", "center"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof SheetDemo>;

export const BottomSheet: Story = {};
export const CenterDialog: Story = { args: { placement: "center" } };

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  openButton: {
    backgroundColor: "#2f5945",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  openButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  trigger: { padding: 12 },
  triggerText: { fontSize: 16, fontWeight: "600" },
});
