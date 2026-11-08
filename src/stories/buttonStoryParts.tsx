/** The no-op handler, row wrapper, and styles that the Button stories share. */
import { StyleSheet, View } from "../primitives/reactNative";

import { StorySurface } from "./sharedExamples";

export const noop = () => undefined;

export const row = (node: React.ReactNode) => (
  <StorySurface>
    <View style={styles.row}>{node}</View>
  </StorySurface>
);

export const styles = StyleSheet.create({
  card: {
    alignItems: "flex-start",
    gap: 2,
  },
  cardButton: {
    alignItems: "flex-start",
    height: "auto",
    paddingVertical: 12,
  },
  cardTitle: {
    color: "#1c1f1d",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  flexLabel: {
    flex: 1,
    textAlign: "left",
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
  media: {
    alignItems: "center",
    backgroundColor: "#241f2c",
    borderRadius: 12,
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    minWidth: 320,
    padding: 24,
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
