/**
 * The icon button of the modal header. The frame draws its Close button with
 * it, and callers put it in the frame's `headerActions` slot, so every header
 * control has one size, one icon tint, and one focus ring. Inside a
 * `TouchSurface` it is a 44 by 44px target.
 */
import { useContext, useMemo } from "react";
import type { Ref } from "react";
import { Platform, Pressable, StyleSheet } from "../primitives/reactNative";
import type { View } from "../primitives/reactNative";
import type { IconComponent } from "../primitives/icons";
import { useForwardedHostRef } from "../primitives/refs/useForwardedHostRef";

import { buttonSemantics } from "../button/buttonSemantics";
import { useFocusRing } from "../focusRing";
import type { FocusIndicator } from "../focusRing";
import { useSharedUiTheme } from "../theme";
import type { SharedUiTheme } from "../theme";
import { TOUCH_TARGET_SIZE, useTouchSurface } from "../touchSurface";

import {
  WebModalHeaderGroupContext,
  webModalHeaderButtonHitSlop,
} from "./webModalHeaderGroup";

export type WebModalHeaderButtonProps = {
  /** Accessible name. The button shows only an icon, so the name is required. */
  accessibilityLabel: string;
  /** The host element, for a caller that moves focus to the button. */
  buttonRef?: Ref<View>;
  disabled?: boolean;
  /**
   * How the button shows keyboard focus: the shared `ring`, the browser's
   * `outline`, or `none`. In a frame's `headerActions` it defaults to the
   * frame's `focusIndicator`, and elsewhere to the theme's.
   */
  focusIndicator?: FocusIndicator;
  /** A Lucide icon, or any icon that takes `color` and `size`. */
  icon: IconComponent;
  onPress: () => void;
  /**
   * The on state of a toggle button. Web announces it as `aria-pressed`, and
   * native as `selected`. Leave it unset for a plain action button. The button
   * does not paint the state, so change the icon with it. Keep the label the
   * same, because a toggle that also changes its name announces both.
   */
  pressed?: boolean;
  /** Test identifier forwarded to the button (`data-testid` on web). */
  testID?: string;
};

export function WebModalHeaderButton({
  accessibilityLabel,
  buttonRef,
  disabled = false,
  focusIndicator,
  icon: Icon,
  onPress,
  pressed,
  testID,
}: WebModalHeaderButtonProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(
    () => createWebModalHeaderButtonStyles(theme),
    [theme],
  );
  const touch = useTouchSurface();
  const setButtonRef = useForwardedHostRef(buttonRef);
  const group = useContext(WebModalHeaderGroupContext);
  const ring = useFocusRing({
    indicator: focusIndicator ?? group.focusIndicator,
  });
  const semantics = buttonSemantics({
    busy: false,
    disabled,
    pressed,
    role: "button",
    web: Platform.OS === "web",
  });
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={semantics.accessibilityRole}
      accessibilityState={semantics.accessibilityState}
      {...semantics.ariaProps}
      disabled={disabled}
      // Native only: the web backend ignores `hitSlop`. Inside a
      // `TouchSurface` the button is already a full touch target.
      hitSlop={touch ? undefined : webModalHeaderButtonHitSlop(group.position)}
      {...ring.focusRingProps}
      onBlur={ring.onBlur}
      onFocus={ring.onFocus}
      onPress={onPress}
      ref={setButtonRef}
      style={[
        styles.button,
        touch ? styles.buttonTouch : null,
        disabled ? styles.disabled : null,
        ring.focusRingVariables,
      ]}
      testID={testID}
    >
      <Icon aria-hidden color={theme.colors.ink2} size={18} />
    </Pressable>
  );
}

function createWebModalHeaderButtonStyles(theme: SharedUiTheme) {
  return StyleSheet.create({
    button: {
      alignItems: "center",
      borderRadius: theme.radii.md,
      height: 34,
      justifyContent: "center",
      width: 34,
    },
    buttonTouch: { height: TOUCH_TARGET_SIZE, width: TOUCH_TARGET_SIZE },
    disabled: { opacity: 0.55 },
  });
}
