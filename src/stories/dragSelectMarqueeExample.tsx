/**
 * The box options of the drag-select stories: an app-drawn box through
 * `renderMarquee`, the default box with a `marqueeLabel`, and the default
 * box without its badge (`selectionLabel` returning `null`).
 */
import { useState } from "react";
import { StyleSheet, Text, View } from "../primitives/reactNative";

import {
  DragSelectableProvider,
  SegmentedControl,
  useSharedUiTheme,
  type DragSelectableMarquee,
} from "../index";
import {
  LedgerRow,
  rows,
  SelectionStatus,
  transactionCountLabel,
} from "./dragSelectExamples";

type BoxStyle = "custom" | "labelled" | "badgeless";

const boxStyles: { label: string; value: BoxStyle }[] = [
  { label: "Custom box", value: "custom" },
  { label: "Labelled box", value: "labelled" },
  { label: "No badge", value: "badgeless" },
];

export function MarqueeOptionsExample() {
  const [boxStyle, setBoxStyle] = useState<BoxStyle>("custom");
  return (
    <View style={styles.page}>
      <SegmentedControl
        accessibilityLabel="Box style"
        onChange={setBoxStyle}
        options={boxStyles}
        value={boxStyle}
      />
      <DragSelectableProvider
        accessibilityLabel="Transactions"
        marqueeLabel={boxStyle === "labelled" ? "Select" : null}
        renderMarquee={
          boxStyle === "custom"
            ? (marquee) => <CustomMarquee marquee={marquee} />
            : undefined
        }
        selectionLabel={
          boxStyle === "badgeless"
            ? () => null
            : (count) => transactionCountLabel(count)
        }
        style={styles.provider}
      >
        <SelectionStatus />
        <View style={styles.list}>
          {rows.map((row) => (
            <LedgerRow key={row.id} row={row} />
          ))}
        </View>
      </DragSelectableProvider>
    </View>
  );
}

function CustomMarquee({ marquee }: { marquee: DragSelectableMarquee }) {
  const theme = useSharedUiTheme();
  return (
    <View
      style={[
        styles.customBox,
        {
          backgroundColor: `${theme.colors.amber}26`,
          borderColor: theme.colors.amberDeep,
          borderRadius: theme.radii.md,
        },
      ]}
      testID="custom-marquee"
    >
      <View
        style={[
          styles.chip,
          {
            backgroundColor: theme.colors.amberDeep,
            borderRadius: theme.radii.sm,
          },
        ]}
      >
        <Text style={[styles.chipText, { color: theme.colors.onSolid }]}>
          {`${transactionCountLabel(marquee.matchingCount)} · ${marquee.mode}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    position: "absolute",
    right: 6,
    top: 6,
  },
  chipText: { fontSize: 11, fontWeight: "800" },
  customBox: { borderStyle: "dashed", borderWidth: 2, flex: 1 },
  list: {
    borderColor: "#d3d8cd",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  page: { gap: 12, minWidth: 460 },
  provider: { gap: 12 },
});
