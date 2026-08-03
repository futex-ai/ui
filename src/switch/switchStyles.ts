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

/**
 * Fraction of the `controlBorder` alpha the off-track edge keeps.
 *
 * The token is tuned to read as a light line where it sits on the white
 * `surface` — which is where every other control puts it, and where the knob
 * puts it too (border-box paints the knob's own white fill behind its edge).
 * The track paints its edge over the grey `border2` fill instead, so the same
 * tint composites about twice as dark and lands as a hard outline around the
 * control. Halving the alpha brings the track edge back to the knob's weight,
 * so the two rings read as one family rather than a dark ring around a light
 * one.
 */
const TRACK_EDGE_ALPHA_SCALE = 0.5;

/**
 * Returns a translucent `rgba()`/`rgb()` color with its alpha scaled by
 * `scale`. Any other notation — a hex, a named color, a consumer override in
 * `color-mix()` — is returned verbatim, so a themed `controlBorder` that isn't
 * translucent still draws the track edge at face value.
 */
function scaleAlpha(color: string, scale: number): string {
  const match = /^rgba?\(([^)]+)\)$/i.exec(color.trim());
  if (!match) return color;
  const parts = match[1].split(",").map((part) => part.trim());
  if (parts.length < 3 || parts.length > 4) return color;
  const alpha = parts.length === 4 ? Number(parts[3]) : 1;
  if (!Number.isFinite(alpha)) return color;
  return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha * scale})`;
}

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
      // Resting on the off-track, the knob carries a subtle `controlBorder`
      // edge against the grey fill (a soft translucent-ink line that reinforces
      // the 1.4.1 position cue). `knobOn` drops it for the on-position.
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
    // On the saturated `primary` track the white knob already stands out on its
    // own (≈5:1 in both shipped themes), so the edge is dropped — matched to the
    // knob's fill the way `trackOn` matches its own, which keeps the geometry
    // identical and leaves no grey ring muddying the boundary. It stays on the
    // off-track, where white-on-`border2` is the low-contrast pairing that needs
    // it (WCAG 1.4.11 Non-text Contrast).
    knobOn: { borderColor: "#fff", left: knobOn },
    pressable: {
      alignItems: "center",
      height: sizing.touchTarget,
      justifyContent: "center",
      width: sizing.touchTarget,
    },
    track: {
      // Off-track carries a `controlBorder` edge so the control's resting shape
      // stays perceivable on the surface, at half alpha because the tint
      // composites twice as firm over this grey fill as it does over white
      // (see {@link TRACK_EDGE_ALPHA_SCALE}).
      backgroundColor: theme.colors.border2,
      borderColor: scaleAlpha(
        theme.colors.controlBorder,
        TRACK_EDGE_ALPHA_SCALE,
      ),
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
