import { useId, type ReactNode } from "react";
import type { IconComponent } from "@firna/ui";
import { List, type ListItemLink } from "@firna/ui/list";
import { useSharedUiTheme } from "@firna/ui/theme";

import { classes } from "../common/classes";
import { useGlyphSize, useSurface } from "../common/Surface";
import styles from "./Rows.module.css";

type RowListProps<Item> = {
  /** The rows. The list gets its own copy, so read-only fixtures fit. */
  items: readonly Item[];
  itemKey: (item: Item) => string;
  /** The content of a row, usually a library `ListItem` at the `xs` size. */
  renderItem: (item: Item) => ReactNode;
  /** The destination of a row. A row with a destination is a link. */
  itemLink?: (item: Item) => ListItemLink | undefined;
  /**
   * Moves the rows out by their padding, so the row content lines up with
   * the headings and text around the list.
   */
  bleed?: boolean;
};

/**
 * The library `List` at the `xs` size: 26 px rows for one line on desktop.
 * On a phone the touch surface makes the rows 44 px, and the list draws a
 * hairline between them. A longer row grows with its content.
 */
export function RowList<Item>(props: RowListProps<Item> & { label?: string }) {
  const phone = useSurface() === "phone";
  return (
    <div className={classes(props.bleed && styles.bleed)}>
      <List
        accessibilityLabel={props.label}
        itemKey={props.itemKey}
        itemLink={props.itemLink}
        items={[...props.items]}
        renderItem={props.renderItem}
        separators={phone}
        size="xs"
      />
    </div>
  );
}

/** A titled group of rows, such as the pinned projects. */
export function RowSection<Item>(
  props: RowListProps<Item> & { title: string },
) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className={classes(styles.section, props.bleed && styles.bleed)}
    >
      <h3 className={styles.sectionTitle} id={id}>
        {props.title}
      </h3>
      <RowList {...props} bleed={false} />
    </section>
  );
}

/** A row title that holds more than text, with the metrics of a row title. */
export function RowTitle(props: { children: ReactNode }) {
  return <span className={styles.title}>{props.children}</span>;
}

/** Trailing row text, such as a time or a count, with row detail metrics. */
export function RowDetail(props: { children: ReactNode }) {
  return <span className={styles.detail}>{props.children}</span>;
}

/** A muted decorative glyph at the start of a row. */
export function RowIcon(props: { icon: IconComponent }) {
  const theme = useSharedUiTheme();
  const size = useGlyphSize();
  const Icon = props.icon;
  return <Icon aria-hidden color={theme.colors.muted} size={size} />;
}
