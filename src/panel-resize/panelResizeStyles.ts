/** Theme styles of the panel resize handle on web and native. */
import { StyleSheet } from "../primitives/reactNative";

import type { SharedUiTheme } from "../theme";

/** Width of the handle's hit area, centred on the panel edge, in px. */
const HANDLE_WIDTH = 9;

export function createPanelResizeStyles(theme: SharedUiTheme) {
  return StyleSheet.create({
    // A 9px target over the hairline between two columns. It reaches 5px past
    // the panel edge, so the line sits on the edge.
    handle: {
      alignItems: "center",
      bottom: 0,
      justifyContent: "center",
      position: "absolute",
      top: 0,
      width: HANDLE_WIDTH,
      zIndex: 1,
    },
    handleEnd: { right: -5 },
    handleStart: { left: -5 },
    // At rest the panel's own border is the hairline, so this line stays clear.
    line: {
      backgroundColor: "transparent",
      bottom: 0,
      left: 4,
      position: "absolute",
      top: 0,
      width: 1,
    },
    lineShown: { backgroundColor: theme.colors.border2 },
    // A short grip, never a full-height primary line along the panel.
    grip: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radii.pill,
      height: 36,
      opacity: 0,
      width: 5,
    },
    gripShown: { opacity: 1 },
  });
}
