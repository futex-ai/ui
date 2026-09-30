/** Viewport-edge placement fixture for the web calendar popover. */
import { useState } from "react";
import { StyleSheet, Text, View } from "../primitives/reactNative";

import { DateField } from "../index";
import { ViewportStage } from "./sharedExamples";

/**
 * Pins one date field near the top of the canvas and one 200px above the
 * bottom edge. That gap is enough for a scrolling menu but not for a whole
 * month, so the lower calendar flips to open above its field instead of being
 * clipped at the edge.
 */
export function CalendarBottomEdgeFlipExample() {
  const [near, setNear] = useState("2026-03-31");
  const [far, setFar] = useState("2026-03-31");
  return (
    <ViewportStage>
      <View style={styles.column}>
        <View style={styles.cell}>
          <Text style={styles.hint}>
            Anchored near the top edge — the calendar opens downward.
          </Text>
          <DateField label="Opens below" onChange={setNear} value={near} />
        </View>
        <View style={styles.cell}>
          <Text style={styles.hint}>
            Too close to the bottom edge for a whole month — the calendar flips
            to open upward.
          </Text>
          <DateField label="Flips above" onChange={setFar} value={far} />
        </View>
      </View>
    </ViewportStage>
  );
}

const styles = StyleSheet.create({
  cell: { gap: 8 },
  column: {
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: 200,
    paddingHorizontal: 24,
    paddingTop: 24,
    width: 360,
  },
  hint: { color: "#3e4540", fontSize: 13, lineHeight: 18 },
});
