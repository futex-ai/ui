/** Shared on/off toggle switch. */
import { useMemo } from "react";
import { Platform, Pressable, StyleProp, View, ViewStyle } from "react-native";

import { useSharedUiTheme } from "../theme";

import { createSwitchStyles } from "./switchStyles";

export type SwitchProps = {
  accessibilityLabel?: string;
  disabled?: boolean;
  onValueChange?: (value: boolean) => void;
  trackStyle?: StyleProp<ViewStyle>;
  value: boolean;
};

const knobTransition =
  Platform.OS === "web"
    ? ({ transition: "left 0.15s ease" } as unknown as ViewStyle)
    : null;

export function Switch({
  accessibilityLabel,
  disabled = false,
  onValueChange,
  trackStyle,
  value,
}: SwitchProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createSwitchStyles(theme), [theme]);
  const disabledState = disabled || !onValueChange;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: disabledState }}
      aria-checked={value}
      disabled={disabledState}
      hitSlop={10}
      onPress={() => onValueChange?.(!value)}
    >
      <View
        style={[
          styles.track,
          value ? styles.trackOn : null,
          disabledState ? styles.trackDisabled : null,
          trackStyle,
        ]}
      >
        <View
          style={[styles.knob, value ? styles.knobOn : null, knobTransition]}
        />
      </View>
    </Pressable>
  );
}
