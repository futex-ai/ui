/**
 * The platform primitives, exercised directly.
 *
 * Every other story renders a component; these render `View`, `Text`,
 * `Pressable` and `Image` on their own, so the behaviours the DOM backend
 * (`src/primitives/dom`) has to reproduce — press and keyboard state, line
 * clamping, text inheritance, `pointerEvents` pass-through, `onLayout`, the
 * role-to-element table — are pinned somewhere a change to the backend cannot
 * hide. `tests/browser/primitives.spec.ts` drives them.
 *
 * Everything here is deterministic on purpose: fixed sizes, no clock, no
 * randomness, so the story's screenshot and ARIA baselines are stable.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import {
  Image,
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
  clamp: { color: INK, fontSize: 14, width: 220 },
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
  overlay: {
    alignItems: "flex-end",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    paddingHorizontal: 12,
    position: "absolute",
    right: 0,
    top: 0,
  },
  overlayHost: { height: 64, position: "relative", width: 300 },
  pill: {
    backgroundColor: ACCENT,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillLabel: { color: SURFACE, fontSize: 12, fontWeight: "600" },
  press: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 240,
  },
  row: { alignItems: "center", flexDirection: "row", gap: 12 },
  strong: { color: ACCENT, fontWeight: "700" },
  thumb: { borderRadius: 6, height: 54, width: 96 },
  title: { color: INK, fontSize: 14, fontWeight: "600" },
  underlay: {
    alignItems: "flex-start",
    backgroundColor: "#eef3ef",
    borderColor: LINE,
    borderRadius: 8,
    borderWidth: 1,
    height: 64,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
});

const THUMBNAIL = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="27">' +
    '<rect width="48" height="27" fill="hsl(150 40% 42%)"/>' +
    '<circle cx="16" cy="11" r="5" fill="hsl(70 62% 78%)"/>' +
    "</svg>",
)}`;

/**
 * The interaction state a `Pressable` hands its callbacks. React Native's own
 * types stop at `pressed`; `hovered` and `focused` are the web additions the
 * backend reports, so the callbacks name them here the way `focusRing.ts`'s
 * `PressableHoverState` does for the components.
 */
type PressState = {
  pressed: boolean;
  hovered?: boolean;
  focused?: boolean;
};

const PARAGRAPH =
  "A single line of text that is far too long for the box it sits in, so the backend has to clamp it.";

/** Reports its own interaction state, so a test can read every press phase. */
function PressStates() {
  const [log, setLog] = useState("idle");
  return (
    <View style={styles.frame}>
      <Text accessibilityRole="header" style={styles.heading}>
        Press states
      </Text>
      <Pressable
        // Deliberately rebuilt on every render and closing over `log`, which is
        // what makes a stale hover listener visible: an `onHoverOut` captured
        // when the pointer entered would report the log from back then.
        onHoverIn={() => setLog("hoverin")}
        onHoverOut={() => setLog(`hoverout after ${log}`)}
        onLongPress={() => setLog("longpress")}
        onPress={() => setLog("press")}
        onPressIn={() => setLog("pressin")}
        onPressOut={() => setLog("pressout")}
        style={({ focused, hovered, pressed }: PressState) => [
          styles.press,
          {
            backgroundColor: pressed
              ? "#d3e2d8"
              : hovered
                ? "#eaf1ec"
                : SURFACE,
            borderColor: focused ? ACCENT : LINE,
          },
        ]}
        testID="press-target"
      >
        {({ focused, hovered, pressed }: PressState) => (
          <Text style={styles.title} testID="press-state">
            {`pressed:${pressed} hovered:${hovered} focused:${focused}`}
          </Text>
        )}
      </Pressable>
      <Text style={styles.caption} testID="press-log">
        {log}
      </Text>
    </View>
  );
}

/** A `View` whose measured box is written back into the tree. */
function LayoutReport() {
  const [size, setSize] = useState<string>("unmeasured");
  const onLayout = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;
    setSize(`${Math.round(width)}x${Math.round(height)}`);
  };
  return (
    <View style={styles.frame}>
      <Text accessibilityRole="header" style={styles.heading}>
        Layout
      </Text>
      <View onLayout={onLayout} style={styles.box} testID="layout-box">
        <Text style={styles.caption}>240 x 64</Text>
      </View>
      <Text style={styles.title} testID="layout-size">
        {size}
      </Text>
    </View>
  );
}

const meta = {
  parameters: { layout: "centered" },
  title: "Primitives/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Press: Story = { render: () => <PressStates /> };

export const Layout: Story = { render: () => <LayoutReport /> };

export const ClampedText: Story = {
  render: () => (
    <View style={styles.frame}>
      <Text accessibilityRole="header" aria-level={2} style={styles.heading}>
        Clamped text
      </Text>
      <Text numberOfLines={1} style={styles.clamp} testID="clamp-one">
        {PARAGRAPH}
      </Text>
      <Text numberOfLines={2} style={styles.clamp} testID="clamp-two">
        {PARAGRAPH}
      </Text>
      <Text selectable={false} style={styles.clamp} testID="clamp-none">
        {PARAGRAPH}
      </Text>
    </View>
  ),
};

export const NestedText: Story = {
  render: () => (
    <View style={styles.frame}>
      <Text accessibilityRole="header" style={styles.heading}>
        Nested text
      </Text>
      <Text style={{ color: ACCENT, fontSize: 16 }} testID="nested-root">
        Inherited colour and size, with{" "}
        <Text style={styles.strong} testID="nested-child">
          a bolder run
        </Text>{" "}
        and a{" "}
        <Text style={{ color: MUTED }} testID="nested-override">
          muted one
        </Text>
        .
      </Text>
    </View>
  ),
};

export const PointerEvents: Story = {
  render: () => (
    <View style={styles.frame}>
      <Text accessibilityRole="header" style={styles.heading}>
        Pointer events
      </Text>
      <View style={styles.overlayHost}>
        <Pressable
          accessibilityLabel="Underlay"
          accessibilityRole="button"
          style={styles.underlay}
          testID="pe-underlay"
        >
          <Text style={styles.title}>Underlay</Text>
        </Pressable>
        <View
          pointerEvents="box-none"
          style={styles.overlay}
          testID="pe-overlay"
        >
          <Pressable
            accessibilityLabel="Overlay action"
            accessibilityRole="button"
            style={styles.pill}
            testID="pe-overlay-button"
          >
            <Text style={styles.pillLabel}>Overlay action</Text>
          </Pressable>
        </View>
      </View>
      <View pointerEvents="none" style={styles.row} testID="pe-inert">
        <Text style={styles.caption}>This row ignores the pointer.</Text>
      </View>
    </View>
  ),
};

export const ImageAndRoles: Story = {
  render: () => (
    <View style={styles.frame}>
      <Text accessibilityRole="header" aria-level={3} style={styles.heading}>
        Image and roles
      </Text>
      <View style={styles.row}>
        <Image
          accessibilityLabel="Sample frame"
          accessibilityRole="image"
          source={{ uri: THUMBNAIL }}
          style={styles.thumb}
          testID="image-frame"
        />
        <Text style={styles.caption}>96 x 54, cover</Text>
      </View>
    </View>
  ),
};
