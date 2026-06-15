/** Shared pressable button with tone, size, optional icon, and block variants. */
import { LucideIcon } from "lucide-react-native";
import { PropsWithChildren, useMemo } from "react";
import { Pressable, StyleProp, Text, ViewStyle } from "react-native";

import { ControlSize } from "../controlSize";
import {
  hideWebOutlineView,
  PressableHoverState,
  useFocusRing,
} from "../focusRing";
import { useSharedUiTheme } from "../theme";

import { buttonIconSize, createButtonStyles } from "./buttonStyles";

/**
 * Visual emphasis of the button:
 * - `primary` — filled with the theme primary, white label (the main action).
 * - `secondary` — surface fill with a neutral border (the default).
 * - `ghost` — no fill or border, primary-deep label (low-emphasis inline action).
 * - `danger` — neutral fill with a rose border and label (destructive action).
 */
export type ButtonTone = "danger" | "ghost" | "primary" | "secondary";

export type ButtonProps = PropsWithChildren<{
  /** Spoken hint announced after the label. */
  accessibilityHint?: string;
  /** Accessible name. Defaults to the visible text children. */
  accessibilityLabel?: string;
  /** Stretch to fill the container width (`align-self: stretch`). */
  block?: boolean;
  /** Disable the button; a button without `onPress` is also treated as disabled. */
  disabled?: boolean;
  /** Leading icon shown before the label, tinted to match the label colour. */
  icon?: LucideIcon;
  /** Press handler. Omit for a non-interactive (disabled) button. */
  onPress?: () => void;
  /** Control density: `sm`, `md` (default), or `lg`. */
  size?: ControlSize;
  /** Extra style for the pressable container. */
  style?: StyleProp<ViewStyle>;
  /** Visual emphasis. Defaults to `secondary`. */
  tone?: ButtonTone;
}>;

/**
 * The shared button. Honours the accounting mockup's
 * primary / secondary / ghost / danger tones, the `block` full-width variant,
 * an optional leading icon, and the shared {@link ControlSize} densities. Owns
 * the sage focus ring and hides the browser's default outline, and treats a
 * missing `onPress` as a disabled control (matching the library's other
 * pressables).
 */
export function Button({
  accessibilityHint,
  accessibilityLabel,
  block = false,
  children,
  disabled = false,
  icon: Icon,
  onPress,
  size = "md",
  style,
  tone = "secondary",
}: ButtonProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createButtonStyles(theme, size), [theme, size]);
  const focus = useFocusRing();
  const disabledState = disabled || !onPress;
  // The label (and any leading icon) colour is driven by the tone, so it is
  // applied inline rather than baked into the stylesheet.
  const labelColor =
    tone === "primary"
      ? "#fff"
      : tone === "danger"
        ? theme.colors.rose
        : tone === "ghost"
          ? theme.colors.primaryDeep
          : theme.colors.ink;

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabledState }}
      disabled={disabledState}
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      onPress={onPress}
      style={({ hovered }: PressableHoverState) => [
        styles.button,
        tone === "primary" ? styles.primary : null,
        tone === "ghost" ? styles.ghost : null,
        tone === "danger" ? styles.danger : null,
        block ? styles.block : null,
        // Hover layers over the tone fill but never while disabled. It sits
        // before the focus ring (a box-shadow on a different paint channel), so
        // a focused + hovered button shows the deeper fill inside its ring.
        hovered && !disabledState && tone === "primary"
          ? styles.primaryHover
          : null,
        hovered && !disabledState && tone === "secondary"
          ? styles.secondaryHover
          : null,
        hovered && !disabledState && tone === "ghost"
          ? styles.ghostHover
          : null,
        hovered && !disabledState && tone === "danger"
          ? styles.dangerHover
          : null,
        focus.focused ? styles.focusRing : null,
        disabledState ? styles.disabled : null,
        style,
        hideWebOutlineView,
      ]}
    >
      {Icon ? <Icon color={labelColor} size={buttonIconSize(size)} /> : null}
      <Text style={[styles.label, { color: labelColor }]}>{children}</Text>
    </Pressable>
  );
}
