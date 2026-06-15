import { useMemo, useState } from "react";
import { TextStyle, ViewStyle } from "react-native";

import { useSharedUiTheme } from "./theme";

export const hideWebOutline = { outlineStyle: "none" } as unknown as TextStyle;

export const hideWebOutlineView = {
  outlineStyle: "none",
} as unknown as ViewStyle;

/** Pressable style-callback state, widened with react-native-web's `hovered`. */
export type PressableHoverState = { pressed: boolean; hovered?: boolean };

export function useFocusRing() {
  const [focused, setFocused] = useState(false);
  const theme = useSharedUiTheme();
  const focusRingStyle = useMemo<ViewStyle>(
    () => ({ borderColor: theme.colors.primary }),
    [theme.colors.primary],
  );
  return {
    focusRingStyle,
    focused,
    onBlur: () => setFocused(false),
    onFocus: () => setFocused(true),
  };
}
