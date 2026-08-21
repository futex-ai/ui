/**
 * One icon button in the transport.
 *
 * Extracted so the bar's own file stays about layout: every button shares the
 * hover, focus, and active treatments, and each carries the accessible name of
 * the action it performs — "Pause" rather than a pause glyph — so the control
 * is legible without sight (WCAG 2.1 — 4.1.2 Name, Role, Value, A).
 */
import type { ComponentType } from "react";
import { useMemo } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";

import type { ControlSize } from "../controlSize";
import { useFocusRing, type PressableHoverState } from "../focusRing";
import { useSharedUiTheme } from "../theme";

import { videoEditorSizing } from "./videoEditorSizing";
import { createVideoEditorStyles } from "./videoEditorStyles";

type IconProps = { color?: string; size?: number };

export type TransportButtonProps = {
  Icon: ComponentType<IconProps>;
  /** The accessible name — what pressing it does, not what it looks like. */
  label: string;
  onPress: () => void;
  /** Tint the button to show a latched state, e.g. looping is on. */
  active?: boolean;
  /** The one filled button in the cluster: play/pause. */
  primary?: boolean;
  disabled?: boolean;
  /** Density. Defaults to `md`. */
  size?: ControlSize;
  disableFocusRing?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

export function TransportButton({
  Icon,
  active = false,
  disableFocusRing = false,
  disabled = false,
  label,
  onPress,
  primary = false,
  size = "md",
  style,
  testID,
}: TransportButtonProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createVideoEditorStyles(theme), [theme]);
  const metrics = videoEditorSizing[size];
  const focus = useFocusRing({ disabled: disableFocusRing });

  const iconColor = primary
    ? theme.colors.onSolid
    : active
      ? theme.colors.primaryDeep
      : theme.colors.ink2;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      onPress={onPress}
      style={({ hovered }: PressableHoverState) => [
        styles.button,
        { height: metrics.buttonSize, width: metrics.buttonSize },
        primary ? styles.buttonPrimary : null,
        active && !primary ? styles.buttonActive : null,
        hovered && !primary && !active ? styles.buttonHovered : null,
        disabled ? styles.buttonDisabled : null,
        focus.webOutlineReset,
        focus.focusVisible && focus.ringEnabled ? styles.buttonFocused : null,
        style,
      ]}
      testID={testID}
    >
      <Icon color={iconColor} size={metrics.iconSize} />
    </Pressable>
  );
}
