/**
 * The default row layout for a {@link List}: an optional leading node (e.g. an
 * avatar), a bold title with an optional muted description stacked beneath it,
 * and an optional trailing accessory (e.g. a tag, amount, or chevron). The three
 * slots sit on one centred flex row; the title / description column flexes to
 * fill the space between the leading and trailing slots.
 */
import { ReactNode, useMemo } from "react";
import { Text, View } from "react-native";

import type { ControlSize } from "../controlSize";
import { useSharedUiTheme } from "../theme";

import { createListStyles } from "./listStyles";

export type ListItemProps = {
  /** Secondary line under the title. A string/number is given the muted text treatment; any node renders as-is. */
  description?: ReactNode;
  /** Leading slot, e.g. an `Avatar`. */
  leading?: ReactNode;
  /** Match the type scale to the list's `size`. Defaults to `md`. */
  size?: ControlSize;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  /** Primary line. A string/number is given the bold title treatment; any node renders as-is. */
  title: ReactNode;
  /** Trailing slot, e.g. a tag, amount, or chevron. */
  trailing?: ReactNode;
};

/**
 * A standard list row. `leading` and `trailing` render any node; `title` and
 * `description` get the default typography when passed a string/number, or
 * render as-is when passed a node — so the common text row needs no styling
 * while a custom row stays possible. The outer padding comes from the
 * {@link List} item wrapper, so this only owns the in-row layout.
 */
export function ListItem({
  description,
  leading,
  size = "md",
  testID,
  title,
  trailing,
}: ListItemProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createListStyles(theme, size), [theme, size]);
  return (
    <View style={styles.itemRow} testID={testID}>
      {leading != null ? (
        <View style={styles.itemLeading}>{leading}</View>
      ) : null}
      <View style={styles.itemMain}>
        {isText(title) ? <Text style={styles.itemTitle}>{title}</Text> : title}
        {isText(description) ? (
          <Text style={styles.itemDescription}>{description}</Text>
        ) : (
          (description ?? null)
        )}
      </View>
      {trailing != null ? (
        <View style={styles.itemTrailing}>{trailing}</View>
      ) : null}
    </View>
  );
}

/** A plain string/number is wrapped in the themed Text; richer nodes render as-is. */
function isText(value: ReactNode): value is number | string {
  return typeof value === "string" || typeof value === "number";
}
