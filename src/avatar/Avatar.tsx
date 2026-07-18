/** Circular user avatar that renders initials on a themed disc. */
import { useMemo } from "react";
import { StyleProp, Text, TextStyle, View, ViewStyle } from "react-native";

import { useSharedUiTheme } from "../theme";

import { createAvatarStyles } from "./avatarStyles";

export type AvatarTone = "soft" | "solid";

export type AvatarProps = {
  /** Accessible name for the person/entity (e.g. their full name). Defaults to the visible initials. */
  accessibilityLabel?: string;
  /**
   * Hide the avatar from assistive tech. Use when the disc is purely decorative
   * and sits beside a visible label that already names the person/entity, so the
   * name is not announced twice.
   */
  decorative?: boolean;
  /** Short initials shown on the disc, typically one or two characters. */
  label: string;
  /** Diameter in pixels. The radius, and the initials' font size, scale with it. */
  size?: number;
  /** Override the container disc style without forking the component. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  /**
   * Override the initials color for palette-specific avatar discs. Must keep a
   * ≥4.5:1 contrast against the disc background (1.4.3) when supplied.
   */
  textColor?: TextStyle["color"];
  /** `solid` fills the disc with the primary color; `soft` uses the soft tint. */
  tone?: AvatarTone;
};

/**
 * A circular avatar showing initials. `size` drives the diameter, the circular
 * radius (`size / 2`), and the initials' font size (`size * 0.38`). The `solid`
 * tone fills the disc with the theme primary and white text; the `soft` tone
 * uses the soft tint with deep-primary text. `textColor` can override those
 * defaults when a consumer supplies a palette-specific disc color.
 */
export function Avatar({
  accessibilityLabel,
  decorative = false,
  label,
  size = 32,
  style,
  testID,
  textColor,
  tone = "solid",
}: AvatarProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createAvatarStyles(theme), [theme]);
  const solid = tone === "solid";
  return (
    <View
      // A decorative avatar is removed from the AT tree entirely (web `aria-hidden`,
      // native `importantForAccessibility` / `accessibilityElementsHidden`) so a
      // redundant disc beside a visible name is not announced twice. Otherwise the
      // disc is exposed as a single image whose name falls back to the visible
      // initials; an explicit `accessibilityLabel` (e.g. the full name) still wins.
      accessibilityElementsHidden={decorative}
      accessibilityLabel={
        decorative ? undefined : (accessibilityLabel ?? label)
      }
      accessibilityRole={decorative ? undefined : "image"}
      aria-hidden={decorative || undefined}
      importantForAccessibility={decorative ? "no-hide-descendants" : undefined}
      style={[
        styles.avatar,
        { borderRadius: size / 2, height: size, width: size },
        solid ? styles.avatarSolid : styles.avatarSoft,
        style,
      ]}
      testID={testID}
    >
      <Text
        // The disc is announced once via the container's `image` role + name, so
        // the raw initials are hidden from AT (web `aria-hidden`, native
        // `importantForAccessibility="no"`) to avoid a duplicate reading.
        aria-hidden
        importantForAccessibility="no"
        style={[
          styles.avatarText,
          { fontSize: size * 0.38 },
          solid ? styles.avatarTextSolid : null,
          textColor === undefined ? null : { color: textColor },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}
