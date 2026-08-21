/**
 * Theme-driven styles for the video-editor panels, so they agree on their type
 * scale, surfaces, and focus treatments. Every colour resolves from the active
 * theme, so all four presets render correctly.
 *
 * The density numbers live next door in `videoEditorSizing`, which stays free
 * of a runtime `react-native` import so they can be unit tested.
 */
import { StyleSheet } from "react-native";

import { focusRingStyleFor } from "../focusRing";
import type { SharedUiTheme } from "../theme";

export function createVideoEditorStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  const panel = {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
  } as const;

  return StyleSheet.create({
    panel,
    panelTitle: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    row: { alignItems: "center", flexDirection: "row" },
    grow: { flex: 1 },
    text: { ...baseText, color: theme.colors.ink },
    mutedText: { ...baseText, color: theme.colors.ink2 },
    mono: {
      ...baseText,
      color: theme.colors.ink,
      fontFamily: theme.fonts.mono,
    },

    // --- preview ---------------------------------------------------------
    // The letterbox is intentionally a fixed near-black rather than a theme
    // surface: it stands in for the void around a frame, which does not change
    // with the UI's light or dark scheme any more than a cinema screen does.
    letterbox: {
      alignItems: "center",
      backgroundColor: "#0e100f",
      borderRadius: theme.radii.md,
      justifyContent: "center",
      overflow: "hidden",
    },
    frame: { overflow: "hidden", position: "relative", width: "100%" },
    frameFill: { height: "100%", position: "absolute", width: "100%" },
    guideLine: {
      backgroundColor: "rgba(255, 255, 255, 0.28)",
      position: "absolute",
    },
    safeArea: {
      borderColor: "rgba(255, 255, 255, 0.34)",
      borderStyle: "dashed",
      borderWidth: 1,
      position: "absolute",
    },
    previewBadge: {
      backgroundColor: "rgba(14, 16, 15, 0.72)",
      borderRadius: theme.radii.sm,
      paddingHorizontal: 6,
      paddingVertical: 2,
      position: "absolute",
    },
    previewBadgeText: {
      ...baseText,
      color: "#ffffff",
      fontFamily: theme.fonts.mono,
      fontSize: 11,
    },
    previewPlaceholder: {
      alignItems: "center",
      height: "100%",
      justifyContent: "center",
      width: "100%",
    },
    previewPlaceholderText: {
      ...baseText,
      color: "rgba(255, 255, 255, 0.62)",
      fontSize: 12,
    },

    // --- transport -------------------------------------------------------
    transport: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
    },
    button: {
      alignItems: "center",
      borderRadius: theme.radii.md,
      justifyContent: "center",
    },
    buttonHovered: { backgroundColor: theme.colors.soft },
    buttonActive: { backgroundColor: theme.colors.primarySoft },
    buttonPrimary: { backgroundColor: theme.colors.primaryDeep },
    buttonFocused: focusRingStyleFor({ color: theme.colors.primary }),
    buttonDisabled: { opacity: 0.4 },
    rateTrigger: {
      alignItems: "center",
      borderColor: theme.colors.controlBorder,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      flexDirection: "row",
      gap: 4,
      paddingHorizontal: 8,
    },

    // --- scrubber --------------------------------------------------------
    scrubber: { justifyContent: "center", position: "relative" },
    scrubberTrack: {
      backgroundColor: theme.colors.bg2,
      borderRadius: theme.radii.pill,
      overflow: "hidden",
      width: "100%",
    },
    scrubberBuffered: {
      backgroundColor: theme.colors.border2,
      height: "100%",
      position: "absolute",
    },
    scrubberPlayed: {
      backgroundColor: theme.colors.primary,
      height: "100%",
      position: "absolute",
    },
    scrubberRange: {
      backgroundColor: theme.colors.primaryBorder,
      height: "100%",
      position: "absolute",
    },
    scrubberMarker: {
      borderRadius: 1,
      position: "absolute",
      width: 2,
    },
    scrubberKnob: {
      backgroundColor: theme.colors.primaryDeep,
      position: "absolute",
    },
    scrubberFocused: focusRingStyleFor({ color: theme.colors.primary }),

    // --- level meter -----------------------------------------------------
    meterChannel: {
      backgroundColor: theme.colors.bg2,
      borderRadius: 3,
      overflow: "hidden",
    },
    meterFill: { height: "100%", position: "absolute" },
    meterHold: { position: "absolute", width: 2 },
    meterLabel: { ...baseText, color: theme.colors.ink2, fontSize: 10 },
    // `placeholder`, not `faint`: the scale numbers are meaningful text and
    // `faint` is deliberately below the 4.5:1 floor for decorative use only
    // (WCAG 2.1 — 1.4.3 Contrast Minimum, AA).
    meterScaleText: {
      ...baseText,
      color: theme.colors.placeholder,
      fontSize: 10,
    },
  });
}

export type VideoEditorStyles = ReturnType<typeof createVideoEditorStyles>;
