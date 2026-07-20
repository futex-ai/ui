import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Popover } from "../index";

import {
  ControlledPopoverExample,
  PopoverExample,
  ResponsiveMenuExample,
  ResponsivePopoverExample,
  SelectorInPopoverExample,
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
 * A `DropdownSelector` nested inside a popover. Both overlays render through
 * their own `document.body` portal, so the open menu escapes the popover's
 * clipping box and stacks above it. Selecting an option updates the field and
 * keeps the popover open (its outside-press dismissal recognises the descendant
 * menu as inside), and Escape closes the menu before the popover.
 */
export const SelectorInPopover: Story = {
  name: "Popover with a nested selector",
  render: () => (
    <StorySurface>
      <SelectorInPopoverExample />
    </StorySurface>
  ),
};

/**
 * `ResponsivePopover` behind one controlled, externally-anchored API: an
 * anchored dialog on web (this story) and a bottom sheet on native. The web
 * surface inherits the popover a11y — `role="dialog"`, accessible name, focus
 * into the surface on open and back to the trigger on close, non-modal anchored
 * — from the shared `PopoverSurface`, and hosts a filter form whose nested
 * selector opens without dismissing the dialog.
 */
export const ResponsivePopoverWeb: Story = {
  name: "Responsive popover (web = anchored dialog)",
  render: () => (
    <StorySurface>
      <ResponsivePopoverExample />
    </StorySurface>
  ),
};

/**
 * `ResponsiveMenu` gives the responsive surface `DropdownMenu`'s keyboard
 * behaviour: opening moves focus into the dialog surface, yet ↑/↓ still move the
 * active row and Enter selects (a document-level listener drives the list
 * regardless of focus). On native the same `entries` render as tappable bottom
 * sheet rows. The caller owns only the trigger and the `open` state.
 */
export const ResponsiveMenuStory: Story = {
  name: "Responsive menu (keyboard-navigable)",
  render: () => (
    <StorySurface>
      <ResponsiveMenuExample />
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
