/** Shared on/off toggle switch. */
import { useMemo } from "react";
import { Platform, Pressable, StyleProp, View, ViewStyle } from "react-native";

import type { ControlSize } from "../controlSize";
import { devWarn } from "../devWarn";
import { useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";
import { useReducedMotion } from "../useReducedMotion";

import { createSwitchStyles } from "./switchStyles";

type SwitchKeyboardEvent = {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

export type SwitchProps = {
  /**
   * Accessible name for the switch. Required unless `aria-labelledby` points at
   * a visible label (the row-label pattern), so the control is never announced
   * anonymously (WCAG 2.1 — 4.1.2 Name, Role, Value, A).
   */
  accessibilityLabel?: string;
  /**
   * `nativeID` of a visible label element that names this switch. Prefer this
   * over `accessibilityLabel` when a visible row label exists, so the accessible
   * name matches the visible text (WCAG 2.1 — 2.5.3 Label in Name, A).
   */
  "aria-labelledby"?: string;
  disabled?: boolean;
  /**
   * Disable the shared focus glow on this control. It then falls back to the
   * browser's default focus outline so keyboard focus stays visible (WCAG 2.1 —
   * 2.4.7 Focus Visible, AA). Disable every ring at once via the theme's
   * `focusRing: false` flag instead.
   */
  disableFocusRing?: boolean;
  onValueChange?: (value: boolean) => void;
  /** Control density: `sm`, `md` (default), or `lg`. */
  size?: ControlSize;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  trackStyle?: StyleProp<ViewStyle>;
  value: boolean;
};

export function Switch({
  accessibilityLabel,
  "aria-labelledby": ariaLabelledBy,
  disabled = false,
  disableFocusRing = false,
  onValueChange,
  size = "md",
  testID,
  trackStyle,
  value,
}: SwitchProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createSwitchStyles(theme, size), [theme, size]);
  const reducedMotion = useReducedMotion();
  // Draw the focus ring just outside the track so its contrast is measured
  // against the page surface, not the track fill. The Pressable padding leaves
  // clearance and sets no `overflow: hidden`, so the outset ring is not clipped
  // and stays ≥3:1 in both the off (light) and on (primary) states (2.4.7 AA).
  const focus = useFocusRing({ disabled: disableFocusRing });
  const disabledState = disabled || !onValueChange;
  const toggle = () => onValueChange?.(!value);
  const handleKeyDown = (event: SwitchKeyboardEvent) => {
    const key = event.nativeEvent?.key ?? event.key;
    if (
      disabledState ||
      (key !== " " && key !== "Spacebar" && key !== "Enter")
    ) {
      return;
    }
    event.preventDefault?.();
    event.stopPropagation?.();
    toggle();
  };
  const keyProps = Platform.OS === "web" ? { onKeyDown: handleKeyDown } : {};

  if (!accessibilityLabel && !ariaLabelledBy) {
    devWarn(
      "Switch: provide `accessibilityLabel` or `aria-labelledby` so the switch has an accessible name (WCAG 4.1.2).",
    );
  }

  const knobTransition =
    Platform.OS === "web" && !reducedMotion
      ? ({ transition: "left 0.15s ease" } as unknown as ViewStyle)
      : null;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: disabledState }}
      aria-checked={value}
      aria-labelledby={ariaLabelledBy}
      disabled={disabledState}
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      onPress={toggle}
      style={styles.pressable}
      testID={testID}
      {...keyProps}
    >
      <View
        style={[
          styles.track,
          value ? styles.trackOn : null,
          disabledState ? styles.trackDisabled : null,
          trackStyle,
          // `webOutlineReset` suppresses the default UA outline while the glow is
          // the focus affordance; the focus ring is layered last so it survives
          // and stays visible (WCAG 2.1 — 2.4.7 Focus Visible, AA). With the ring
          // disabled the reset is skipped so the UA outline returns instead.
          focus.webOutlineReset,
          focus.focused ? focus.focusRingStyle : null,
        ]}
      >
        <View
          style={[styles.knob, value ? styles.knobOn : null, knobTransition]}
        />
      </View>
    </Pressable>
  );
}
