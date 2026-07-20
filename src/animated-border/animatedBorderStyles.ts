import { StyleSheet } from "react-native";

export const animatedBorderStyles = StyleSheet.create({
  // Wraps the bordered content so the absolutely-positioned border can be
  // pinned over it without affecting the content's own layout.
  frame: {
    position: "relative",
  },
  // The border overlay, pinned to the top-left of the frame and sized to match
  // the bordered box.
  overlay: {
    left: 0,
    position: "absolute",
    top: 0,
  },
});

export type AnimatedBorderStyles = typeof animatedBorderStyles;
