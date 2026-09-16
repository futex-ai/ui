/**
 * `ScrollView` and `FlatList`, exercised directly.
 *
 * The DOM backend (`src/primitives/dom`) reproduces `react-native-web`'s scroll
 * event rhythm, its imperative `scrollTo`, and `VirtualizedList`'s windowing;
 * these stories put each on screen with a readout so
 * `tests/browser/primitivesScrolling.spec.ts` can assert them without a
 * component in the way.
 *
 * Both are deterministic at rest: fixed sizes, a list whose settled window is a
 * function of those sizes alone, and no animation, so the recorded screenshot
 * and ARIA baselines are stable.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "../primitives/reactNative";

const INK = "#16201a";
const MUTED = "#4a5a50";
const SURFACE = "#ffffff";
const LINE = "#c9d4cc";
const ACCENT = "#1f5138";

/** Row geometry the windowed list declares, so the window is exact. */
const ROW_HEIGHT = 28;
/** Viewport the windowed list scrolls in. */
const LIST_HEIGHT = 84;
const LIST_ITEMS = Array.from({ length: 200 }, (_, index) => ({
  id: `row-${index}`,
  label: `Row ${index}`,
}));

const styles = StyleSheet.create({
  bar: {
    backgroundColor: "#eef3ef",
    borderColor: LINE,
    borderRadius: 6,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: ACCENT,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonLabel: { color: SURFACE, fontSize: 12, fontWeight: "600" },
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
  list: {
    borderColor: LINE,
    borderRadius: 8,
    borderWidth: 1,
    height: LIST_HEIGHT,
  },
  listRow: {
    height: ROW_HEIGHT,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  row: { alignItems: "center", flexDirection: "row", gap: 12 },
  scroller: {
    borderColor: LINE,
    borderRadius: 8,
    borderWidth: 1,
    height: 120,
  },
  scrollerContent: { gap: 8, padding: 8 },
  title: { color: INK, fontSize: 14, fontWeight: "600" },
});

/** A fixed-size scroller that reports where it is and can be driven. */
function Scroller() {
  const scrollRef = useRef<ScrollView>(null);
  const [offset, setOffset] = useState(0);
  const [content, setContent] = useState("unmeasured");
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setOffset(Math.round(event.nativeEvent.contentOffset.y));
  };
  return (
    <View style={styles.frame}>
      <Text accessibilityRole="header" style={styles.heading}>
        Scroll view
      </Text>
      <ScrollView
        contentContainerStyle={styles.scrollerContent}
        onContentSizeChange={(width, height) =>
          setContent(`${Math.round(width)}x${Math.round(height)}`)
        }
        onScroll={onScroll}
        ref={scrollRef}
        scrollEventThrottle={16}
        style={styles.scroller}
        // A scrollable region needs keyboard access of its own when nothing
        // inside it is focusable (axe's `scrollable-region-focusable`).
        tabIndex={0}
        testID="scroller"
      >
        {Array.from({ length: 12 }, (_, index) => (
          <View key={index} style={styles.bar}>
            <Text style={styles.caption}>{`Band ${index}`}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            scrollRef.current?.scrollTo({ animated: false, y: 200 })
          }
          style={styles.button}
          testID="scroll-to-200"
        >
          <Text style={styles.buttonLabel}>Scroll to 200</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => scrollRef.current?.scrollToEnd({ animated: false })}
          style={styles.button}
          testID="scroll-to-end"
        >
          <Text style={styles.buttonLabel}>Scroll to end</Text>
        </Pressable>
      </View>
      <Text style={styles.title} testID="scroll-offset">
        {`offset ${offset}`}
      </Text>
      <Text style={styles.caption} testID="scroll-content-size">
        {content}
      </Text>
    </View>
  );
}

/** One row, counted while it is mounted so the readout tracks the window. */
function CountedRow({
  label,
  onCount,
}: {
  label: string;
  onCount: (delta: number) => void;
}) {
  useEffect(() => {
    onCount(1);
    return () => onCount(-1);
  }, [onCount]);
  return (
    <View style={styles.listRow}>
      <Text style={styles.caption}>{label}</Text>
    </View>
  );
}

/** A windowed list that reports how many of its rows are actually rendered. */
function WindowedList() {
  const [rendered, setRendered] = useState(0);
  const onCount = useCallback(
    (delta: number) => setRendered((count) => count + delta),
    [],
  );
  const getItemLayout = useCallback(
    (_data: unknown, index: number) => ({
      index,
      length: ROW_HEIGHT,
      offset: ROW_HEIGHT * index,
    }),
    [],
  );
  return (
    <View style={styles.frame}>
      <Text accessibilityRole="header" style={styles.heading}>
        Windowed list
      </Text>
      <FlatList
        data={LIST_ITEMS}
        getItemLayout={getItemLayout}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CountedRow label={item.label} onCount={onCount} />
        )}
        style={styles.list}
        tabIndex={0}
        testID="windowed-list"
      />
      <Text style={styles.title} testID="rendered-count">
        {`${rendered} of ${LIST_ITEMS.length} rendered`}
      </Text>
    </View>
  );
}

const meta = {
  parameters: { layout: "centered" },
  title: "Primitives/Scrolling",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Scroll: Story = { render: () => <Scroller /> };

export const Windowed: Story = { render: () => <WindowedList /> };
