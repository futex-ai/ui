/**
 * The default content layout for a Kanban card: a wrapping title, an optional
 * row of {@link KanbanChip}s, and an optional footer. The footer's common shape
 * — a small avatar and owner beside a right-aligned date — is built from the
 * `avatar` / `meta` / `date` slots, or replaced wholesale with a `footer` node.
 *
 * Like {@link ListItem} for the List, this is a convenience: the board's
 * `renderCard` callback can return any node, but most cards are a title + chips
 * + footer, and this keeps their typography and spacing consistent. The card's
 * frame (border, padding, shadow, and the pressable hover / focus states) is
 * owned by the board, so this only lays out the in-card content.
 */
import { useMemo } from "react";
import type { ReactNode } from "react";
import { Text, View } from "react-native";

import type { ControlSize } from "../controlSize";
import { useSharedUiTheme } from "../theme";

import { createKanbanStyles } from "./kanbanStyles";

export type KanbanCardProps = {
  /** A small avatar for the footer, e.g. an `Avatar` sized to {@link kanbanAvatarDiameter}. Ignored when `footer` is set. */
  avatar?: ReactNode;
  /**
   * The card's tags, typically {@link KanbanChip}s — the channel, a score, a
   * file count. Rendered as a wrapping row; omit for a card with no chips.
   */
  chips?: ReactNode[];
  /** A right-aligned footer date / timestamp. A string is given the muted mono treatment; any node renders as-is. Ignored when `footer` is set. */
  date?: ReactNode;
  /**
   * Replace the `avatar` / `meta` / `date` footer with a custom node. When set,
   * those three slots are ignored and this renders as the whole footer row.
   */
  footer?: ReactNode;
  /** Footer metadata beside the avatar, e.g. the owner's name. A string is given the muted treatment; any node renders as-is. Ignored when `footer` is set. */
  meta?: ReactNode;
  /** Match the type scale to the board's `size` — thread the same value the `Kanban` got through `renderCard`. Defaults to `md`. */
  size?: ControlSize;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  /** The card's primary line. A string is given the bold title treatment (and wraps); any node renders as-is. */
  title: ReactNode;
};

/**
 * A standard card body. `title` gets the bold, wrapping title treatment when
 * passed a string (richer nodes render as-is); `chips` lay out as a wrapping
 * row; and the footer is either the `avatar` / `meta` / `date` slots (avatar and
 * meta on the left, date pushed to the right) or a custom `footer` node. Pass
 * the board's `size` so the type scale matches.
 */
export function KanbanCard({
  avatar,
  chips,
  date,
  footer,
  meta,
  size = "md",
  testID,
  title,
}: KanbanCardProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createKanbanStyles(theme, size), [theme, size]);
  const hasSlotFooter =
    avatar != null || meta != null || date != null || footer != null;
  return (
    <View style={styles.cardInner} testID={testID}>
      {isText(title) ? <Text style={styles.cardTitle}>{title}</Text> : title}
      {chips && chips.length > 0 ? (
        <View style={styles.chipsRow}>{chips}</View>
      ) : null}
      {hasSlotFooter ? (
        <View style={styles.footer}>
          {footer != null ? (
            footer
          ) : (
            <>
              {avatar ?? null}
              {isText(meta) ? (
                <Text numberOfLines={1} style={styles.footerText}>
                  {meta}
                </Text>
              ) : (
                (meta ?? null)
              )}
              <View style={styles.footerSpacer} />
              {isText(date) ? (
                <Text numberOfLines={1} style={styles.footerText}>
                  {date}
                </Text>
              ) : (
                (date ?? null)
              )}
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

/** A plain string/number is wrapped in the themed Text; richer nodes render as-is. */
function isText(value: ReactNode): value is number | string {
  return typeof value === "string" || typeof value === "number";
}
