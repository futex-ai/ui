import { StyleSheet } from "react-native";

import type { ControlSize } from "../controlSize";
import type { SharedUiTheme } from "../theme";

/**
 * Per-size geometry for the segmented control: the outline cell and pill-track
 * horizontal padding, the shared vertical padding, the cell / pill label type
 * scale, and the gaps that separate the segments. `md` matches the original
 * accounting control; `sm` is the compact density and `lg` the roomier one.
 */
const SEGMENTED_SIZES: Record<
  ControlSize,
  {
    cellFontSize: number;
    cellPaddingHorizontal: number;
    iconGap: number;
    iconSize: number;
    paddingVertical: number;
    pillFontSize: number;
    pillLineHeight: number;
    pillPaddingHorizontal: number;
    rowGap: number;
    trackGap: number;
    trackPadding: number;
  }
> = {
  sm: {
    cellFontSize: 11,
    cellPaddingHorizontal: 8,
    iconGap: 5,
    iconSize: 14,
    paddingVertical: 5,
    pillFontSize: 12,
    pillLineHeight: 18,
    pillPaddingHorizontal: 12,
    rowGap: 6,
    trackGap: 4,
    trackPadding: 3,
  },
  md: {
    cellFontSize: 12,
    cellPaddingHorizontal: 10,
    iconGap: 6,
    iconSize: 15,
    paddingVertical: 7,
    pillFontSize: 13,
    pillLineHeight: 19.5,
    pillPaddingHorizontal: 14,
    rowGap: 8,
    trackGap: 4,
    trackPadding: 4,
  },
  lg: {
    cellFontSize: 14,
    cellPaddingHorizontal: 14,
    iconGap: 8,
    iconSize: 17,
    paddingVertical: 10,
    pillFontSize: 15,
    pillLineHeight: 22,
    pillPaddingHorizontal: 18,
    rowGap: 10,
    trackGap: 6,
    trackPadding: 5,
  },
};

/** Diameter of a segment's leading lucide icon for a given size, in px. */
export function segmentIconSize(size: ControlSize = "md") {
  return SEGMENTED_SIZES[size].iconSize;
}

export function createSegmentedControlStyles(
  theme: SharedUiTheme,
  size: ControlSize = "md",
) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  const sizing = SEGMENTED_SIZES[size];
  return StyleSheet.create({
    cell: {
      alignItems: "center",
      borderColor: theme.colors.controlBorder,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      // A row so an optional leading icon sits beside the label (the `iconGap`
      // is inert on a label-only segment, which has a single child).
      flexDirection: "row",
      gap: sizing.iconGap,
      justifyContent: "center",
      minWidth: 0,
      paddingHorizontal: sizing.cellPaddingHorizontal,
      paddingVertical: sizing.paddingVertical,
    },
    cellSelected: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primary,
    },
    cellText: {
      ...baseText,
      color: theme.colors.ink2,
      fontSize: sizing.cellFontSize,
      fontWeight: "700",
      minWidth: 0,
    },
    cellTextSelected: { color: theme.colors.primaryDeep },
    contentSegment: {
      flexGrow: 0,
      flexShrink: 0,
    },
    disabled: { opacity: 0.6 },
    equalSegment: {
      flex: 1,
    },
    error: {
      ...baseText,
      color: theme.colors.rose,
      fontSize: 11,
      fontWeight: "700",
      lineHeight: 16.5,
    },
    field: { gap: 6 },
    hint: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 12,
      lineHeight: 18,
    },
    label: {
      ...baseText,
      color: theme.colors.ink2,
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 18,
    },
    // The label + optional ⓘ info button share one baseline-centred row.
    labelRow: { alignItems: "center", flexDirection: "row", gap: 4 },
    pill: {
      alignItems: "center",
      borderColor: "transparent",
      borderRadius: theme.radii.md,
      borderWidth: 1,
      // A row so an optional leading icon sits beside the label (the `iconGap`
      // is inert on a label-only segment, which has a single child).
      flexDirection: "row",
      gap: sizing.iconGap,
      justifyContent: "center",
      minWidth: 0,
      paddingHorizontal: sizing.pillPaddingHorizontal,
      paddingVertical: sizing.paddingVertical,
      // Sit above the sliding thumb (zIndex 0) so the label and focus ring stay
      // on top while the raised surface glides behind it.
      position: "relative",
      zIndex: 1,
    },
    pillActive: {
      backgroundColor: theme.colors.surface,
      // A `controlBorder` edge so the selected pill is perceivable against the
      // track, not conveyed by the ~1.13:1 surface/soft fill alone (WCAG 1.4.1).
      borderColor: theme.colors.controlBorder,
      boxShadow: "0 1px 2px rgba(20, 28, 22, 0.06)",
    },
    // The sliding selection thumb: an absolutely-positioned surface that carries
    // the `pillActive` look and is translated to the selected pill's measured
    // box, so switching tabs glides the raised surface instead of snapping it.
    pillThumb: {
      borderRadius: theme.radii.md,
      borderWidth: 1,
      position: "absolute",
      zIndex: 0,
    },
    pillText: {
      ...baseText,
      color: theme.colors.ink2,
      fontSize: sizing.pillFontSize,
      fontWeight: "700",
      lineHeight: sizing.pillLineHeight,
      minWidth: 0,
    },
    pillTextActive: { color: theme.colors.ink },
    required: { color: theme.colors.rose },
    // Centred wrapper for a segment's leading icon (a lucide glyph or a
    // caller-supplied node), hidden from assistive tech on web.
    segmentIcon: { alignItems: "center", justifyContent: "center" },
    row: { flexDirection: "row", gap: sizing.rowGap },
    rowWrap: { flexWrap: "wrap" },
    track: {
      alignSelf: "flex-start",
      backgroundColor: theme.colors.soft,
      borderRadius: theme.radii.lg,
      flexDirection: "row",
      gap: sizing.trackGap,
      padding: sizing.trackPadding,
      // The containing block for the absolutely-positioned sliding thumb.
      position: "relative",
    },
  });
}

export type SegmentedControlStyles = ReturnType<
  typeof createSegmentedControlStyles
>;
