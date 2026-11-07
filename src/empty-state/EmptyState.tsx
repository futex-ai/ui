/**
 * A quiet message for a view with nothing to show: an optional decorative
 * icon, a title, an optional body, and optional actions.
 */
import { IconComponent } from "../primitives/icons";
import { ReactNode, useMemo } from "react";
import { StyleProp, Text, View, ViewStyle } from "../primitives/reactNative";

import { useSharedUiTheme } from "../theme";
import { useTextScale } from "../typography/textScale";

import {
  createEmptyStateStyles,
  emptyStateGlyphSize,
  type EmptyStateSize,
} from "./emptyStateStyles";

export type EmptyStateProps = {
  /**
   * Controls that lead on from the empty view, such as a link to connect a
   * source. Each stays its own control.
   */
  actions?: ReactNode;
  /** The body. A string or number takes the muted body text; any node renders as-is. */
  children?: ReactNode;
  /**
   * The heading level of the title in the page outline. The caller gives it,
   * because only the page knows its outline. It does not change the size.
   */
  headingLevel: 1 | 2 | 3 | 4 | 5 | 6;
  /** A decorative lucide glyph in a soft circle above the title. */
  icon?: IconComponent;
  /**
   * `page` (the default) centres in the area of a view. `panel` is smaller
   * and sits at the top of a side panel.
   */
  size?: EmptyStateSize;
  /** Extra style for the container. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the container (`data-testid` on web). */
  testID?: string;
  /** The message, as a heading at `headingLevel`. */
  title: string;
};

/**
 * An empty state. It is not a live region: a caller that must announce a
 * change, such as a search with no results, announces it separately. The text
 * follows the active text scale.
 */
export function EmptyState({
  actions,
  children,
  headingLevel,
  icon: Icon,
  size = "page",
  style,
  testID,
  title,
}: EmptyStateProps) {
  const theme = useSharedUiTheme();
  const scale = useTextScale();
  const styles = useMemo(
    () => createEmptyStateStyles(theme, scale, size),
    [theme, scale, size],
  );
  return (
    <View style={[styles.empty, style]} testID={testID}>
      {Icon ? (
        <View aria-hidden pointerEvents="none" style={styles.mark}>
          <Icon
            color={theme.colors.muted}
            size={emptyStateGlyphSize(size)}
            strokeWidth={1.75}
          />
        </View>
      ) : null}
      <Text
        // A heading at the caller's level, with the same metrics at every
        // level. Native has no heading level, so the header role stands alone.
        accessibilityRole="header"
        aria-level={headingLevel}
        style={styles.title}
      >
        {title}
      </Text>
      {typeof children === "string" || typeof children === "number" ? (
        <Text style={styles.body}>{children}</Text>
      ) : (
        (children ?? null)
      )}
      {actions != null ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}
