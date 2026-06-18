import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Popover } from "../index";

import {
  ControlledPopoverExample,
  PopoverExample,
  StorySurface,
} from "./sharedExamples";

const meta = {
  title: "Popover/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const ContentPopover: Story = {
  name: "Content popover",
  render: () => (
    <StorySurface>
      <PopoverExample />
    </StorySurface>
  ),
};

export const ControlledPopover: Story = {
  name: "Controlled popover",
  render: () => (
    <StorySurface>
      <ControlledPopoverExample />
    </StorySurface>
  ),
};

/**
 * Names the surface so it is exposed as a `dialog` with an accessible name
 * (WCAG 4.1.2). The trigger advertises `aria-haspopup="dialog"`, `aria-expanded`
 * and — while open — `aria-controls` pointing at the surface (WCAG 1.3.1). On
 * web, opening moves focus into the surface and closing returns it to the
 * trigger (WCAG 2.4.3).
 */
export const NamedDialogPopover: Story = {
  name: "Named dialog popover",
  render: () => (
    <StorySurface>
      <Popover
        label="Account details"
        minWidth={240}
        role="dialog"
        trigger={({ open, triggerProps }) => (
          <Pressable
            {...triggerProps}
            accessibilityLabel="Account details"
            accessibilityRole="button"
            style={[storyStyles.button, open ? storyStyles.buttonOpen : null]}
          >
            <Text style={storyStyles.buttonText}>Details</Text>
          </Pressable>
        )}
      >
        {({ close }) => (
          <View style={storyStyles.card}>
            <Text style={storyStyles.title}>Greenhouse Studio</Text>
            <Text style={storyStyles.body}>
              Standard VAT scheme · GBP · Reconciled to 31 May.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={close}
              style={storyStyles.close}
            >
              <Text style={storyStyles.closeText}>Close</Text>
            </Pressable>
          </View>
        )}
      </Popover>
    </StorySurface>
  ),
};

const storyStyles = StyleSheet.create({
  body: { color: "#3c4641", fontSize: 13, lineHeight: 18 },
  button: {
    backgroundColor: "#ffffff",
    borderColor: "#9aa39b",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  buttonOpen: { borderColor: "#4f7864" },
  buttonText: { color: "#1f2a24", fontSize: 14, fontWeight: "600" },
  card: { gap: 6, padding: 12 },
  close: { alignSelf: "flex-start", paddingVertical: 4 },
  closeText: { color: "#4f7864", fontSize: 13, fontWeight: "600" },
  title: { color: "#1f2a24", fontSize: 15, fontWeight: "700" },
});
