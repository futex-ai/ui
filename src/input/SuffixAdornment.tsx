/** The trailing suffix icon of {@link InputFrame}. */
import type { IconComponent } from "../primitives/icons";
import {
  Pressable,
  StyleProp,
  View,
  ViewStyle,
} from "../primitives/reactNative";

/**
 * The trailing icon. With a `label` + `onPress` it is a focusable button; with
 * `onPress` alone it is a mouse-only affordance (kept out of the tab order and
 * a11y tree, matching the date field's calendar icon); otherwise it is purely
 * decorative.
 */
export function SuffixAdornment({
  Icon,
  color,
  hitSlop,
  label,
  onPress,
  size,
  style,
}: {
  Icon: IconComponent;
  color: string;
  hitSlop: number | undefined;
  label?: string;
  onPress?: () => void;
  size: number;
  style: StyleProp<ViewStyle>;
}) {
  const icon = <Icon color={color} size={size} />;
  if (!onPress) {
    return (
      <View aria-hidden style={style}>
        {icon}
      </View>
    );
  }
  if (label) {
    return (
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        hitSlop={hitSlop}
        onPress={onPress}
        style={style}
      >
        {icon}
      </Pressable>
    );
  }
  // Mouse-only affordance: a real press target, but skipped by the keyboard
  // (`tabIndex={-1}`) and hidden from assistive tech, because the action it
  // triggers already has an accessible path (e.g. focusing the input).
  return (
    <Pressable aria-hidden onPress={onPress} style={style} tabIndex={-1}>
      {icon}
    </Pressable>
  );
}
