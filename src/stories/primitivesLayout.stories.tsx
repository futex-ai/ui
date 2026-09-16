/**
 * `onLayout`, when it is not there from the start.
 *
 * The DOM backend drives `onLayout` from one shared `ResizeObserver`, and it
 * observes a node for as long as the node has a handler — not only from the
 * render that mounted it, which is where `react-native-web`'s own
 * `useElementLayout` stopped (its observe effect depended on the ref and the
 * observer alone, so a handler attached later never fired). That is a
 * deliberate improvement, so it has a story of its own.
 *
 * Deterministic: the box is unmeasured until the button is pressed, so the
 * recorded screenshot and ARIA baselines never see a measurement.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "../primitives/reactNative";

const INK = "#16201a";
const MUTED = "#4a5a50";
const SURFACE = "#ffffff";
const LINE = "#c9d4cc";
const ACCENT = "#1f5138";

const styles = StyleSheet.create({
  box: {
    alignItems: "center",
    borderColor: LINE,
    borderRadius: 8,
    borderWidth: 1,
    height: 64,
    justifyContent: "center",
    width: 240,
  },
  caption: { color: MUTED, fontSize: 12 },
  frame: {
    backgroundColor: SURFACE,
    borderColor: LINE,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    padding: 16,
    width: 420,
  },
  heading: { color: INK, fontSize: 20, fontWeight: "700" },
  pill: {
    backgroundColor: ACCENT,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillLabel: { color: SURFACE, fontSize: 12, fontWeight: "600" },
  title: { color: INK, fontSize: 14, fontWeight: "600" },
});

/** A `View` mounted without an `onLayout` that is given one later. */
function LateLayoutReport() {
  const [size, setSize] = useState("unmeasured");
  const [watching, setWatching] = useState(false);
  const onLayout = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;
    setSize(`${Math.round(width)}x${Math.round(height)}`);
  };
  return (
    <View style={styles.frame}>
      <Text accessibilityRole="header" style={styles.heading}>
        Late layout
      </Text>
      <View
        onLayout={watching ? onLayout : undefined}
        style={styles.box}
        testID="late-layout-box"
      >
        <Text style={styles.caption}>Unwatched until asked</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => setWatching(true)}
        style={styles.pill}
        testID="late-layout-watch"
      >
        <Text style={styles.pillLabel}>Watch</Text>
      </Pressable>
      <Text style={styles.title} testID="late-layout-size">
        {size}
      </Text>
    </View>
  );
}

const meta = {
  parameters: { layout: "centered" },
  title: "Primitives/Layout",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const LateLayout: Story = { render: () => <LateLayoutReport /> };
