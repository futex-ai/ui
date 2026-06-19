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

/** Hairline border width applied to the track and knob edges. */
const BORDER = 1;

export function createSwitchStyles(
  theme: SharedUiTheme,
  size: ControlSize = "md",
) {
  const sizing = SWITCH_SIZES[size];
  // The track and knob use border-box sizing, so a 1px border eats into the
  // content box. Pull the knob in by the border so it stays centered in the
  // track and the on-position offset still lands flush against the far edge.
  const knobInset = sizing.inset - BORDER;
  const knobOn = sizing.knobOn - BORDER;
  return StyleSheet.create({
    knob: {
      // The knob carries a subtle border so its edge keeps a ≥3:1 boundary
      // against the white surface and the off-track fill (WCAG 2.1 — 1.4.11
      // Non-text Contrast, AA; reinforces the 1.4.1 position cue).
      backgroundColor: "#fff",
      borderColor: theme.colors.controlBorder,
      borderRadius: sizing.knobSize / 2,
      borderWidth: BORDER,
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
      height: sizing.knobSize,
      left: knobInset,
      position: "absolute",
      top: knobInset,
      width: sizing.knobSize,
    },
    knobOn: { left: knobOn },
    pressable: {
      alignItems: "center",
      height: sizing.touchTarget,
      justifyContent: "center",
      width: sizing.touchTarget,
    },
    track: {
      // Off-track keeps a ≥3:1 boundary so the control's resting edge is
      // perceivable on the surface (WCAG 2.1 — 1.4.11 Non-text Contrast, AA).
      backgroundColor: theme.colors.border2,
      borderColor: theme.colors.controlBorder,
      borderRadius: theme.radii.pill,
      borderWidth: BORDER,
      height: sizing.trackHeight,
      position: "relative",
      width: sizing.trackWidth,
    },
    trackDisabled: { opacity: 0.5 },
    trackOn: {
      backgroundColor: theme.colors.primary,
      // On-track: match the border to the fill so the boundary stays clean
      // against the saturated primary (the position + color cues carry state).
      borderColor: theme.colors.primary,
    },
  });
}

export type SwitchStyles = ReturnType<typeof createSwitchStyles>;
