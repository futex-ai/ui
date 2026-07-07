/** Titled radio-option cards for larger one-of-N choices. */
import { useMemo } from "react";
import {
  Platform,
  Pressable,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { hideWebOutlineView, useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";

import { createRadioCardStyles } from "./radioCardStyles";

type RadioCardKeyboardEvent = {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

export type RadioCardProps = {
  accessibilityHint?: string;
  /**
   * Overridable accessible name. Defaults to `title` (not the title+body
   * concatenation), so `getByRole("radio", { name: title })` resolves exactly.
   * Set it to disambiguate duplicate titles or pin a locale-stable name.
   */
  accessibilityLabel?: string;
  body?: string;
  checked?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  title: string;
};

export function RadioCard({
  accessibilityHint,
  accessibilityLabel,
  body,
  checked = false,
  disabled = false,
  onPress,
  style,
  title,
}: RadioCardProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createRadioCardStyles(theme), [theme]);
  const focus = useFocusRing();
  const disabledState = disabled || !onPress;
  const handleKeyDown = (event: RadioCardKeyboardEvent) => {
    const key = event.nativeEvent?.key ?? event.key;
    if (disabledState || (key !== " " && key !== "Spacebar")) {
      return;
    }
    event.preventDefault?.();
    event.stopPropagation?.();
    onPress?.();
  };
  const keyProps = Platform.OS === "web" ? { onKeyDown: handleKeyDown } : {};

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="radio"
      accessibilityState={{ checked, disabled: disabledState }}
      aria-checked={checked}
      disabled={disabledState}
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      onPress={onPress}
      {...keyProps}
      style={[
        styles.radio,
        checked ? styles.radioChecked : null,
        focus.focused ? focus.focusRingStyle : null,
        disabledState ? styles.radioDisabled : null,
        style,
        hideWebOutlineView,
      ]}
    >
      <View style={styles.radioDotCol}>
        <View
          style={[styles.radioDot, checked ? styles.radioDotChecked : null]}
        />
      </View>
      <View style={styles.radioText}>
        <Text style={styles.radioTitle}>{title}</Text>
        {body ? <Text style={styles.radioBody}>{body}</Text> : null}
      </View>
    </Pressable>
  );
}
