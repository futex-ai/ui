/**
 * `TextInput`, `Animated` and the gesture responder, exercised directly.
 *
 * These are the three parts of the DOM backend with no component of their own
 * to hide behind: a field's callbacks, an animated value's interpolations, and
 * the responder negotiation `PanResponder` is built on.
 * `tests/browser/primitivesInteraction.spec.ts` drives them.
 *
 * Every story is at rest when it mounts — empty fields, a value sitting at 0,
 * an untouched drag box — so the recorded screenshot and ARIA baselines are
 * stable without opting out of either.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
} from "../primitives/reactNative";

const INK = "#16201a";
const MUTED = "#4a5a50";
const SURFACE = "#ffffff";
const LINE = "#c9d4cc";
const ACCENT = "#1f5138";

const styles = StyleSheet.create({
  bar: {
    backgroundColor: "#eef3ef",
    borderColor: LINE,
    borderRadius: 6,
    borderWidth: 1,
    height: 16,
    overflow: "hidden",
    width: 240,
  },
  barFill: { backgroundColor: ACCENT, height: 16 },
  button: {
    backgroundColor: ACCENT,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonLabel: { color: SURFACE, fontSize: 12, fontWeight: "600" },
  caption: { color: MUTED, fontSize: 12 },
  dragBox: {
    alignItems: "center",
    backgroundColor: "#eef3ef",
    borderColor: LINE,
    borderRadius: 8,
    borderWidth: 1,
    height: 90,
    justifyContent: "center",
    // A draggable surface has to opt out of text selection, or the browser
    // starts selecting its label and the responder system terminates the
    // gesture on the resulting `selectionchange`.
    userSelect: "none",
    width: 240,
  },
  field: {
    borderColor: LINE,
    borderRadius: 8,
    borderWidth: 1,
    color: INK,
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: 240,
  },
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
  multiline: { height: 64 },
  row: { alignItems: "center", flexDirection: "row", gap: 12 },
  spinner: {
    backgroundColor: ACCENT,
    borderRadius: 4,
    height: 24,
    width: 24,
  },
  title: { color: INK, fontSize: 14, fontWeight: "600" },
});

/** A single-line and a multiline field, each reporting its callbacks. */
function TextFields() {
  const [value, setValue] = useState("");
  const [key, setKey] = useState("none");
  const [submitted, setSubmitted] = useState("none");
  const [selection, setSelection] = useState("none");
  const [multiline, setMultiline] = useState("");
  const [baseHeight, setBaseHeight] = useState<number | null>(null);
  const [grown, setGrown] = useState(0);
  return (
    <View style={styles.frame}>
      <Text accessibilityRole="header" style={styles.heading}>
        Text input
      </Text>
      <TextInput
        accessibilityLabel="Single line"
        onChangeText={setValue}
        onKeyPress={(event) => setKey(event.nativeEvent.key)}
        onSelectionChange={(event) => {
          const { end, start } = event.nativeEvent.selection;
          setSelection(`${start}-${end}`);
        }}
        onSubmitEditing={(event) => setSubmitted(event.nativeEvent.text)}
        placeholder="Type here"
        style={styles.field}
        testID="single-line"
        value={value}
      />
      <Text style={styles.title} testID="text-value">{`value ${value}`}</Text>
      <Text style={styles.caption} testID="text-key">{`key ${key}`}</Text>
      <Text
        style={styles.caption}
        testID="text-selection"
      >{`selection ${selection}`}</Text>
      <Text
        style={styles.caption}
        testID="text-submitted"
      >{`submitted ${submitted}`}</Text>
      <TextInput
        accessibilityLabel="Multi line"
        multiline
        onChangeText={setMultiline}
        onContentSizeChange={(event) => {
          const { height } = event.nativeEvent.contentSize;
          // Reported as a delta from the first measurement, so the readout is
          // zero at rest whatever the font metrics turn out to be.
          setBaseHeight((base) => base ?? height);
          setGrown((current) =>
            baseHeight == null ? 0 : Math.max(current, height - baseHeight),
          );
        }}
        placeholder="Several lines"
        style={[styles.field, styles.multiline]}
        testID="multi-line"
        value={multiline}
      />
      <Text style={styles.caption} testID="text-grown">{`grew ${grown}`}</Text>
    </View>
  );
}

/** An animated value driven by hand, so every frame it shows is a known one. */
function AnimatedValues() {
  const progress = useRef(new Animated.Value(0)).current;
  const [reported, setReported] = useState(0);
  useEffect(() => {
    const id = progress.addListener(({ value }) => setReported(value));
    return () => progress.removeListener(id);
  }, [progress]);

  const width = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 1],
        outputRange: ["0%", "100%"],
      }),
    [progress],
  );
  const rotate = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
      }),
    [progress],
  );

  const run = useCallback(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      duration: 120,
      easing: Easing.linear,
      toValue: 1,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={styles.frame}>
      <Text accessibilityRole="header" style={styles.heading}>
        Animated value
      </Text>
      <View style={styles.bar} testID="animated-track">
        <Animated.View style={[styles.barFill, { width }]} />
      </View>
      <View style={styles.row}>
        <Animated.View
          style={[styles.spinner, { transform: [{ rotate }] }]}
          testID="animated-spinner"
        />
        <Text
          style={styles.title}
          testID="animated-progress"
        >{`progress ${reported.toFixed(3)}`}</Text>
      </View>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          onPress={() => progress.setValue(0.5)}
          style={styles.button}
          testID="animated-half"
        >
          <Text style={styles.buttonLabel}>Set 0.5</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={run}
          style={styles.button}
          testID="animated-run"
        >
          <Text style={styles.buttonLabel}>Animate</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** A box driven by `PanResponder`, beside one using the raw responder props. */
function Dragging() {
  const [pan, setPan] = useState("idle 0,0");
  const [spot, setSpot] = useState("none");
  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.hypot(gesture.dx, gesture.dy) > 4,
        onPanResponderGrant: () => setPan("grant 0,0"),
        onPanResponderMove: (_event, gesture) =>
          setPan(`move ${Math.round(gesture.dx)},${Math.round(gesture.dy)}`),
        onPanResponderRelease: (_event, gesture) =>
          setPan(`release ${Math.round(gesture.dx)},${Math.round(gesture.dy)}`),
        onPanResponderTerminate: () => setPan("terminate 0,0"),
      }),
    [],
  );
  const at = useCallback((event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    setSpot(`${Math.round(locationX)},${Math.round(locationY)}`);
  }, []);
  return (
    <View style={styles.frame}>
      <Text accessibilityRole="header" style={styles.heading}>
        Gestures
      </Text>
      <View {...responder.panHandlers} style={styles.dragBox} testID="pan-box">
        <Text style={styles.caption}>Drag me</Text>
      </View>
      <Text style={styles.title} testID="pan-state">
        {pan}
      </Text>
      <View
        onResponderGrant={at}
        onResponderMove={at}
        onStartShouldSetResponder={() => true}
        style={styles.dragBox}
        testID="responder-box"
      >
        <Text style={styles.caption}>Touch me</Text>
      </View>
      <Text style={styles.title} testID="responder-spot">
        {spot}
      </Text>
    </View>
  );
}

const meta = {
  parameters: { layout: "centered" },
  title: "Primitives/Interaction",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Fields: Story = { render: () => <TextFields /> };

export const Motion: Story = { render: () => <AnimatedValues /> };

export const Gestures: Story = { render: () => <Dragging /> };
