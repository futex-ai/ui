/**
 * The new-tab indicator of a link, and the note at the end of its name.
 *
 * A link that opens a new tab shows an arrow after its label. The arrow's text
 * alternative is the note, by default "(opens in a new tab)", so a link that
 * its text names ends with the note on web and native, static HTML included.
 * A link with an explicit name carries the note at the end of that name
 * instead, and the arrow is then decorative.
 */
import { ArrowUpRight } from "../primitives/icons";
import { Platform, StyleSheet, View } from "../primitives/reactNative";

/** The default note at the end of the name of a new-tab link. */
export const NEW_TAB_NOTE = "(opens in a new tab)";

/**
 * The explicit name of a link: the caller's label, followed by the new-tab
 * note on a new-tab link. Without a label, the content of the link names it,
 * and {@link NewTabIndicator} carries the note.
 */
export function linkName(
  label: string | undefined,
  newTab: boolean,
  note: string,
): string | undefined {
  if (label == null || label === "") {
    return undefined;
  }
  return newTab ? `${label} ${note}` : label;
}

export type NewTabIndicatorProps = {
  /** The arrow colour. */
  color: string;
  /**
   * The text alternative of the arrow: the new-tab note, when the content of
   * the link names it. Omit it when the link has an explicit name, which
   * already ends with the note; the arrow is then hidden from assistive
   * technology.
   */
  note?: string;
  /** The arrow diameter, in px. */
  size: number;
};

/** The arrow after the label of a new-tab link. */
export function NewTabIndicator({ color, note, size }: NewTabIndicatorProps) {
  const web = Platform.OS === "web";
  const glyph = web ? (
    <ArrowUpRight aria-hidden color={color} size={size} />
  ) : (
    <ArrowUpRight color={color} size={size} />
  );
  if (note == null) {
    return (
      <View
        aria-hidden={web ? true : undefined}
        pointerEvents="none"
        style={styles.slot}
      >
        {glyph}
      </View>
    );
  }
  return (
    <View
      accessibilityLabel={note}
      pointerEvents="none"
      role="img"
      style={styles.slot}
    >
      {glyph}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { alignItems: "center", flexShrink: 0, justifyContent: "center" },
});
