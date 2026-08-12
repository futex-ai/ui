/**
 * Styles for the {@link KeyframeEditor}: the lane rows, the plotted area, and
 * the keyframe diamonds themselves.
 */
import { StyleSheet } from "react-native";

import { focusRingStyleFor } from "../focusRing";
import type { SharedUiTheme } from "../theme";

export function createKeyframeStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;

  return StyleSheet.create({
    root: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      overflow: "hidden",
    },
    lane: {
      borderColor: theme.colors.border,
      borderBottomWidth: 1,
      flexDirection: "row",
    },
    gutter: {
      backgroundColor: theme.colors.bg,
      borderColor: theme.colors.border,
      borderRightWidth: 1,
      justifyContent: "center",
      paddingHorizontal: 8,
    },
    laneLabel: { ...baseText, color: theme.colors.ink2, fontWeight: "600" },
    plot: { position: "relative" },
    playhead: { bottom: 0, position: "absolute", top: 0, width: 1 },
    // A rotated square: the diamond every animation tool uses for a keyframe,
    // so it reads as one rather than as a generic dot.
    keyframe: {
      borderRadius: 2,
      borderWidth: 1.5,
      height: 12,
      position: "absolute",
      transform: [{ rotate: "45deg" }],
      width: 12,
    },
    keyframeFocused: focusRingStyleFor({ color: theme.colors.primary }),
    empty: {
      ...baseText,
      color: theme.colors.placeholder,
      fontSize: 12,
      padding: 14,
      textAlign: "center",
    },
  });
}

export type KeyframeStyles = ReturnType<typeof createKeyframeStyles>;
