/**
 * The video-editor family's density scale, and the one dimension helper its
 * components need.
 *
 * Deliberately free of any runtime `react-native` import — only the erased
 * `DimensionValue` type — so `node --test` can exercise the numbers directly.
 * Importing `StyleSheet` here would drag React Native's entry point into the
 * test runner, which cannot parse it.
 */
import type { DimensionValue } from "react-native";

import type { ControlSize } from "../controlSize";

/**
 * A `0..1` fraction as a percentage dimension. A template literal widens to
 * `string`, which React Native's `DimensionValue` union rejects, so the cast is
 * made once here rather than at every call site.
 */
export function percent(fraction: number): DimensionValue {
  return `${fraction * 100}%` as DimensionValue;
}

/** Per-density metrics for the transport, meters, bin, and inspector. */
export type VideoEditorSizing = {
  /** Height of a transport button. */
  buttonSize: number;
  /** Icon size inside a transport button. */
  iconSize: number;
  /** Body font size. */
  fontSize: number;
  /** Height of the scrubber's track. */
  trackHeight: number;
  /** Diameter of the scrubber's knob. */
  knobSize: number;
  /** Gap between controls in a row. */
  gap: number;
  /** Padding inside a panel. */
  padding: number;
  /** Height of one level-meter channel. */
  meterThickness: number;
  /** Height of a property row in the inspector. */
  rowHeight: number;
};

export const videoEditorSizing: Record<ControlSize, VideoEditorSizing> = {
  sm: {
    buttonSize: 26,
    fontSize: 11,
    gap: 6,
    iconSize: 14,
    knobSize: 12,
    meterThickness: 5,
    padding: 8,
    rowHeight: 26,
    trackHeight: 5,
  },
  md: {
    buttonSize: 32,
    fontSize: 12,
    gap: 8,
    iconSize: 16,
    knobSize: 14,
    meterThickness: 6,
    padding: 12,
    rowHeight: 30,
    trackHeight: 6,
  },
  lg: {
    buttonSize: 38,
    fontSize: 13,
    gap: 10,
    iconSize: 18,
    knobSize: 16,
    meterThickness: 8,
    padding: 14,
    rowHeight: 34,
    trackHeight: 8,
  },
};
