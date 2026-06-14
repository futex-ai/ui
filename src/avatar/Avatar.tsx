/** Circular user avatar that renders initials on a themed disc. */
import { useMemo } from "react";
import { StyleProp, Text, View, ViewStyle } from "react-native";

import { useSharedUiTheme } from "../theme";

import { createAvatarStyles } from "./avatarStyles";

export type AvatarTone = "soft" | "solid";

export type AvatarProps = {
  /** Accessible name for the person/entity (e.g. their full name). Defaults to the visible initials. */
  accessibilityLabel?: string;
  /** Short initials shown on the disc, typically one or two characters. */
  label: string;
  /** Diameter in pixels. The radius, and the initials' font size, scale with it. */
  size?: number;
  /** Override the container disc style without forking the component. */
  style?: StyleProp<ViewStyle>;
  /** `solid` fills the disc with the primary color; `soft` uses the soft tint. */
  tone?: AvatarTone;
};

/**
 * A circular avatar showing initials. `size` drives the diameter, the circular
 * radius (`size / 2`), and the initials' font size (`size * 0.38`). The `solid`
 * tone fills the disc with the theme primary and white text; the `soft` tone
 * uses the soft tint with deep-primary text.
 */
export function Avatar({
  accessibilityLabel,
  label,
  size = 32,
  style,
  tone = "solid",
}: AvatarProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createAvatarStyles(theme), [theme]);
  const solid = tone === "solid";
  return (
    <View
      // Fall back to the visible initials so the disc always has an accessible
      // name; an explicit `accessibilityLabel` (e.g. the full name) still wins.
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        styles.avatar,
        { borderRadius: size / 2, height: size, width: size },
        solid ? styles.avatarSolid : styles.avatarSoft,
        style,
      ]}
    >
      <Text
        style={[
          styles.avatarText,
          { fontSize: size * 0.38 },
          solid ? styles.avatarTextSolid : null,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}
