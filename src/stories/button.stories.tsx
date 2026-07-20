import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Bell,
  Check,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Settings,
  Trash2,
} from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "../index";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Button/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const noop = () => undefined;

const row = (node: React.ReactNode) => (
  <StorySurface>
    <View style={styles.row}>{node}</View>
  </StorySurface>
);

export const Tones: Story = {
  name: "Tones",
  render: () =>
    row(
      <>
        <Button onPress={noop} tone="primary">
          Primary
        </Button>
        <Button onPress={noop}>Secondary</Button>
        <Button onPress={noop} tone="ghost">
          Ghost
        </Button>
        <Button onPress={noop} tone="plain">
          Plain
        </Button>
        <Button onPress={noop} tone="danger">
          Danger
        </Button>
      </>,
    ),
};

export const Sizes: Story = {
  name: "Sizes",
  render: () =>
    row(
      <>
        <Button onPress={noop} size="sm" tone="primary">
          Small
        </Button>
        <Button onPress={noop} size="md" tone="primary">
          Medium
        </Button>
        <Button onPress={noop} size="lg" tone="primary">
          Large
        </Button>
      </>,
    ),
};

export const Inline: Story = {
  name: "Inline (in text)",
  render: () => (
    <StorySurface>
      <View style={styles.stack}>
        {/* The `inline` chip flows in a text row and collapses to the row's line
            height: the pill's fill/border overflow the text line above and below
            without making the row any taller (the "Moved to Trash — Restore"
            pattern). */}
        <View style={styles.inlineRow}>
          <Text style={styles.inlineText}>Moved to Trash</Text>
          <Button inline onPress={noop}>
            Restore
          </Button>
        </View>
        {/* Tones compose with `inline`: `secondary` (default) is a bordered chip,
            `ghost` and `plain` are borderless; a leading icon still works. */}
        <View style={styles.inlineRow}>
          <Text style={styles.inlineText}>Draft saved.</Text>
          <Button inline onPress={noop} tone="ghost">
            Undo
          </Button>
          <Button icon={RotateCcw} inline onPress={noop} tone="plain">
            Restore
          </Button>
        </View>
        {/* Each size collapses to its own text line height, so the row tracks the
            text beside it rather than the button. */}
        <View style={styles.inlineRow}>
          <Button inline onPress={noop} size="sm">
            Small
          </Button>
          <Button inline onPress={noop} size="md">
            Medium
          </Button>
          <Button inline onPress={noop} size="lg">
            Large
          </Button>
        </View>
      </View>
    </StorySurface>
  ),
};

export const WithIcons: Story = {
  name: "With icons",
  render: () =>
    row(
      <>
        <Button icon={Plus} onPress={noop} tone="primary">
          Add account
        </Button>
        <Button icon={Trash2} onPress={noop} tone="danger">
          Delete
        </Button>
      </>,
    ),
};

export const IconOnly: Story = {
  name: "Icon only",
  render: () =>
    row(
      <>
        {/* An icon-only button has no visible text, so `accessibilityLabel` is
            required (and type-enforced) to give it an accessible name
            (WCAG 2.1 — 1.1.1 / 4.1.2). */}
        <Button
          accessibilityLabel="Settings"
          icon={Settings}
          onPress={noop}
          tone="ghost"
        />
        <Button accessibilityLabel="Edit" icon={Pencil} onPress={noop} />
        <Button
          accessibilityLabel="Delete"
          icon={Trash2}
          onPress={noop}
          tone="danger"
        />
      </>,
    ),
};

export const IconShapes: Story = {
  name: "Icon-only shapes",
  render: () =>
    row(
      <>
        {/* Square + circle 1:1 tap targets, floored at a 40px touch target. The
            borderless `plain` tone is the flush header / composer icon button. */}
        <Button
          accessibilityLabel="Add"
          icon={Plus}
          minTouchTarget={40}
          onPress={noop}
          shape="square"
          tone="secondary"
        />
        <Button
          accessibilityLabel="Settings"
          icon={Settings}
          minTouchTarget={40}
          onPress={noop}
          shape="circle"
          tone="plain"
        />
        <Button
          accessibilityLabel="Notifications"
          icon={Bell}
          minTouchTarget={40}
          onPress={noop}
          shape="circle"
          tone="ghost"
        />
        <Button
          accessibilityLabel="More"
          icon={MoreHorizontal}
          minTouchTarget={40}
          onPress={noop}
          shape="circle"
          tone="plain"
        />
      </>,
    ),
};

export const CustomIconNode: Story = {
  name: "Custom icon node",
  render: () =>
    row(
      <>
        {/* `iconNode` renders any node as-is (not wrapped in `<Text>`, not
            tinted) — here a caller-coloured glyph and an emoji stand in for a
            non-lucide `@expo/vector-icons` glyph. */}
        <Button
          accessibilityLabel="Add"
          iconNode={<Plus color="#2f5945" size={18} />}
          minTouchTarget={40}
          onPress={noop}
          shape="circle"
          tone="plain"
        />
        <Button
          iconNode={<Text style={styles.emoji}>✨</Text>}
          onPress={noop}
          tone="primary"
        >
          Enhance
        </Button>
      </>,
    ),
};

export const Busy: Story = {
  name: "Busy",
  render: () => <BusyExample />,
};

export const BlockAndDisabled: Story = {
  name: "Block and disabled",
  render: () => (
    <StorySurface>
      <View style={styles.stack}>
        <Button block onPress={noop} tone="primary">
          Block primary
        </Button>
        <Button block disabled onPress={noop}>
          Disabled
        </Button>
      </View>
    </StorySurface>
  ),
};

export const Interactive: Story = {
  name: "Interactive",
  render: () => (
    <StorySurface>
      <InteractiveExample />
    </StorySurface>
  ),
};

function InteractiveExample() {
  const [saved, setSaved] = useState(false);
  return (
    <View style={styles.stack}>
      <Button
        icon={saved ? Check : undefined}
        onPress={() => setSaved(true)}
        tone="primary"
      >
        {saved ? "Saved" : "Save"}
      </Button>
      <Button disabled onPress={() => setSaved(true)}>
        Unavailable
      </Button>
    </View>
  );
}

function BusyExample() {
  const [busy, setBusy] = useState(false);
  return (
    <StorySurface>
      <View style={styles.stack}>
        {/* While busy the button keeps its label and focus, announces
            `aria-busy`, swaps the leading icon for a spinner, and ignores
            presses (WCAG 2.1 — 4.1.2 Name, Role, Value). */}
        <Button
          busy={busy}
          icon={Check}
          onPress={() => setBusy(true)}
          tone="primary"
        >
          {busy ? "Saving" : "Save"}
        </Button>
        <Button busy onPress={noop}>
          Loading
        </Button>
      </View>
    </StorySurface>
  );
}

const styles = StyleSheet.create({
  emoji: {
    fontSize: 16,
    lineHeight: 20,
  },
  inlineRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    minWidth: 320,
    // A little vertical headroom so the chip (and its focus ring), which overflow
    // the text line, are never clipped — required under an `overflow: "hidden"`
    // ancestor on web and by default on native Android.
    paddingVertical: 8,
  },
  inlineText: {
    color: "#1c1f1d",
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    minWidth: 320,
  },
  stack: {
    gap: 12,
    minWidth: 320,
  },
});
