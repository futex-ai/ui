/** User avatar that renders initials on a themed disc or rounded square. */
import { useMemo } from "react";
import { StyleProp, Text, TextStyle, View, ViewStyle } from "react-native";

import { DotGridLoader } from "../loader/DotGridLoader";
import { LOADER_DURATIONS } from "../loader/loaderStyles";
import { useSharedUiTheme } from "../theme";

import { avatarLoaderSize } from "./avatarLoader";
import { avatarBorderRadius, type AvatarShape } from "./avatarRadius";
import { avatarForegroundColor, createAvatarStyles } from "./avatarStyles";

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
  /**
   * Swap the initials for an indeterminate dot-grid loader while the person or
   * entity behind the disc is still being fetched. The disc keeps its tone,
   * shape, and size, so nothing around it shifts when the load finishes.
   */
  loading?: boolean;
  /**
   * Disc geometry. `circle` (default) is a full disc; `square` is the same
   * 1:1 box with corners rounded by the theme's `radii.avatarRatio`.
   */
  shape?: AvatarShape;
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
 * A circular or rounded-square avatar showing initials. `size` drives the box,
 * the corner radius (`size / 2` for `circle`, `size * radii.avatarRatio` for
 * `square`), and the initials' font size (`size * 0.38`). The `solid` tone
 * fills the disc with the theme primary and white text; the `soft` tone uses
 * the soft tint with deep-primary text. `textColor` can override those
 * defaults when a consumer supplies a palette-specific disc color.
 *
 * While `loading`, the initials are replaced in place by the `dot-grid`
 * {@link Loader} shape drawn in the same foreground color, so the disc keeps
 * its fill, its corner, and its footprint for the whole load.
 */
export function Avatar({
  accessibilityLabel,
  decorative = false,
  label,
  loading = false,
  shape = "circle",
  size = 32,
  style,
  testID,
  textColor,
  tone = "solid",
}: AvatarProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createAvatarStyles(theme), [theme]);
  const solid = tone === "solid";
  const borderRadius = avatarBorderRadius(size, shape, theme.radii.avatarRatio);
  // A decorative disc is announced by nothing at all, so its loading state is
  // noise too — only an exposed avatar reports that it is busy.
  const busy = loading && !decorative;
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
      // A loading disc is no longer a picture of anyone — it is an
      // indeterminate progress indicator — so it takes `progressbar` + busy
      // semantics (matching {@link Loader}) under that same accessible name,
      // and reverts to `image` once the initials are there to stand for.
      accessibilityRole={
        busy ? "progressbar" : decorative ? undefined : "image"
      }
      accessibilityState={busy ? { busy: true } : undefined}
      aria-busy={busy || undefined}
      aria-hidden={decorative || undefined}
      importantForAccessibility={decorative ? "no-hide-descendants" : undefined}
      style={[
        styles.avatar,
        { borderRadius, height: size, width: size },
        solid ? styles.avatarSolid : styles.avatarSoft,
        style,
      ]}
      testID={testID}
    >
      {loading ? (
        // The grid is decorative: the container above already carries the busy
        // `progressbar` semantics and the accessible name, and the dots hold no
        // text of their own for assistive tech to reach.
        <View aria-hidden>
          <DotGridLoader
            color={avatarForegroundColor(theme, solid, textColor)}
            duration={LOADER_DURATIONS["dot-grid"]}
            size={avatarLoaderSize(size)}
          />
        </View>
      ) : (
        <Text
          // The disc is announced once via the container's `image` role + name,
          // so the raw initials are hidden from AT (web `aria-hidden`, native
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
      )}
    </View>
  );
}
