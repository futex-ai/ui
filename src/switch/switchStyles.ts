import { StyleSheet } from "react-native";

import type { SharedUiTheme } from "../theme";

export function createSwitchStyles(theme: SharedUiTheme) {
  return StyleSheet.create({
    knob: {
      backgroundColor: "#fff",
      borderRadius: 9,
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
      height: 18,
      left: 3,
      position: "absolute",
      top: 3,
      width: 18,
    },
    knobOn: { left: 19 },
    pressable: {
      alignItems: "center",
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    track: {
      backgroundColor: theme.colors.border2,
      borderRadius: theme.radii.pill,
      height: 24,
      position: "relative",
      width: 40,
    },
    trackDisabled: { opacity: 0.5 },
    trackOn: { backgroundColor: theme.colors.primary },
  });
}

export type SwitchStyles = ReturnType<typeof createSwitchStyles>;
