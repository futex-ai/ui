/** Shared on/off toggle switch. */
import { useMemo } from "react";
import { Platform, Pressable, StyleProp, View, ViewStyle } from "react-native";

import type { ControlSize } from "../controlSize";
import { useSharedUiTheme } from "../theme";

import { createSwitchStyles } from "./switchStyles";

type SwitchKeyboardEvent = {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

export type SwitchProps = {
  accessibilityLabel?: string;
  disabled?: boolean;
  onValueChange?: (value: boolean) => void;
  /** Control density: `sm`, `md` (default), or `lg`. */
  size?: ControlSize;
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
  size = "md",
  trackStyle,
  value,
}: SwitchProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createSwitchStyles(theme, size), [theme, size]);
  const disabledState = disabled || !onValueChange;
  const toggle = () => onValueChange?.(!value);
  const handleKeyDown = (event: SwitchKeyboardEvent) => {
    const key = event.nativeEvent?.key ?? event.key;
    if (disabledState || (key !== " " && key !== "Spacebar")) {
      return;
    }
    event.preventDefault?.();
    event.stopPropagation?.();
    toggle();
  };
  const keyProps = Platform.OS === "web" ? { onKeyDown: handleKeyDown } : {};

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: disabledState }}
      aria-checked={value}
      disabled={disabledState}
      onPress={toggle}
      style={styles.pressable}
      {...keyProps}
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
