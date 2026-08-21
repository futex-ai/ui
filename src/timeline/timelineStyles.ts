/**
 * Theme-driven styles and density scale for the timeline.
 *
 * Geometry that depends on zoom or on a track's height is applied inline by the
 * components; this sheet owns the type scale, the surface colors, and the
 * selection and focus treatments. Every color comes from the active theme, so
 * the timeline reads correctly under all four presets.
 */
import { StyleSheet } from "react-native";

import type { ControlSize } from "../controlSize";
import { focusRingStyleFor } from "../focusRing";
import type { SharedUiTheme } from "../theme";

import type { TimelineClipTone, TimelineTrackKind } from "./timelineTypes";

/** Per-density metrics. `md` is the default. */
export type TimelineSizing = {
  /** Corner radius of a clip. */
  clipRadius: number;
  /** Padding inside a clip. */
  clipPadding: number;
  /** Font size of the clip label and header name. */
  fontSize: number;
  /** Width of the pinned track-header gutter. */
  headerWidth: number;
  /** Width of the grab area at each clip edge. */
  handleWidth: number;
  /** Height of the ruler strip above the lanes. */
  rulerHeight: number;
  /** Vertical gap between lanes. */
  trackGap: number;
  /** Default lane height when a track does not override it. */
  trackHeight: number;
  /** Icon size in the track header and clips. */
  iconSize: number;
};

export const timelineSizing: Record<ControlSize, TimelineSizing> = {
  sm: {
    clipPadding: 4,
    clipRadius: 5,
    fontSize: 10,
    handleWidth: 8,
    headerWidth: 132,
    iconSize: 12,
    rulerHeight: 22,
    trackGap: 2,
    trackHeight: 40,
  },
  md: {
    clipPadding: 6,
    clipRadius: 6,
    fontSize: 11,
    handleWidth: 10,
    headerWidth: 164,
    iconSize: 14,
    rulerHeight: 26,
    trackGap: 3,
    trackHeight: 58,
  },
  lg: {
    clipPadding: 8,
    clipRadius: 7,
    fontSize: 12,
    handleWidth: 12,
    headerWidth: 188,
    iconSize: 16,
    rulerHeight: 30,
    trackGap: 4,
    trackHeight: 74,
  },
};

/** The colors one clip paints with. */
export type TimelineClipColors = {
  /** Waveform bars, the kind icon, and the selected border. */
  accent: string;
  /** Resting border — uniform on all four edges, never an edge bar. */
  border: string;
  /** Clip body fill. */
  fill: string;
  /** Label and duration text, held to 4.5:1 on `fill`. */
  text: string;
};

/** The tone a clip inherits from its track when it does not set one. */
export function defaultToneForKind(kind: TimelineTrackKind): TimelineClipTone {
  switch (kind) {
    case "audio":
      return "amber";
    case "effect":
      return "rose";
    case "title":
      return "neutral";
    default:
      return "primary";
  }
}

/**
 * Resolves a tone to its four colors. Each pairing is one the theme already
 * documents as AA: the `*Deep` text sits on its own `*Soft` fill, and the
 * neutral tone uses `ink2` on `soft`.
 */
export function resolveClipColors(
  theme: SharedUiTheme,
  tone: TimelineClipTone,
): TimelineClipColors {
  switch (tone) {
    case "amber":
      return {
        accent: theme.colors.amber,
        border: theme.colors.amber,
        fill: theme.colors.amberSoft,
        text: theme.colors.amberDeep,
      };
    case "rose":
      return {
        accent: theme.colors.rose,
        border: theme.colors.rose,
        fill: theme.colors.roseSoft,
        text: theme.colors.roseDeep,
      };
    case "neutral":
      return {
        accent: theme.colors.muted,
        border: theme.colors.border2,
        fill: theme.colors.soft,
        text: theme.colors.ink2,
      };
    default:
      return {
        accent: theme.colors.primary,
        border: theme.colors.primaryBorder,
        fill: theme.colors.primarySoft,
        text: theme.colors.primaryDeep,
      };
  }
}

export function createTimelineStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  return StyleSheet.create({
    root: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      overflow: "hidden",
    },
    body: { flexDirection: "row" },
    // The pinned gutter. Its trailing hairline is a plain 1px divider, not a
    // tone bar — it separates the header column from the lanes.
    gutter: {
      backgroundColor: theme.colors.bg,
      borderColor: theme.colors.border,
      borderRightWidth: 1,
    },
    gutterSpacer: {
      backgroundColor: theme.colors.bg2,
      borderColor: theme.colors.border,
      borderBottomWidth: 1,
    },
    header: {
      borderColor: theme.colors.border,
      borderBottomWidth: 1,
      gap: 2,
      justifyContent: "center",
      paddingHorizontal: 8,
    },
    headerTopRow: { alignItems: "center", flexDirection: "row", gap: 6 },
    headerName: {
      ...baseText,
      color: theme.colors.ink,
      flexShrink: 1,
      fontWeight: "700",
    },
    headerToggles: { alignItems: "center", flexDirection: "row", gap: 2 },
    headerToggle: {
      alignItems: "center",
      borderRadius: theme.radii.sm,
      justifyContent: "center",
    },
    headerToggleOn: { backgroundColor: theme.colors.primarySoft },
    headerToggleFocused: focusRingStyleFor({ color: theme.colors.primary }),
    lanes: { position: "relative" },
    lane: {
      borderColor: theme.colors.border,
      borderBottomWidth: 1,
      position: "absolute",
      left: 0,
      right: 0,
    },
    laneOdd: { backgroundColor: theme.colors.bg },
    laneHidden: { opacity: 0.45 },
    ruler: {
      backgroundColor: theme.colors.bg2,
      borderColor: theme.colors.border,
      borderBottomWidth: 1,
      position: "relative",
    },
    rulerTickMajor: {
      backgroundColor: theme.colors.border2,
      bottom: 0,
      position: "absolute",
      width: 1,
    },
    rulerTickMinor: {
      backgroundColor: theme.colors.border,
      bottom: 0,
      position: "absolute",
      width: 1,
    },
    rulerLabel: {
      ...baseText,
      color: theme.colors.ink2,
      fontFamily: theme.fonts.mono,
      position: "absolute",
      top: 3,
    },
    rulerFocused: focusRingStyleFor({
      color: theme.colors.primary,
      offset: -2,
    }),
    marker: {
      borderRadius: 2,
      bottom: 0,
      position: "absolute",
      top: 0,
      width: 2,
    },
    clip: {
      borderRadius: 6,
      borderWidth: 1,
      overflow: "hidden",
      position: "absolute",
    },
    clipSelected: { borderWidth: 2 },
    clipFocused: focusRingStyleFor({ color: theme.colors.primary, offset: -2 }),
    clipHeader: { alignItems: "center", flexDirection: "row", gap: 4 },
    clipLabel: { ...baseText, flexShrink: 1, fontWeight: "700" },
    // Deliberately no `opacity` here. Fading the duration to a "secondary"
    // weight drops it below the 4.5:1 floor on every tinted clip fill (WCAG 2.1
    // — 1.4.3 Contrast Minimum, AA); the hierarchy comes from the smaller size
    // and lighter weight against the bold label instead.
    clipDuration: { ...baseText, fontFamily: theme.fonts.mono },
    clipContent: { flex: 1, justifyContent: "flex-end" },
    waveform: {
      alignItems: "flex-end",
      flexDirection: "row",
      gap: 1,
      overflow: "hidden",
    },
    waveformBar: { borderRadius: 1, opacity: 0.55 },
    filmstrip: { flexDirection: "row", overflow: "hidden" },
    filmstripFrame: { height: "100%" },
    trimHandle: {
      bottom: 0,
      position: "absolute",
      top: 0,
    },
    trimGrip: {
      alignSelf: "center",
      borderRadius: theme.radii.pill,
      height: 14,
      opacity: 0.9,
      width: 2,
    },
    playheadLine: {
      backgroundColor: theme.colors.rose,
      bottom: 0,
      position: "absolute",
      top: 0,
      width: 2,
    },
    playheadHead: {
      backgroundColor: theme.colors.rose,
      borderRadius: 3,
      height: 12,
      position: "absolute",
      top: 0,
      width: 12,
    },
    snapLine: {
      backgroundColor: theme.colors.primaryDeep,
      bottom: 0,
      position: "absolute",
      top: 0,
      width: 1,
    },
    marquee: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primary,
      borderRadius: theme.radii.sm,
      borderWidth: 1,
      opacity: 0.5,
      position: "absolute",
    },
    empty: {
      ...baseText,
      color: theme.colors.placeholder,
      fontSize: 12,
      padding: 16,
      textAlign: "center",
    },
  });
}

export type TimelineStyles = ReturnType<typeof createTimelineStyles>;
