import { StyleSheet } from "react-native";

import type { ControlSize } from "../controlSize";
import type { SharedUiTheme } from "../theme";

/**
 * Per-size geometry for the switch: the track width/height, the knob diameter,
 * its inset from the track edge, the on-position offset (track − knob − inset),
 * and the surrounding touch-target diameter. `md` matches the original 40×24
 * track with an 18px knob; `sm` is the compact density and `lg` the roomier,
 * touch-first density.
 */
const SWITCH_SIZES: Record<
  ControlSize,
  {
    inset: number;
    knobOn: number;
    knobSize: number;
    touchTarget: number;
    trackHeight: number;
    trackWidth: number;
  }
> = {
  sm: {
    inset: 3,
    knobOn: 15,
    knobSize: 14,
    touchTarget: 40,
    trackHeight: 20,
    trackWidth: 32,
  },
  md: {
    inset: 3,
    knobOn: 19,
    knobSize: 18,
    touchTarget: 44,
    trackHeight: 24,
    trackWidth: 40,
  },
  lg: {
    inset: 3,
    knobOn: 23,
    knobSize: 22,
    touchTarget: 48,
    trackHeight: 28,
    trackWidth: 48,
  },
};

export function createSwitchStyles(
  theme: SharedUiTheme,
  size: ControlSize = "md",
) {
  const sizing = SWITCH_SIZES[size];
  return StyleSheet.create({
    knob: {
      backgroundColor: "#fff",
      borderRadius: sizing.knobSize / 2,
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
      height: sizing.knobSize,
      left: sizing.inset,
      position: "absolute",
      top: sizing.inset,
      width: sizing.knobSize,
    },
    knobOn: { left: sizing.knobOn },
    pressable: {
      alignItems: "center",
      height: sizing.touchTarget,
      justifyContent: "center",
      width: sizing.touchTarget,
    },
    track: {
      backgroundColor: theme.colors.border2,
      borderRadius: theme.radii.pill,
      height: sizing.trackHeight,
      position: "relative",
      width: sizing.trackWidth,
    },
    trackDisabled: { opacity: 0.5 },
    trackOn: { backgroundColor: theme.colors.primary },
  });
}

export type SwitchStyles = ReturnType<typeof createSwitchStyles>;
